/**
 * Explicit lifecycles (state machines) for every persisted status in the backend.
 *
 * Each machine names its states ONCE, documents its legal transitions, and exposes
 * ONE transition function per move. Route handlers must go through these functions
 * instead of writing `status` / `completed` / `decision` columns directly.
 *
 * Persisted values are unchanged (same columns, same strings). Readers are tolerant:
 * legacy or unknown values on disk are parsed, never thrown on, and an unknown state
 * simply has no legal outgoing transitions.
 */

// ── Generic machinery ────────────────────────────────────────────────────────

export class IllegalTransitionError extends Error {
  readonly machine: string;
  readonly from: string;
  readonly to: string;

  constructor(machine: string, from: string, to: string, reason?: string) {
    super(reason ?? `${machine}: illegal transition ${from} -> ${to}`);
    this.name = 'IllegalTransitionError';
    this.machine = machine;
    this.from = from;
    this.to = to;
  }
}

export interface Machine<S extends string> {
  readonly name: string;
  readonly states: readonly S[];
  readonly transitions: Readonly<Record<S, readonly S[]>>;
  /** Map a raw persisted value to a known state (legacy aliases applied), or undefined. */
  parse(raw: string | null | undefined): S | undefined;
  isState(raw: unknown): raw is S;
  canTransition(from: S | undefined, to: S): boolean;
  /** Throws IllegalTransitionError unless `from -> to` is legal. */
  assertTransition(from: S | undefined, to: S, rawFrom?: string | null): void;
}

export function defineMachine<S extends string>(config: {
  name: string;
  states: readonly S[];
  transitions: Record<S, readonly S[]>;
  legacyAliases?: Readonly<Record<string, S>>;
}): Machine<S> {
  const { name, states, transitions, legacyAliases = {} } = config;
  const isState = (raw: unknown): raw is S => typeof raw === 'string' && (states as readonly string[]).includes(raw);
  const canTransition = (from: S | undefined, to: S) => from !== undefined && transitions[from].includes(to);
  return {
    name,
    states,
    transitions,
    isState,
    parse(raw) {
      if (raw == null) return undefined;
      if (isState(raw)) return raw;
      return Object.prototype.hasOwnProperty.call(legacyAliases, raw) ? legacyAliases[raw] : undefined;
    },
    canTransition,
    assertTransition(from, to, rawFrom) {
      if (!canTransition(from, to)) {
        throw new IllegalTransitionError(name, from ?? String(rawFrom ?? 'unknown'), to);
      }
    },
  };
}

// ── Task completion ──────────────────────────────────────────────────────────
//
//   open ──complete──▶ completed
//
// Persisted as two columns: `completed` (boolean) + `completedAt` (timestamp).
// Invariant: completed === true  ⇔  completedAt !== null (for rows written via completeTask).
// Legacy rows with completed=true and completedAt=null still read as `completed`.

export const TASK_STATES = ['open', 'completed'] as const;
export type TaskState = (typeof TASK_STATES)[number];

export const taskMachine = defineMachine<TaskState>({
  name: 'task',
  states: TASK_STATES,
  transitions: { open: ['completed'], completed: [] },
});

export function taskState(row: { completed: boolean; completedAt?: Date | null }): TaskState {
  return row.completed ? 'completed' : 'open';
}

export function completeTask(row: { completed: boolean; completedAt?: Date | null }, now: Date = new Date()) {
  taskMachine.assertTransition(taskState(row), 'completed');
  return { completed: true, completedAt: now } as const;
}

// ── Space scan ───────────────────────────────────────────────────────────────
//
//   active ──complete──▶ completed
//
// Persisted in `space_scans.status` (DB default 'active').
// Legacy alias: 'pending' (an older client label for an in-progress scan) reads as 'active'.

export const SCAN_STATES = ['active', 'completed'] as const;
export type ScanState = (typeof SCAN_STATES)[number];

export const scanMachine = defineMachine<ScanState>({
  name: 'space_scan',
  states: SCAN_STATES,
  transitions: { active: ['completed'], completed: [] },
  legacyAliases: { pending: 'active' },
});

export function completeScan(
  row: { status: string },
  extra: { afterPhotoUri?: string; durationSeconds?: number },
  now: Date = new Date(),
) {
  scanMachine.assertTransition(scanMachine.parse(row.status), 'completed', row.status);
  return {
    status: 'completed' as ScanState,
    completedAt: now,
    ...(extra.afterPhotoUri ? { afterPhotoUri: extra.afterPhotoUri } : {}),
    ...(extra.durationSeconds ? { durationSeconds: extra.durationSeconds } : {}),
  };
}

// ── Capture item classification ──────────────────────────────────────────────
//
//   pending ──────classify──▶ classified ◀──┐
//   needs_review ─classify──▶ classified    │ reclassify (correction)
//                             classified ───┘
//
// Persisted in `capture_items.classificationStatus` (DB default 'pending').
// 'needs_review' is part of the shared contract and is accepted when read/filtered;
// nothing in the backend writes it today.

export const CAPTURE_STATES = ['pending', 'classified', 'needs_review'] as const;
export type CaptureState = (typeof CAPTURE_STATES)[number];

export const captureMachine = defineMachine<CaptureState>({
  name: 'capture_item',
  states: CAPTURE_STATES,
  transitions: {
    pending: ['classified'],
    needs_review: ['classified'],
    classified: ['classified'],
  },
});

export function classifyCapture(
  row: { classificationStatus: string },
  classification: { module: string; type: string; confidence: number },
) {
  captureMachine.assertTransition(captureMachine.parse(row.classificationStatus), 'classified', row.classificationStatus);
  return {
    classificationStatus: 'classified' as CaptureState,
    classifiedModule: classification.module,
    classifiedType: classification.type,
    classifiedConfidence: classification.confidence,
  };
}

// ── Project (PARA) ───────────────────────────────────────────────────────────
//
//   active ────archive──▶ archived
//   completed ─archive──▶ archived
//
// Persisted in `projects.status` (DB default 'active') coupled with `projects.area`.
// Invariant: status === 'archived'  ⇔  area === 'archives'.
// 'completed' is part of the shared contract; nothing writes it today.

export const PROJECT_STATES = ['active', 'completed', 'archived'] as const;
export type ProjectState = (typeof PROJECT_STATES)[number];
export const ARCHIVE_AREA = 'archives';

export const projectMachine = defineMachine<ProjectState>({
  name: 'project',
  states: PROJECT_STATES,
  transitions: { active: ['archived'], completed: ['archived'], archived: [] },
});

/** Initial status for a newly created project: a project filed under the archives area IS archived. */
export function initialProjectStatus(area: string | null | undefined): ProjectState {
  return area === ARCHIVE_AREA ? 'archived' : 'active';
}

export function archiveProject(row: { status: string }) {
  projectMachine.assertTransition(projectMachine.parse(row.status), 'archived', row.status);
  return { status: 'archived' as ProjectState, area: ARCHIVE_AREA };
}

// ── Goal ─────────────────────────────────────────────────────────────────────
//
//   active   completed   archived      (no transitions are implemented yet)
//
// Persisted in `goals.status` (DB default 'active'). Named here so filters are validated.

export const GOAL_STATES = ['active', 'completed', 'archived'] as const;
export type GoalState = (typeof GOAL_STATES)[number];

export const goalMachine = defineMachine<GoalState>({
  name: 'goal',
  states: GOAL_STATES,
  transitions: { active: [], completed: [], archived: [] },
});

// ── Detected item decision (space scans) ─────────────────────────────────────
//
//   undecided ──decide(x)──▶ x ∈ {keep, donate, sell, recycle, trash}
//   x ──────────decide(y)──▶ y   (users may change their mind)
//   (nothing returns to undecided)
//
// Persisted as `detected_items.decision` (DB default 'undecided') + `decidedAt`.
// Invariant: decision !== 'undecided'  ⇔  decidedAt !== null.

export const ITEM_DECISIONS = ['keep', 'donate', 'sell', 'recycle', 'trash'] as const;
export type ItemDecision = (typeof ITEM_DECISIONS)[number];
export const ITEM_DECISION_STATES = ['undecided', ...ITEM_DECISIONS] as const;
export type ItemDecisionState = (typeof ITEM_DECISION_STATES)[number];

export const itemDecisionMachine = defineMachine<ItemDecisionState>({
  name: 'detected_item_decision',
  states: ITEM_DECISION_STATES,
  transitions: {
    undecided: ITEM_DECISIONS,
    keep: ITEM_DECISIONS,
    donate: ITEM_DECISIONS,
    sell: ITEM_DECISIONS,
    recycle: ITEM_DECISIONS,
    trash: ITEM_DECISIONS,
  },
});

export function decideItem(row: { decision: string }, decision: ItemDecision, now: Date = new Date()) {
  itemDecisionMachine.assertTransition(itemDecisionMachine.parse(row.decision), decision, row.decision);
  return { decision, decidedAt: now };
}

// ── All machines (for exhaustive tests) ──────────────────────────────────────

export const ALL_MACHINES = [
  taskMachine,
  scanMachine,
  captureMachine,
  projectMachine,
  goalMachine,
  itemDecisionMachine,
] as const;

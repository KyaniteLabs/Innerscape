import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ALL_MACHINES,
  ARCHIVE_AREA,
  CAPTURE_STATES,
  GOAL_STATES,
  ITEM_DECISIONS,
  ITEM_DECISION_STATES,
  IllegalTransitionError,
  PROJECT_STATES,
  SCAN_STATES,
  TASK_STATES,
  archiveProject,
  captureMachine,
  classifyCapture,
  completeScan,
  completeTask,
  decideItem,
  goalMachine,
  initialProjectStatus,
  itemDecisionMachine,
  projectMachine,
  scanMachine,
  taskMachine,
  taskState,
  type CaptureState,
  type ItemDecisionState,
  type ProjectState,
  type ScanState,
  type TaskState,
} from '../../src/domain/lifecycles.js';

const NOW = new Date('2026-01-01T00:00:00Z');

// ── Expected transition tables (the spec). Typed as Record<State, ...> so adding a
// state to a machine without updating this table is a compile error, and the
// exhaustive loops below fail at runtime if the tables drift. ─────────────────

const TASK_TABLE: Record<TaskState, TaskState[]> = { open: ['completed'], completed: [] };
const SCAN_TABLE: Record<ScanState, ScanState[]> = { active: ['completed'], completed: [] };
const CAPTURE_TABLE: Record<CaptureState, CaptureState[]> = {
  pending: ['classified'],
  needs_review: ['classified'],
  classified: ['classified'],
};
const PROJECT_TABLE: Record<ProjectState, ProjectState[]> = {
  active: ['archived'],
  completed: ['archived'],
  archived: [],
};
const ITEM_TABLE: Record<ItemDecisionState, ItemDecisionState[]> = {
  undecided: [...ITEM_DECISIONS],
  keep: [...ITEM_DECISIONS],
  donate: [...ITEM_DECISIONS],
  sell: [...ITEM_DECISIONS],
  recycle: [...ITEM_DECISIONS],
  trash: [...ITEM_DECISIONS],
};
const GOAL_TABLE = { active: [], completed: [], archived: [] };

const SPECS = [
  { machine: taskMachine, table: TASK_TABLE as Record<string, string[]> },
  { machine: scanMachine, table: SCAN_TABLE as Record<string, string[]> },
  { machine: captureMachine, table: CAPTURE_TABLE as Record<string, string[]> },
  { machine: projectMachine, table: PROJECT_TABLE as Record<string, string[]> },
  { machine: goalMachine, table: GOAL_TABLE as Record<string, string[]> },
  { machine: itemDecisionMachine, table: ITEM_TABLE as Record<string, string[]> },
];

describe('every machine is covered by an exhaustive spec', () => {
  it('SPECS lists every machine exactly once', () => {
    expect(SPECS.map((s) => s.machine.name).sort()).toEqual(ALL_MACHINES.map((m) => m.name).sort());
  });

  for (const { machine, table } of SPECS) {
    describe(machine.name, () => {
      it('spec table covers exactly the machine states', () => {
        expect(Object.keys(table).sort()).toEqual([...machine.states].sort());
      });

      it('declared transition targets are all known states', () => {
        for (const from of machine.states) {
          for (const to of machine.transitions[from as never] as readonly string[]) {
            expect(machine.states).toContain(to);
          }
        }
      });

      for (const from of machine.states) {
        for (const to of machine.states) {
          const legal = table[from].includes(to);
          it(`${from} -> ${to} is ${legal ? 'legal' : 'refused'}`, () => {
            expect(machine.canTransition(from as never, to as never)).toBe(legal);
            if (legal) {
              expect(() => machine.assertTransition(from as never, to as never)).not.toThrow();
            } else {
              expect(() => machine.assertTransition(from as never, to as never)).toThrow(IllegalTransitionError);
            }
          });
        }
      }

      it('unknown persisted values parse to undefined and have no outgoing transitions', () => {
        expect(machine.parse('definitely-not-a-state')).toBeUndefined();
        expect(machine.parse(null)).toBeUndefined();
        for (const to of machine.states) {
          expect(machine.canTransition(undefined, to as never)).toBe(false);
        }
      });

      it('every state round-trips through parse', () => {
        for (const s of machine.states) expect(machine.parse(s)).toBe(s);
      });
    });
  }
});

// ── Persisted values are byte-compatible with the DB defaults / old writers ──

describe('persisted values', () => {
  it('state names match the strings already stored in the database', () => {
    expect([...TASK_STATES]).toEqual(['open', 'completed']); // derived, not stored
    expect([...SCAN_STATES]).toEqual(['active', 'completed']);
    expect([...CAPTURE_STATES]).toEqual(['pending', 'classified', 'needs_review']);
    expect([...PROJECT_STATES]).toEqual(['active', 'completed', 'archived']);
    expect([...GOAL_STATES]).toEqual(['active', 'completed', 'archived']);
    expect([...ITEM_DECISION_STATES]).toEqual(['undecided', 'keep', 'donate', 'sell', 'recycle', 'trash']);
  });

  it('legacy scan status "pending" reads as active', () => {
    expect(scanMachine.parse('pending')).toBe('active');
  });

  it('legacy task row (completed=true, completedAt=null) reads as completed', () => {
    expect(taskState({ completed: true, completedAt: null })).toBe('completed');
    expect(taskState({ completed: false, completedAt: null })).toBe('open');
  });
});

// ── Transition functions produce the exact column writes ──────────────────────

describe('transition functions', () => {
  it('completeTask writes completed + completedAt together', () => {
    expect(completeTask({ completed: false, completedAt: null }, NOW)).toEqual({ completed: true, completedAt: NOW });
    expect(() => completeTask({ completed: true, completedAt: NOW }, NOW)).toThrow(IllegalTransitionError);
  });

  it('completeScan writes status + completedAt and optional fields, refuses re-completion', () => {
    expect(completeScan({ status: 'active' }, {}, NOW)).toEqual({ status: 'completed', completedAt: NOW });
    expect(completeScan({ status: 'pending' }, { afterPhotoUri: 'x', durationSeconds: 5 }, NOW)).toEqual({
      status: 'completed',
      completedAt: NOW,
      afterPhotoUri: 'x',
      durationSeconds: 5,
    });
    expect(() => completeScan({ status: 'completed' }, {}, NOW)).toThrow(IllegalTransitionError);
    expect(() => completeScan({ status: 'mystery' }, {}, NOW)).toThrow(IllegalTransitionError);
  });

  it('classifyCapture writes all classification columns', () => {
    expect(classifyCapture({ classificationStatus: 'pending' }, { module: 'mind', type: 'note', confidence: 0.5 })).toEqual({
      classificationStatus: 'classified',
      classifiedModule: 'mind',
      classifiedType: 'note',
      classifiedConfidence: 0.5,
    });
    expect(() => classifyCapture({ classificationStatus: 'weird' }, { module: 'm', type: 't', confidence: 1 })).toThrow(
      IllegalTransitionError,
    );
  });

  it('archiveProject writes status and area together, refuses re-archive', () => {
    expect(archiveProject({ status: 'active' })).toEqual({ status: 'archived', area: ARCHIVE_AREA });
    expect(archiveProject({ status: 'completed' })).toEqual({ status: 'archived', area: ARCHIVE_AREA });
    expect(() => archiveProject({ status: 'archived' })).toThrow(IllegalTransitionError);
  });

  it('initialProjectStatus keeps status and area consistent', () => {
    expect(initialProjectStatus(ARCHIVE_AREA)).toBe('archived');
    for (const area of ['projects', 'areas', 'resources', undefined, null]) {
      expect(initialProjectStatus(area)).toBe('active');
    }
  });

  it('decideItem writes decision + decidedAt, never back to undecided', () => {
    for (const d of ITEM_DECISIONS) {
      expect(decideItem({ decision: 'undecided' }, d, NOW)).toEqual({ decision: d, decidedAt: NOW });
    }
    expect(() => decideItem({ decision: 'keep' }, 'undecided' as never, NOW)).toThrow(IllegalTransitionError);
  });
});

// ── Stateful property tests: random command sequences against a model ───────

type Row = {
  task: { completed: boolean; completedAt: Date | null };
  scan: { status: string; completedAt: Date | null };
  capture: { classificationStatus: string; classifiedModule: string | null };
  project: { status: string; area: string };
  item: { decision: string; decidedAt: Date | null };
};

function invariantsHold(r: Row) {
  expect(r.task.completed).toBe(r.task.completedAt !== null);
  expect(scanMachine.parse(r.scan.status)).toBeDefined();
  expect(r.scan.status === 'completed').toBe(r.scan.completedAt !== null);
  expect(captureMachine.parse(r.capture.classificationStatus)).toBeDefined();
  expect(r.capture.classificationStatus === 'classified').toBe(r.capture.classifiedModule !== null);
  expect(projectMachine.parse(r.project.status)).toBeDefined();
  expect(r.project.status === 'archived').toBe(r.project.area === ARCHIVE_AREA);
  expect(itemDecisionMachine.parse(r.item.decision)).toBeDefined();
  expect(r.item.decision === 'undecided').toBe(r.item.decidedAt === null);
}

/** Apply a transition; on refusal the row must be unchanged. */
function attempt<T extends object>(row: T, fn: () => Partial<T>): T {
  try {
    return { ...row, ...fn() };
  } catch (e) {
    expect(e).toBeInstanceOf(IllegalTransitionError);
    return row;
  }
}

const commandArb = fc.oneof(
  fc.constant({ kind: 'completeTask' as const }),
  fc.constant({ kind: 'completeScan' as const }),
  fc.record({ kind: fc.constant('classify' as const), module: fc.constantFrom('mind', 'flow', 'body', 'hub') }),
  fc.constant({ kind: 'archiveProject' as const }),
  fc.record({ kind: fc.constant('decide' as const), decision: fc.constantFrom(...ITEM_DECISIONS) }),
);

describe('stateful model test', () => {
  it('random transition sequences never reach an illegal state', () => {
    fc.assert(
      fc.property(fc.constantFrom('projects', 'areas', 'archives'), fc.array(commandArb, { maxLength: 40 }), (area, cmds) => {
        let r: Row = {
          task: { completed: false, completedAt: null },
          scan: { status: 'active', completedAt: null },
          capture: { classificationStatus: 'pending', classifiedModule: null },
          project: { status: initialProjectStatus(area), area },
          item: { decision: 'undecided', decidedAt: null },
        };
        invariantsHold(r);
        for (const c of cmds) {
          const before = JSON.stringify(r);
          switch (c.kind) {
            case 'completeTask':
              r = { ...r, task: attempt(r.task, () => completeTask(r.task, NOW)) };
              break;
            case 'completeScan':
              r = { ...r, scan: attempt(r.scan, () => completeScan(r.scan, {}, NOW)) };
              break;
            case 'classify':
              r = {
                ...r,
                capture: attempt(r.capture, () => {
                  const d = classifyCapture(r.capture, { module: c.module, type: 't', confidence: 1 });
                  return { classificationStatus: d.classificationStatus, classifiedModule: d.classifiedModule };
                }),
              };
              break;
            case 'archiveProject':
              r = { ...r, project: attempt(r.project, () => archiveProject(r.project)) };
              break;
            case 'decide':
              r = { ...r, item: attempt(r.item, () => decideItem(r.item, c.decision, NOW)) };
              break;
          }
          invariantsHold(r);
          // Terminal states stay terminal.
          const prev = JSON.parse(before) as Row;
          if (prev.task.completed) expect(r.task.completed).toBe(true);
          if (prev.scan.status === 'completed') expect(r.scan.status).toBe('completed');
          if (prev.project.status === 'archived') expect(r.project.status).toBe('archived');
          if (prev.item.decision !== 'undecided') expect(r.item.decision).not.toBe('undecided');
        }
      }),
      { numRuns: 300 },
    );
  });
});

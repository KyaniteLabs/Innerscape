/* Clean-room stubs for '@hermes/plugin-sdk'. Test state hangs off globalThis.__is. */
const is = () => globalThis.__is

export const PALETTE_AREA = 'palette'
export const ROUTES_AREA = 'routes'
export const SIDEBAR_NAV_AREA = 'sidebar.nav'
export const STATUSBAR_AREAS = { left: 'statusbar.left', right: 'statusbar.right' }

const component = (name) => { const c = () => null; c.displayName = name; return c }
export const Button = component('Button')
export const ConfirmDialog = component('ConfirmDialog')
export const EmptyState = component('EmptyState')
export const ErrorState = component('ErrorState')
export const Input = component('Input')
export const ListRow = component('ListRow')
export const SegmentedControl = component('SegmentedControl')
export const Skeleton = component('Skeleton')
export const Textarea = component('Textarea')
export const Tip = component('Tip')
export const ToggleRow = component('ToggleRow')

export function atom(value) {
  return { get: () => value, set: (v) => { value = v } }
}

export const host = {
  get onEvent() {
    if (is().eventsSupported === false) return undefined
    return (name, fn) => {
      const listeners = is().listeners.get(name) || new Set()
      listeners.add(fn)
      is().listeners.set(name, listeners)
      return () => { listeners.delete(fn); if (!listeners.size) is().listeners.delete(name) }
    }
  },
  navigate: (path) => is().navigations.push(path),
  notify: (m) => is().notifies.push(m),
  notifyError: (err, fallback) => is().errors.push([String(err?.message ?? err), fallback]),
  // newChat/composer exist only when a test asks for them (older hosts lack both).
  get newChat() { return is().chat ? () => { is().chat.opened++ } : undefined },
  get composer() {
    const c = is().chat
    if (!c) return undefined
    // `existing`: text already in the fresh chat's composer. `onTry`: runs before each setDraft (a test can dispose mid-transfer).
    const mounted = () => c.opened > 0 && c.drafts.length + 1 >= c.mountAfter
    return {
      getDraft: async (id) => (mounted() ? (c.existing ?? '') : null),
      setDraft: async (id, text) => { c.onTry?.(); c.drafts.push([id, text]); const ok = c.opened > 0 && c.drafts.length >= c.mountAfter; if (ok) c.existing = text; return ok }
    }
  }
}

export const relativeTime = (ms) => `t${ms}`
const unused = () => { throw new Error('hook called outside a render') }
export const useMutation = (options) => {
  // Like MutationObserver.setOptions, each render updates options on a pending mutation.
  const state = is().mutation ??= { options, pending: false }
  state.options = options
  return {
    get isPending() { return state.pending },
    mutate: (...variables) => {
      state.pending = true
      is().pendingMutation = Promise.resolve(state.options.mutationFn(...variables)).then(
        (data) => state.options.onSuccess?.(data, ...variables),
        (error) => state.options.onError?.(error, ...variables)
      ).finally(() => { state.pending = false })
    }
  }
}
export const usePluginI18n = unused
export const useQuery = unused
export const useQueryClient = unused
export const useValue = (value) => value.get()

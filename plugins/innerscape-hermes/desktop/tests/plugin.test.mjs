/**
 * Clean-room harness for desktop/plugin.js. Like the Desktop loader, it
 * rewrites the three allowed specifiers ('@hermes/plugin-sdk', 'react',
 * 'react/jsx-runtime') to shims, here clean-room stubs, then runs the real
 * module in node and checks registration, palette actions, stored-pref
 * hygiene, disposal and the pure helpers. Runs on Node 18+, no flags.
 *
 * It is not a render test: the page itself is checked in a real browser.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PLUGIN = resolve(HERE, '..', 'plugin.js')
const SOURCE = readFileSync(PLUGIN, 'utf8')
const STUBS = {
  '@hermes/plugin-sdk': 'plugin-sdk.mjs',
  react: 'react.mjs',
  'react/jsx-runtime': 'jsx-runtime.mjs'
}
const OUT = mkdtempSync(join(tmpdir(), 'innerscape-desktop-'))
let copies = 0

function freshGlobals() {
  globalThis.__is = { navigations: [], notifies: [], errors: [] }
  const head = []
  globalThis.document = {
    head: { appendChild: (el) => { head.push(el); el.remove = () => head.splice(head.indexOf(el), 1) } },
    createElement: (tag) => ({ tag, dataset: {}, textContent: '' })
  }
  return head
}

function makeCtx({ stored, storageThrows = false, rest } = {}) {
  const store = stored === undefined ? {} : { prefs: stored }
  const disposers = []
  const ctx = {
    registered: [],
    settings: [],
    bundles: [],
    rest: rest ?? (async () => ({ ok: true })),
    storage: {
      get: (k, fb) => { if (storageThrows) throw new Error('storage down'); return k in store ? store[k] : fb },
      set: (k, v) => { store[k] = v }
    },
    i18n: {
      register: (b) => { ctx.bundles.push(b); return () => {} },
      t: (key) => `t:${key}`
    },
    registerMany: (cs) => { ctx.registered.push(...cs); return () => {} },
    registerSettingsPage: (p) => { ctx.settings.push(p); return () => {} },
    onDispose: (fn) => disposers.push(fn),
    dispose: () => disposers.splice(0).forEach((fn) => fn()),
    _store: store
  }
  return ctx
}

// A fresh module instance per call, with its imports pointed at the stubs.
async function load() {
  let code = SOURCE
  for (const [spec, file] of Object.entries(STUBS)) {
    code = code.split(`from '${spec}'`).join(`from '${pathToFileURL(join(HERE, 'stubs', file)).href}'`)
  }
  const out = join(OUT, `plugin-${copies++}.mjs`)
  writeFileSync(out, code)
  return import(pathToFileURL(out).href)
}

test('imports only the three specifiers Desktop allows', () => {
  const specs = [...SOURCE.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]).sort()
  assert.deepEqual(specs, ['@hermes/plugin-sdk', 'react', 'react/jsx-runtime'])
})

test('no eval, Function constructor, dynamic import, raw network or browser storage', () => {
  const code = SOURCE.replace(/\/\/ --- ASSETS \(generated\)[\s\S]*?\/\/ --- \/ASSETS/, '')
  for (const [name, re] of [
    ['eval', /\beval\s*\(/],
    ['new Function', /new\s+Function\b/],
    ['dynamic import', /\bimport\s*\(/],
    ['fetch', /\bfetch\s*\(/],
    ['XMLHttpRequest', /XMLHttpRequest/],
    ['WebSocket', /WebSocket/],
    ['localStorage', /localStorage|sessionStorage|indexedDB/],
    ['innerHTML', /innerHTML|dangerouslySetInnerHTML/]
  ]) assert.doesNotMatch(code, re, `${name} must not appear`)
})

test('registers the page, nav, chip, four palette actions and a settings page', async () => {
  freshGlobals()
  const { default: plugin } = await load()
  assert.equal(plugin.id, 'innerscape')
  const ctx = makeCtx()
  plugin.register(ctx)
  const byId = Object.fromEntries(ctx.registered.map((c) => [c.id, c]))
  assert.deepEqual(Object.keys(byId).sort(), ['checkin', 'chip', 'journal', 'nav', 'open', 'page', 'unstuck'])
  assert.equal(byId.page.area, 'routes')
  assert.equal(byId.page.data.path, '/innerscape')
  assert.deepEqual(byId.nav.data, { path: '/innerscape', label: 't:name', codicon: 'heart' })
  assert.equal(byId.chip.area, 'statusbar.right')
  assert.deepEqual(['open', 'checkin', 'journal', 'unstuck'].map((id) => byId[id].data.id), ['innerscape.open', 'innerscape.checkin', 'innerscape.journal', 'innerscape.unstuck'])
  assert.equal(ctx.settings.length, 1)
  assert.equal(ctx.settings[0].id, 'settings')
  assert.ok(ctx.bundles[0].en && typeof ctx.bundles[0].en.name === 'string', 'English bundle registered')
})

test('palette actions set the focus target and open the page', async () => {
  freshGlobals()
  const { default: plugin, __internals: I } = await load()
  const ctx = makeCtx()
  plugin.register(ctx)
  const run = (id) => ctx.registered.find((c) => c.id === id).data.run()
  run('checkin')
  assert.equal(I.focusTarget.get(), 'checkin')
  run('journal')
  assert.equal(I.focusTarget.get(), 'journal')
  run('unstuck')
  assert.equal(I.focusTarget.get(), 'stuck')
  run('open')
  assert.equal(I.focusTarget.get(), null)
  assert.deepEqual(globalThis.__is.navigations, ['/innerscape', '/innerscape', '/innerscape', '/innerscape'])
})

test('stored prefs are untrusted: junk is dropped, a broken store falls back to defaults', async () => {
  freshGlobals()
  const { __internals: I } = await load()
  assert.deepEqual(I.cleanPrefs({ showChip: false, evil: '<script>' }), { showChip: false })
  for (const junk of [null, undefined, 'x', 42, [], { showChip: 'yes' }]) assert.deepEqual(I.cleanPrefs(junk), { showChip: true })

  const { default: plugin } = await load()
  const ctx = makeCtx({ storageThrows: true })
  assert.doesNotThrow(() => plugin.register(ctx))
})

test('dispose removes the stylesheet and forgets every draft', async () => {
  const head = freshGlobals()
  const { default: plugin, __internals: I } = await load()
  const ctx = makeCtx()
  plugin.register(ctx)
  assert.equal(head.length, 1)
  assert.equal(head[0].dataset.plugin, 'innerscape')
  I.drafts.set({ checkin: { energy: 9, valence: 'unpleasant', feeling: 'raw', body: 'tight chest' }, journal: 'private words', tags: 'a', stuck: 'the bill' })
  I.focusTarget.set('journal')
  ctx.dispose()
  assert.equal(head.length, 0)
  assert.deepEqual(I.drafts.get(), { checkin: { energy: 50, valence: '', feeling: '', body: '' }, journal: '', tags: '', stuck: '' })
  assert.equal(I.focusTarget.get(), null)
})

test('the status chip and page read the connection from /status', async () => {
  freshGlobals()
  const { __internals: I } = await load()
  const cases = [
    [null, null],
    [{ base_url: 'invalid: https only on loopback' }, 'server'],
    [{ token_set: false }, 'token'],
    [{ ok: false, token_set: true }, 'token'],
    [{ ok: true, token_set: true, token_expires_in_hours: 0 }, 'expired'],
    [{ ok: true, token_set: true, server: 'unreachable (refused)', token_expires_in_hours: 50 }, 'server'],
    [{ ok: true, token_set: true, server: 'up', token_expires_in_hours: 3 }, 'soon'],
    [{ ok: true, token_set: true, server: 'up', token_expires_in_hours: 72 }, 'ok']
  ]
  for (const [s, want] of cases) assert.equal(I.connState(s), want, JSON.stringify(s))
})

test('tags are trimmed and de-duplicated; a failed save throws the readable error', async () => {
  freshGlobals()
  const { __internals: I } = await load()
  assert.deepEqual(I.parseTags(' rain, , rain,walk ,'), ['rain', 'walk'])
  assert.throws(() => I.okOr({ ok: false, error: 'Innerscape refused the token (expired or wrong).' }), /expired or wrong/)
  assert.throws(() => I.okOr(null), /no answer/)
  assert.deepEqual(I.okOr({ ok: true, id: 1 }), { ok: true, id: 1 })
})

test('the coach opens a new chat and drafts the note; nothing is sent', async () => {
  freshGlobals()
  const { __internals: I } = await load()
  const t = (k, a) => (k === 'coach.prompt' ? `P:${a}` : k)
  assert.equal(I.coachPrompt('  the bill  ', t), 'P:the bill')
  assert.equal(I.coachPrompt('   ', t), 'coach.starter')

  // An older host without newChat/composer: report a miss, touch nothing.
  assert.equal(await I.handToCoach('x', { tries: 2, wait: 0 }), 'miss')

  // The composer mounts on the third try.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 3 }
  assert.equal(await I.handToCoach('P:the bill', { tries: 5, wait: 0 }), 'ok')
  assert.equal(globalThis.__is.chat.opened, 1)
  assert.deepEqual(globalThis.__is.chat.drafts.map(([id]) => id), ['new', 'new', 'new'])

  // It never mounts: give up after the retries, so the page keeps the words.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 99 }
  assert.equal(await I.handToCoach('x', { tries: 4, wait: 0 }), 'miss')
  assert.equal(globalThis.__is.chat.drafts.length, 4)

  // The fresh chat already holds other words: never overwrite them.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 1, existing: 'half a reply' }
  assert.equal(await I.handToCoach('x', { tries: 3, wait: 0 }), 'taken')
  assert.equal(globalThis.__is.chat.drafts.length, 0)
  assert.equal(globalThis.__is.chat.existing, 'half a reply')
})

test('the empty-box starter still names the coach skill', () => {
  assert.match(SOURCE, /starter: '[^']*innerscape:unstuck/)
  assert.match(SOURCE, /prompt: raw => `[^`]*innerscape:unstuck/)
})

test('get unstuck: success clears only the words handed over; a miss keeps them and leads back', async () => {
  freshGlobals()
  const { default: plugin, __internals: I } = await load()
  const ctx = makeCtx()
  plugin.register(ctx)
  const t = (k, a) => (k === 'coach.prompt' ? `P:${a}` : k)

  // Success, and the box was not touched meanwhile: cleared.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 1 }
  I.drafts.set({ ...I.drafts.get(), stuck: 'the bill' })
  await I.startCoach('the bill', t)
  assert.equal(I.drafts.get().stuck, '')
  assert.equal(I.transfer.get(), null)

  // Success, but the user typed more after pressing the button: kept.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 2, onTry: () => I.drafts.set({ ...I.drafts.get(), stuck: 'the bill, and the text' }) }
  I.drafts.set({ ...I.drafts.get(), stuck: 'the bill' })
  await I.startCoach('the bill', t)
  assert.equal(I.drafts.get().stuck, 'the bill, and the text')

  // A miss: the words stay, the page comes back with the box focused, the user is told.
  delete globalThis.__is.chat
  I.drafts.set({ ...I.drafts.get(), stuck: 'the bill' })
  await I.startCoach('the bill', t)
  assert.equal(I.drafts.get().stuck, 'the bill')
  assert.equal(I.focusTarget.get(), 'stuck')
  assert.deepEqual(globalThis.__is.navigations, ['/innerscape'])
  assert.equal(globalThis.__is.errors.at(-1)[1], 'err.coach')

  // A taken destination says so.
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 1, existing: 'other words' }
  await I.startCoach('the bill', t)
  assert.equal(globalThis.__is.errors.at(-1)[1], 'err.coachTaken')
  assert.equal(I.drafts.get().stuck, 'the bill')
})

test('disposing the plugin mid-transfer cancels it: nothing lands, nothing is held', async () => {
  freshGlobals()
  const { default: plugin, __internals: I } = await load()
  const ctx = makeCtx()
  plugin.register(ctx)
  const t = (k, a) => (k === 'coach.prompt' ? `P:${a}` : k)
  let tries = 0
  globalThis.__is.chat = { opened: 0, drafts: [], mountAfter: 99, onTry: () => { if (++tries === 2) ctx.dispose() } }
  I.drafts.set({ ...I.drafts.get(), stuck: 'private words' })
  const p = I.startCoach('private words', t)
  assert.ok(I.transfer.get(), 'busy while the transfer runs')
  await p
  assert.equal(tries, 2, 'no retries after dispose')
  assert.equal(I.transfer.get(), null)
  assert.equal(I.drafts.get().stuck, '')
  assert.deepEqual(globalThis.__is.errors, [])
  assert.deepEqual(globalThis.__is.navigations, [])
})

test('no brown, orange or amber in the stylesheet', async () => {
  freshGlobals()
  const { __internals: I } = await load()
  const hexes = [...I.CSS.matchAll(/#([0-9a-fA-F]{6})\b/g)].map((m) => m[1])
  assert.ok(hexes.length > 5, 'stylesheet carries its palette')
  for (const h of hexes) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min
    if (d < 0.08) continue // greys carry no hue
    let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    hue = (hue * 60 + 360) % 360
    assert.ok(hue < 15 || hue > 55, `#${h} sits in the brown/orange band (hue ${hue.toFixed(0)})`)
  }
})

test('the page never renders a raw tool error, and the pick hint keeps its space', () => {
  assert.doesNotMatch(SOURCE, /children:\s*d\.error\b/)
  assert.doesNotMatch(SOURCE, /d\.valence \? null/)
})

test('the page footer says it is not a crisis service and that coach notes reach the AI provider', () => {
  assert.match(SOURCE, /not a crisis service and not medical advice/)
  assert.match(SOURCE, /t\('care\.notService'\)/)
  assert.match(SOURCE, /it goes to your AI provider/)
})

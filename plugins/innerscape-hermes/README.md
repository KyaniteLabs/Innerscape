# Innerscape for Hermes

You're talking to your agent at the end of a long day and you want to note how it went, but opening another app breaks the moment. This plugin lets Hermes save a quick check-in or a journal entry to your own Innerscape server, and look back on today with you. It logs only what you say about yourself, asks before it saves any reflection, and never scores, labels or diagnoses a mood.

## What it adds

- **Four agent tools.**
  - `innerscape_checkin` saves one check-in in your words: energy from 0 to 100, whether it feels pleasant, unpleasant or neutral, and an optional feeling word and body note. It saves only when you asked to log it or said yes; the tool refuses unless `user_confirmed` is true.
  - `innerscape_journal` saves one journal entry, exactly as written. The agent must show you the text and any tags and get a yes first; the tool refuses unless `user_confirmed` is true.
  - `innerscape_capture` parks one item in your Innerscape inbox, such as a task you're putting down, an idea or a note for later. The agent shows you the exact words and asks first; the tool refuses unless `user_confirmed` is true.
  - `innerscape_today` reads today's counts (check-ins, journal entries, habits, tasks, captures) and your latest check-in with its date. A check-in the app inferred, rather than one you logged, is left out.
- **A slash command.** `/innerscape today | checkin <0-100> <pleasant|unpleasant|neutral> [feeling] | journal <text> | capture <text> | status | help`. Typing `journal` or `capture` with your text is your yes to saving it.
- **A Desktop page.** In Hermes Desktop, Innerscape gets its own page in the sidebar: today's counts and your latest check-in, an Unstuck Coach card, a check-in form, and a journal box. A journal entry is saved only after a dialog shows you the exact text and tags and you press Save. *Get unstuck* opens a new chat with your note in the composer, ready for the coach; nothing is sent until you press send. The command palette has *Innerscape: open*, *check in*, *write in journal* and *get unstuck*, and a small cairn in the status bar opens the page (you can hide it in Settings ▸ Plugins ▸ Innerscape).
- **The Unstuck Coach.** The bundled `unstuck` skill is an executive-function coach for when you want to do the thing and can't start, switch or stop. It names what's in the way without blame, gives one next move small enough to start in under two minutes, and holds the rest, offering to park it in your inbox. It reads your latest check-in to size the move, never diagnoses or advises on medication, never acts on your accounts, and stops coaching to point you to 988 or emergency services in a crisis. Adapted from Unstuck Coach (Kyanite Labs, MIT).
- **A reflection skill.** The bundled `innerscape` skill keeps the agent to one grounding observation, one small next step and one place to capture a follow-up. It carries the Innerscape guardrails: no diagnosis, no automated life decisions, consent before anything sensitive becomes a record, and small reversible steps when you're overwhelmed.

## Install

```bash
hermes plugins install KyaniteLabs/Innerscape/plugins/innerscape-hermes
hermes plugins enable innerscape
```

You need a running Innerscape backend (see the [main README](https://github.com/KyaniteLabs/Innerscape#readme)) and a token. Hermes asks for `INNERSCAPE_TOKEN` when you install.

On a fresh server, create your account first. The password needs at least 12 characters:

```bash
curl -s -X POST http://127.0.0.1:3001/api/v1/auth/register \
  -H 'content-type: application/json' -d @-
```

Then log in to get a token:

```bash
curl -s -X POST http://127.0.0.1:3001/api/v1/auth/login \
  -H 'content-type: application/json' -d @- | jq -r .token
```

Type `{"email":"you@example.com","password":"..."}`, press Ctrl-D, and put the printed token in `INNERSCAPE_TOKEN` (for example in `~/.hermes/.env`). Reading the body from the terminal keeps your password out of your shell history.

Then restart Hermes and try it:

```text
/innerscape status
/innerscape checkin 60 pleasant rested
```

The second line should answer `Saved a check-in: energy 60, pleasant, rested.`

Tokens last 7 days by default. `/innerscape status` shows whether the token is set, when it expires, and whether the server is up. It never prints the token.

## What it does on your machine

- **It talks only to your server.** Each call goes to `base_url` over the Innerscape REST API, using the Python standard library. Plain `http` is allowed only to this machine (`127.0.0.1`, `::1`, `localhost`); anywhere else needs `https`, so your token never crosses a network in clear text.
- **Your token stays put.** It is sent only as the `Authorization` header to `base_url`. Proxy settings in the environment are ignored and redirects are not followed, so neither a proxy nor a redirect can pick up the token. A token with spaces or control characters is refused before any request, and error messages have the token scrubbed out.
- **The token is a full-account key.** Innerscape has no read-only or scoped tokens yet, so the one in `INNERSCAPE_TOKEN` can read and change everything in your account. Keep it in `~/.hermes/.env`, not in a shared config.
- **It keeps nothing, but Hermes does.** The plugin writes no files and keeps no copy of what it sends; your entries live in your Innerscape database. What a tool returns goes to your model provider like any other tool result, and Hermes keeps it in the session history.
- **It reads back only what you logged.** `innerscape_today` drops the server's derived state labels, its low-energy streak count and any check-in the app inferred. The agent reflects; it doesn't classify you.
- **A save means a saved record.** The plugin reports a save only when the server answers with the new record. If the reply is missing or odd, it says the entry may or may not be saved.
- **The Desktop page uses the same client.** Its routes (`dashboard/plugin_api.py`, under `/api/plugins/innerscape/`) call the agent half's own functions, so the same token handling, limits and loopback rule apply. Hermes serves them only to an authenticated Desktop or dashboard session, and only while the plugin is enabled. The Get unstuck card has no route of its own: it hands your note to a new chat through the Desktop composer, and the coach runs there with the same tools and gates. The page keeps unsaved drafts in memory and forgets them when you quit or disable the plugin; it stores one setting, whether the status-bar cairn shows. While the page is open it refreshes today's counts and the connection once a minute.
- **Nothing runs in the background.** No telemetry, no scheduled check-ins, no automatic journaling. The plugin acts only when you or the agent call a tool or the slash command, and it refuses to save anything during a scheduled (cron) run.

## Settings

Set these under `plugins.entries.innerscape.settings`. The two `allow_` settings turn on only for a real `true`; a string such as `"false"` or `"yes"` leaves them off.

| Key | Default | What it does |
|---|---|---|
| `base_url` | `http://127.0.0.1:3001` | Your Innerscape API server. Plain `http` only to this machine |
| `allow_reads_on_gateway` | `false` | Allows reading today's counts and latest check-in from chat platforms |
| `allow_writes_on_gateway` | `false` | Allows saving check-ins, journal entries and inbox items from chat platforms such as Telegram or Discord |
| `timeout_seconds` | `10` | Overall time limit for each API call, including reading the reply (2 to 60) |

## Known issues

- **Off on chat platforms.** A Telegram or Discord chat can include other people, so reading `today` and saving check-ins, journal entries or inbox items are refused there unless you set `allow_reads_on_gateway: true` or `allow_writes_on_gateway: true`. Think about who else is in the chat before you turn either on.
- **A slow save may still land.** If the server times out after a check-in or journal entry was sent, it may already be saved. The error says so; check Innerscape before trying again.
- **Tokens expire.** After 7 days (or your server's `JWT_EXPIRES_IN`), calls fail with a message that says how to log in again. Hermes reads `INNERSCAPE_TOKEN` when it starts, so restart it after you change the token.
- **"Today" is the server's today.** The daily summary counts from midnight in the server's time zone, which may differ from yours.
- **The guardrails are instructions to the agent.** The consent checks in the tools are enforced in code, but "reflect, don't label" and the crisis guidance are instructions the model is asked to follow, not guarantees.
- **Not a crisis service.** Innerscape and this plugin are for everyday reflection. The tools and the skill tell the agent to stop and point to local emergency services or a crisis line (in the US, call or text 988) if you mention self-harm or a crisis.
- **`status` doesn't test the token.** The server has no "who am I" endpoint, so `status` reads the token's expiry date and checks `/health`. A wrong token shows up on the first real call.
- **Platforms.** Tested on Linux only. macOS and Windows are unverified.

## Tests

```bash
cd plugins/innerscape-hermes
python -m pytest tests -q
```

The tests run against a fake Innerscape API on `127.0.0.1` that checks request bodies the way the real server does, and the Hermes v0.21.6 `gateway/session_context.py`, vendored verbatim under `tests/hermes_runtime/` with its MIT license. They need `pytest`; the Desktop page's route tests also need `fastapi` and `httpx` and are skipped without them.

The Desktop half has its own check, on Node 18 or later:

```bash
cd plugins/innerscape-hermes/desktop
node --test tests/plugin.test.mjs
```

It runs the real `plugin.js` against stubbed SDK and React modules and checks what it registers, how it handles stored settings, that it forgets drafts on unload, and that it uses no `eval`, raw network calls or browser storage. It does not render the page. The page was rendered in headless Chrome, against a stand-in host with the Desktop theme, at 320 to 1440 px wide and with its journal dialog open.

After changing the fonts or the cairn, rebuild the embedded copies with `python3 tools/embed-assets.py`.

License: MIT, the same as Innerscape.

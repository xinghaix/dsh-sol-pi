# Native DeepSeek Harness plugin (`dsh-sol-pi`)

This checkout adds a **native Cordis plugin** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It is not a Pi ExtensionAPI shim. Algorithms live in `src/sol-core/`; the DSH adapter is `src/sol-dsh/`.

Pi support is unchanged: missing `sol-pi.json` still leaves every Pi mechanism **off**. DSH is the opposite: **installing the bundle is the opt-in**.

Configuration contract: [dsh-configuration.md](dsh-configuration.md). Research: [research-dsh-native-support.md](research-dsh-native-support.md).

## Current status

| Area | State |
|---|---|
| Host plugin | Shipped. Named exports `name` / `inject` / `apply` / `Config`. No `export default`. |
| Settings card | Shipped. **Settings → 插件 → 插件配置**. zh + en, follows **通用设置 → 语言**. No SoL language field. |
| Action Fusion | Shadows agent-scoped `edit`/`write` with optional `then_run` (session-start, created, and already-live agents). DSH has no first-party `then_run`. |
| ObservationPack | `tools/post-execute` returns `{ kind: "accept", content }`. Immediate dialect replaces test/build dumps (`go test`, `make`, fused `then_run`). `read` / `grep` / `git diff` / `git show` stay full. No `obs_recall`. |
| Evidence-Preserving Reducer | Registers **before** ObservationPack. Same post-execute decision shape + `ctx.llm.stream` (`purpose` unset) on `Agent.options` route. Fail-open. |
| Online Context Compact | Policy on `ctx.compaction` (`todo_write` + `compactNow`). `agent/pre-step` always calls `next()`. |
| Tests | `npm test` and `npm run check:dsh` cover config, locales, packaging, and the plugin export shape. |
| Upstream Pi | Unmodified. Do not fork Pi or DSH. |

Tested against DSH **0.1.5-rc.2** and Pi **0.84.2**. DSH is developer preview; public seams can move.

## Install (Web)

Requirements: Node.js 22.19+, a working `dsh` CLI, profile `web` (or another profile that loads `dsh-base`).

### From this GitHub repo (typical)

`dsh plugin add` is pnpm add in the profile directory. The Host/Web entries are committed JS under `dist/sol-dsh/` (Node will not strip types from `.ts` inside `node_modules`). Uninstall by **package name**, not the GitHub URL.

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi
dsh --profile web --dump-config    # composed tree must include a dsh-sol-pi row
dsh web                            # or: dsh --profile web
```

Then open **Settings → 插件**. The SoL card uses the same expandable chrome as bash / agent-loop. Language follows **Settings → 通用设置 → 语言**.

### From a local checkout

```bash
git clone https://github.com/xinghaix/dsh-sol-pi.git
cd dsh-sol-pi
npm ci --ignore-scripts
npm run build:dsh                  # host + Web client CJS factory
dsh plugin --profile web add "$(pwd)"
dsh --profile web --dump-config
dsh web
```

`build:dsh` regenerates `dist/sol-dsh/index.js` (Host) and `dist/sol-dsh/client.js` (Web settings card). GitHub installs use the committed `dist/` copies. The settings card registers at boot (`dsh.client.immediately`) into **Settings → 插件**.

### Other profiles

```bash
dsh plugin --profile tui add github:xinghaix/dsh-sol-pi
dsh plugin --profile headless add github:xinghaix/dsh-sol-pi
```

The settings card is `dsh.client.platform: web`. TUI/headless get the Host mechanisms only.

### Confirm

```bash
dsh --profile web --dump-config | grep -n dsh-sol-pi
```

You should see the bundle layer and a plugin row `id: dsh-sol-pi`. Restart `dsh web` after add.

### Remove

```bash
dsh plugin --profile web remove dsh-sol-pi
```

## What you get with no extra config

Installing the plugin enables:

- Action Fusion **on**
- ObservationPack **on**, `mode: immediate`, `fullSends: 0` (replaces test/build dumps; not git/grep retrieval)
- Evidence-Preserving Reducer **on**, reducer = current agent route
- Online Context Compact **on**, `cacheWriteReadRatio: 50`

Override in **Settings → 插件**, or in the profile / `$DSH_HOME/cordis.patch.yml`:

```yaml
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 30    # DeepSeek V4 Pro miss/hit
    evidencePreservingReducer:
      enabled: false             # logs must not leave the machine
```

Do not put API keys, URLs, or a language field in this namespace.

## Native seams (why install is not enough by itself)

DSH does not ship `then_run`. The plugin must **put it on the model-facing `edit`/`write` schema** via a scoped `tools.register` shadow, and must speak DSH contracts:

- `systemPrompt.section({ name, order, text })` — not Pi-style `{ id, source }`
- `tools/post-execute` returns `{ kind: "accept", content }` — not a raw tool result
- Fusion attaches on `agent/session-start`, `agent/created`, and `ctx.agents.list()` so a plugin loaded into an already-running `dsh web` still wraps live sessions
- After install, **restart `dsh web`** and confirm a new request’s `edit` schema includes `then_run`. The model still has to pass the field; the description and system section tell it to fuse test/build/run instead of a second `bash` turn.

## Security

EPR sends eligible diagnostic logs to the routed model. If that must not happen, set `evidencePreservingReducer.enabled: false` (or turn the switch off in the card). See [SECURITY.md](../SECURITY.md).

## Development

```bash
npm ci --ignore-scripts
npm run check          # typecheck + tests + check:dsh + pack
npm run build:dsh      # dist/sol-dsh/{index,client}.js
```

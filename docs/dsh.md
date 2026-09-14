# Native DeepSeek Harness plugin (`dsh-sol-pi`)

This checkout adds a **native Cordis plugin** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It is not a Pi ExtensionAPI shim. Algorithms live in `src/sol-core/`; the DSH adapter is `src/sol-dsh/`.

Pi support is unchanged: missing `sol-pi.json` still leaves every Pi mechanism **off**. DSH is the opposite: **installing the bundle is the opt-in**.

Configuration contract: [dsh-configuration.md](dsh-configuration.md). Research: [research-dsh-native-support.md](research-dsh-native-support.md).

## Current status

| Area | State |
|---|---|
| Host plugin | Shipped. Named exports `name` / `inject` / `apply` / `Config`. No `export default`. |
| Settings card | Shipped. **Settings → 插件 → 插件配置**. zh + en, follows **通用设置 → 语言**. No SoL language field. |
| Action Fusion | Per-agent scoped `edit`/`write` with optional `then_run`. Does not disable `tool-fs`. |
| ObservationPack | Default **immediate** spill dialect. Retrieval is `read` / `grep`. No `obs_recall`. `delayed` only archives (DSH has no silent projection hook). |
| Evidence-Preserving Reducer | `tools/post-execute` + `ctx.llm.stream` with `purpose` unset. Empty reducer route = current agent model. Fail-open. |
| Online Context Compact | Policy on `ctx.compaction` (`todo_write` boundaries + `compactNow`). No second engine. Default `cacheWriteReadRatio` **50** (DeepSeek Flash miss/hit). |
| Tests | `npm test` and `npm run check:dsh` cover config, locales, packaging, and the plugin export shape. |
| Upstream Pi | Unmodified. Do not fork Pi or DSH. |

Tested against DSH **0.1.5-rc.2** and Pi **0.84.2**. DSH is developer preview; public seams can move.

## Install (Web)

Requirements: Node.js 22.19+, a working `dsh` CLI, profile `web` (or another profile that loads `dsh-base`).

### From this GitHub repo (typical)

`dsh plugin add` is pnpm add in the profile directory. Git installs run `prepack`/`prepare`, so allow this package’s build scripts:

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi --allow-build dsh-sol-pi
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

`build:dsh` writes `dist/sol-dsh/client.js`. Without it the Host plugin can still load from TypeScript; the Web settings card will not.

### Other profiles

```bash
dsh plugin --profile tui add github:xinghaix/dsh-sol-pi --allow-build dsh-sol-pi
dsh plugin --profile headless add github:xinghaix/dsh-sol-pi --allow-build dsh-sol-pi
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
- ObservationPack **on**, `mode: immediate`, `fullSends: 0`
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

## Security

EPR sends eligible diagnostic logs to the routed model. If that must not happen, set `evidencePreservingReducer.enabled: false` (or turn the switch off in the card). See [SECURITY.md](../SECURITY.md).

## Development

```bash
npm ci --ignore-scripts
npm run check          # typecheck + tests + check:dsh + pack
npm run build:dsh      # dist/sol-dsh/{index,client}.js
```

# DeepSeek Harness native plugin surface (SoL-Pi port feasibility)

- **Date:** 2026-09-14
- **DSH version researched:** `@deepseek-ai/dsh@0.1.5-rc.2` (local install)
- **Primary tree:** `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/`
- **Official repo (referenced by every package `repository` field):** <https://github.com/deepseek-ai/deepseek-harness>
- **Official npm:** `@deepseek-ai/dsh`
- **Method:** primary sources only — installed package READMEs, `lib/types/*.d.ts`, `cordis.patch.yml`, and the CLI boot/plugin code. Source-repo docs (`docs/cookbook/adding-a-tool.md`, `docs/cordis-primer.md`, `docs/subsystems/*`) are cited only as *references named by those READMEs*; they are **not present in the npm install** and could not be fetched from GitHub in this environment. No APIs are invented.

**Verdict in one line:** a native DSH plugin is a first-class, documented path (Cordis plugin + profile bundle patch + optional `dsh.client` web bundle). Several SoL-Pi-like mechanisms already ship in `dsh-base`. The hard gap is **rewriting the conversation the loop is about to send**: loop-built `GenerateOptions` are frozen, `agent/request` cannot mutate messages, and `tools/pre-execute` cannot rewrite arguments.

---

## 1. Native plugin authoring model

DSH's public slogan is "Everything is a Plugin." The launcher (`dsh`) does not run a single app binary: it boots a **profile**, which is an ordered stack of **plugin-bundle patch layers** under the user's own overrides.

### 1.1 Profiles, bundles, patches

From `@deepseek-ai/dsh` README and `@deepseek-ai/dsh-app-boot`:

- `dsh --profile <name>` boots `$DSH_HOME/profiles/<name>`.
- A profile directory holds:
  - `package.json` with `dsh.profile` (`bundles` list + `patchReload: live | startup`)
  - `cordis.patch.yml` (the user's own patch layer)
- Composition over an **empty root**, in order:
  1. each bundle's `cordis.patch.yml` in `dsh.profile.bundles` order
  2. the profile's `cordis.patch.yml`
  3. the home-level `$DSH_HOME/cordis.patch.yml`
  4. `--patch` overlays
- Bundles named in `dsh.profile.bundles` resolve **installation-first** (`@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app`, …) then from the profile's `node_modules` (where `dsh plugin` installs out-of-tree plugins).
- A bundle is an npm package whose `package.json` declares:

```json
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
```

Typed as `DshBundleManifest.patch` in `@deepseek-ai/dsh-package-manifest` (`lib/types/types.d.ts`). A listed bundle **without** `dsh.bundle` fails startup loudly (`loadProfile` in `dsh-app-boot/lib/types/profile.d.ts`).

Shipped templates (`PROFILE_TEMPLATES` in `dsh-app-boot/lib/index.js`):

| Profile | Bundles | `patchReload` |
|---|---|---|
| `web` | `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app` | `live` |
| `headless` | `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-headless` | `startup` |
| `sdk` | `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-sdk-app` | `startup` |
| `sdk-minimal` | `@deepseek-ai/dsh-sdk-minimal` (standalone, no base) | `startup` |
| `acp` | `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-acp-app` | `startup` |

`desktop` is reserved for Electron and rejected by the CLI (`lib/bin.js` `rejectElectronProfile`). There is **no shipped `tui` template** in 0.1.5-rc.2; the CLI README mentions TUI only as an example of a custom installed profile.

`patchReload: live` watches both user patch files and recomposes without restart; `startup` applies once. Custom profiles default to `live` (`DEFAULT_PROFILE_PATCH_RELOAD`).

**Patch semantics (load-bearing):** a patch that matches an `id` **replaces the targeted row's whole `config`**, it does not deep-merge (`dsh-base` README; `dsh-app-boot` Known Limitations). Restate every field you keep. `[]` disables a user layer; an empty/comments-only file fails boot.

Patch YAML dialect (`PatchOptions` in `@deepseek-ai/cordis-plugin-include/lib/types/index.d.ts`):

```ts
export interface PatchOptions {
  id?: string
  insert?: EntryOptions[]
  name?: string
  config?: any
  group?: boolean | null
  disabled?: boolean | null
  inject?: any
  intercept?: any
  isolate?: any
  [key: string]: any
}
```

Loader entry fields (`cordis-plugin-loader` README): `id`, `name` (module specifier), `config`, `group`, `disabled`, `inject`.

`!!js` scalars are evaluated at entry activation (`entryListSchema` in `cordis-plugin-include`; `dshHomePath` is exposed on `Context` for those expressions — `dsh-app-boot/lib/types/index.d.ts`).

Inserted plugin names may be absolute filesystem paths, file URLs, or package specifiers. Patch loading converts absolute and patch-relative `./` / `../` paths to file URLs within `insert` rows (`dsh-app-boot` README).

Inspect composition without booting: `dsh --profile <name> --dump-config` / `--dump-default-config`.

### 1.2 Installing a third-party plugin

`dsh plugin --profile <name> <pnpm args>` (`lib/plugin-Ddi42qoW.js`):

1. Initializes the profile on first use from a shipped template, or `DEFAULT_PROFILE_BUNDLES` (`["@deepseek-ai/dsh-base"]`) for a new name.
2. Forwards remaining args to `pnpm` in the profile directory (relative `file:`/`link:`/`.` specs are re-anchored to the invoking cwd).
3. Reconciles `dsh.profile.bundles`: a dependency whose installed package declares `dsh.bundle.patch` is **appended** to the layer stack; a removed or bundle-less dependency leaves it. In-box bundles from the template are not dependencies and are never touched.
4. Warns once for a newly-added bundle-less dependency (installed as a plain library, not a profile layer).

So the **native third-party packaging contract** is: publish an npm package that (a) exports a Cordis plugin at `.`, (b) ships `cordis.patch.yml`, (c) declares `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`. Then `dsh plugin --profile web add <pkg>` is enough.

A plugin that is **not** a bundle can still be mounted by inserting a row in the profile/home/`--patch` YAML (absolute path, file URL, or package specifier). That is how first-party optional tools such as `str_replace_editor` are documented (`dsh-base` README).

SoL-DSH config follows the first-party rule “do not hardcode tunable values”: export a Schemastery `Config` with `.default()` on every metric. Omitted user config ⇒ SoL’s DSH best profile (not Pi’s all-false `sol-pi.json`). Contract: [`dsh-configuration.md`](dsh-configuration.md).

### 1.3 Cordis plugin class / function / object

DSH plugins are Cordis plugins. `@deepseek-ai/cordis` (`lib/types/registry.d.ts`) accepts three entrypoint shapes:

```ts
export type Plugin<T = any> =
  | Plugin.Function<T>      // (ctx, config) => any, plus Base metadata
  | Plugin.Constructor<T>   // class constructed with (ctx, config)
  | Plugin.Object<T>        // { apply(ctx, config) }
```

Shared metadata (`Plugin.Base`): `name?`, `Config?` (Standard Schema / schemastery), `inject?` (required services), `provide?`, `intercept?`.

The Loader's `unwrapExports` normalizes ESM/CJS/default export shapes (`cordis-plugin-loader/lib/types/index.d.ts`). **First-party DSH tools deliberately do not use `export default`:** `dsh-tool-todo` README, "Export shape":

> The plugin is a function/namespace plugin: it exports `name` / `inject` / `apply` and no default export. A stray `export default` would make the Loader's `unwrapExports` collapse the module and drop `inject` (see postmortem 0001).

Canonical first-party shape (`dsh-tool-todo/lib/types/index.d.ts`):

```ts
export declare const name = "tool-todo"
export declare const inject: string[]
export declare const Config: z<Config>
export declare function apply(ctx: Context, config: Config): void
```

Service plugins subclass `Service` from `@deepseek-ai/cordis` and `super(ctx, name)` to register on `Context` (`cordis/lib/types/service.d.ts`). Examples: `ToolRuntime` (`ctx.tools`), `AgentRegistry` (`ctx.agents`), `LlmRuntime` (`ctx.llm`), `CompactionEngine` (`ctx.compaction`), `SessionStore` (`ctx.sessions`), `SystemPrompt` (`ctx.systemPrompt`).

`inject` holds the plugin pending until named services exist. Activation is service-availability driven; row order in a patch carries no load semantics (`dsh-base/cordis.patch.yml` comment).

`ctx.plugin(plugin, config)` / `ctx.inject(deps, callback)` load more plugins from inside a plugin (`cordis/lib/types/registry.d.ts`). Fibers dispose effects (listeners, registrations, child plugins) on unload — this is the HMR/cleanup contract.

### 1.4 Client (web GUI) half

A package may also declare `dsh.client` (`DshClientManifest` in `dsh-package-manifest`):

```ts
{
  platform: string          // Web consumer selects 'web'
  inject?: string[]         // informational package-name deps, NOT Cordis service injection
  immediately?: boolean     // boot phase-one barrier
  external?: string[]       // extra module-table requests beyond the implicit baseline
}
```

`@deepseek-ai/dsh-client-modules` scans enabled Loader entries whose packages declare `dsh.client`, serves built `./client` bundles under `/plugins`, and injects `window.__DSH_BOOT__`. Requirements:

- export `./client` (built `lib/client.js`; missing bundle fails activation)
- `platform: 'web'`
- client `apply(ctx)` registers UI (typically Cordis slots)

Web tool cards do **not** consume host `presentCall()` / `presentResult()`. They register keyed views on `tool.call.toolview` (`dsh-client-ui-tool` README):

```text
ctx.slots.inject('tool.call.toolview', () =>
  ctx.slots.register({
    name: 'tool.call.toolview',
    key: '<wire tool name>',
  }, BusinessToolRow))
```

### 1.5 First-party bundle that a SoL plugin would sit on

`@deepseek-ai/dsh-base/cordis.patch.yml` is the shared core of `web` / `headless` / `sdk` / `acp`. It already inserts (among many others): `llm`, `session`, `agent`, `agent-loop`, `tools`, `system-prompt`, `tool-bash` / `tool-pwsh`, `tool-fs`, `compaction-basic`, `command-compact`, `tool-result-pruner`, `spill-policy`, `plan-mode`, `tool-todo`, `session-persistence-jsonl` (`root: !!js dshHomePath('sessions')`), `storage-json` (`root: !!js dshHomePath('storages')`).

A SoL-Pi native plugin should be a **later bundle** (or a user-layer `insert`) that programs against those services. It should not fork `dsh-base`.

---

## 2. Event / service surface (Pi-hook analogs)

DSH has two event buses:

1. **Cordis `Events`** (process-local, typed via `declare module '@deepseek-ai/cordis'`). Modes: `emit` (fire-and-forget, contained), `serial` (awaited in order), `waterfall` (around-middleware with `next()`), `parallel` (`session/flush`).
2. **Session log events** (`SessionEventMap`, declaration-merged). Durable, reconstructable. Surface events (`user/message`, `assistant/message`, `tool/result`, `system/message`) require `surfaceOp`; log-only events (`compaction/*`, `hook/*`, `command/*`, `turn/*`, `step/*`, `request/header`) do not enter `deriveMessages()`.

Many Cordis events are **scope-filtered** (`@deepseek-ai/dsh-scope`): an `agent.ctx.on(...)` listener receives only that agent's traffic. Registry-change events (`tools/change`, `system-prompt/change`) are deliberately unfiltered.

### 2.1 Pi-hook mapping

| Pi-style hook | DSH analog | Kind | Can veto / rewrite? | Source |
|---|---|---|---|---|
| `session_start` | `agent/session-start` | Cordis `emit` | **No veto.** Sync notification; use `agent.inject()` to seed context. Async composition that must finish before publication belongs in `CreateAgentOptions.setup`. `SessionStartSource` = `'startup' \| 'resume' \| 'clear' \| 'compact'` — `'clear'`/`'compact'` are **reserved with no emitter yet** (`dsh-agent` Dev Note). | `dsh-agent/lib/types/runtime-types.d.ts` |
| agent published | `agent/created` | Cordis `emit` | Sync throw vetoes publication | same |
| agent gone | `agent/disposed` | Cordis `emit` | observe | same |
| idle/running | `agent/status` | Cordis `emit` | observe (`idle` ⇄ `running`) | same |
| context projection | `Session.deriveMessages()` + `ctx.systemPrompt.assemble()` + `system-prompt/assemble` | method + waterfall | **Prompt/tools/variables:** waterfall may mutate `PromptAssembly`. **History:** surface is the sole source; compaction `replace` is the supported rewrite. | `dsh-session`, `dsh-system-prompt` |
| `before_provider_request` (config) | `agent/request` | Cordis waterfall | Replace **frozen call config** (`LlmCallConfig`) only. **Cannot mutate messages.** Runs after assembly/`step/start`, before prompt+users are committed. | `dsh-agent/lib/types/runtime-types.d.ts` |
| `before_provider_request` (stream) | `llm/stream` | Cordis waterfall | Loop-built requests arrive **deep-frozen** (mutation throws). Hand-built one-shots are not frozen the same way. Can short-circuit by yielding own chunks. | `dsh-llm/lib/types/index.d.ts` |
| admit/replace step batch | `agent/pre-step` | Cordis waterfall | `{ kind: 'reject' }` or `{ kind: 'enter', messages, startsRequestSeries? }` | `dsh-agent` |
| `tool_call` / pre-tool | `tools/pre-execute` | Cordis waterfall | `allow` / `deny` / `ask`. **Cannot rewrite `exec.arguments`.** | `dsh-tools/lib/types/index.d.ts` |
| wrap tool body | `tools/execute` | Cordis waterfall | Around-dispatch. May replace only `exec.signal`. Timeout policy is the shipped example. | `dsh-tools`, `dsh-tool-call-timeout-policy` |
| `tool_result` (mutate) | `tools/post-execute` | Cordis waterfall | `accept` (optionally replace `content` **or** `value`) / `block` with feedback; may attach `additionalContexts` | `dsh-tools` |
| `tool_result` (observe) | `tools/result` | Cordis `emit` | Frozen final outcome. Listener failures contained. | `dsh-tools` |
| `turn_end` | `agent/turn-stopping` | Cordis `serial` | Awaited before the boundary commits. Steer (`agent.steer(...)`) to keep the turn open. Inverse: tool result `concludesTurn`. | `dsh-agent` |
| `agent_settled` | `Agent.whenIdle()` + `agent/status` `{ status: 'idle' }` | method + emit | `whenIdle()` resolves after whole-agent quiescence. Not a named event. | `dsh-agent` |
| request failed | `agent/request-error` | Cordis waterfall | Return `{ kind: 'retry' }` without `next()`, else terminal | `dsh-agent` |
| compaction | `ctx.compaction.compactIfNeeded` / `compactNow` / `compactRegion` | service | See §5 | `dsh-compaction` |
| Claude Code `SessionStart` etc. | `dsh-hooks-claude-code` maps onto the rows above | compatibility bridge | Native plugins should program the Cordis events directly (`dsh-hook-protocol` README: "a native Cordis plugin has the full harness API") | `dsh-hooks-claude-code` |

### 2.2 Full Cordis event table (plugin-relevant)

| Event | Package | Mode | Payload / contract | Path |
|---|---|---|---|---|
| `agent/created` | `dsh-agent` | emit | `{ agent }` | `lib/types/runtime-types.d.ts` |
| `agent/disposed` | `dsh-agent` | emit | `{ agent }` | same |
| `agent/status` | `dsh-agent` | emit | `{ agent, status: 'idle'\|'running' }` | same |
| `agent/session-start` | `dsh-agent` | emit | `{ agent, source: SessionStartSource }` | same |
| `agent/inbox/inserted` | `dsh-agent` | emit | `{ agent, message }` | same |
| `agent/inbox/claimed` | `dsh-agent` | emit | `{ agent, message, turn }` | same |
| `agent/inbox/discarded` | `dsh-agent` | emit | `{ agent, message }` | same |
| `agent/pre-step` | `dsh-agent` | waterfall | `{ agent, messages, turn, step, signal }` → `PreStepDecision` | same |
| `agent/request` | `dsh-agent` | waterfall | `{ agent, turn, step, signal }` → `LlmCallConfig` | same |
| `agent/request-error` | `dsh-agent` | waterfall | `{ agent, turn, step, provider, failure, retryPolicy, signal }` → `RequestErrorAction` | same |
| `agent/assistant-stream` | `dsh-agent` | emit | `{ agent, frame: AssistantStreamFrame }` (start/chunk/end; live, not replay source) | same |
| `agent/turn-stopping` | `dsh-agent` | serial | `{ agent, turn, signal }` | same |
| `agent/error` | `dsh-agent` | emit | `{ agent, turn, step, error }` | same |
| `session/created` | `dsh-session` | emit | `(session)` — sync throw vetoes | `lib/types/index.d.ts` |
| `session/disposed` | `dsh-session` | emit | `(session)` | same |
| `session/event` | `dsh-session` | emit | `(session, event)` post-commit firehose | same |
| `session/flush` | `dsh-session` | parallel | durability checkpoint | same |
| `tools/pre-execute` | `dsh-tools` | waterfall | `(exec, next)` → `PreToolDecision` | `lib/types/index.d.ts` |
| `tools/execute` | `dsh-tools` | waterfall | `(exec, next)` → `ToolExecutionResult` | same |
| `tools/post-execute` | `dsh-tools` | waterfall | `(exec, result, next)` → `PostToolDecision` | same |
| `tools/ptc-dispatch-log` | `dsh-tools` | waterfall | reshape durable `run_code` sub-dispatch log copy only | same |
| `tools/result` | `dsh-tools` | emit | frozen final `(exec, result)` | same |
| `tools/change` | `dsh-tools` | emit | registry/restriction change | same |
| `system-prompt/assemble` | `dsh-system-prompt` | waterfall | `(assembly, context, next)` → `PromptAssembly` | `lib/types/index.d.ts` |
| `system-prompt/change` | `dsh-system-prompt` | emit | any prompt provider change | same |
| `llm/stream` | `dsh-llm` | waterfall | `(options, next)` → `AsyncIterable<StreamChunk>` | `lib/types/index.d.ts` |
| `llm/adapters-updated` | `dsh-llm` | emit | topology change; re-read registries | `lib/types/types.d.ts` |
| `loader/config-update` | `cordis-plugin-loader` | emit | | `lib/types/index.d.ts` |
| `loader/entry-init` | `cordis-plugin-loader` | emit | `(entry)` | same |
| `exit` | `cordis-plugin-loader` | | `(signal)` | same |

Claude Code bridge mapping (for compatibility, not the recommended SoL path) — `dsh-hooks-claude-code` README:

| Claude Code hook | DSH extension point |
|---|---|
| `SessionStart` | `agent/session-start` (attach context) |
| `UserPromptSubmit` | `agent/pre-step` |
| `PreToolUse` | `tools/pre-execute` (`deny` or `ask`) |
| `PostToolUse` | `tools/post-execute` |
| `Stop` | `agent/turn-stopping` via `steer()` |
| `SubagentStart` / `SubagentStop` | `subagent/start` / `subagent/end` |

`HookOutput.updatedInput` is parsed but **not honored** (`dsh-hook-protocol` Known Limitations). `continue: false` is recorded but has **no run-level effect**.

### 2.3 Core services a plugin injects

| `ctx.*` | Class | Package | Role |
|---|---|---|---|
| `ctx.tools` | `ToolRuntime` | `dsh-tools` | register / restrict / guard / execute |
| `ctx.agents` | `AgentRegistry` | `dsh-agent` | create / resume / get / list / initiator scope |
| `ctx.sessions` | `SessionStore` | `dsh-session` | create live sessions |
| `ctx.llm` | `LlmRuntime` | `dsh-llm` | `stream`, `registerAdapter`, `listProviders`, `prepareCall` |
| `ctx.systemPrompt` | `SystemPrompt` | `dsh-system-prompt` | `section` / `context` / `variable` / `tools` / `assemble` |
| `ctx.compaction` | `CompactionEngine` (abstract; `BasicCompactionEngine` ships) | `dsh-compaction` / `dsh-compaction-basic` | compact |
| `ctx.toolResultPruner` | `ToolResultPruner` | `dsh-compaction-tool-result-pruner` | `pruneSession` / `pruneContent` |
| `ctx.tokenMeter` | (service) | `dsh-token-meter` | `measure(session)` / `estimateMessage` |
| `ctx.sessionProjections` | (registry) | `dsh-session-projection` | `register` / `snapshot` / `onChanged` |
| `ctx.commands` | (registry) | `dsh-commands` | `register({ name, handler })` slash commands |
| `ctx.sessionPersistence` | `SessionPersistence` | `dsh-session-persistence` + `dsh-session-persistence-jsonl` | durable logs |
| `ctx.loader` | `Loader` | `cordis-plugin-loader` | create/update/remove entries |

`Agent` handle (`dsh-agent/lib/types/runtime-types.d.ts`): `options`, `session`, `inbox`, `status`, `ctx` (scoped), `cancel`, `whenIdle`, `runMaintenance`, `send`, `followup`, `steer`, `inject`.

---

## 3. Tool registration / wrapping / replacement

### 3.1 Register a new tool

`ctx.tools.register(defineTool({...}))` (`dsh-tools` README + `lib/types/index.d.ts`).

```ts
import { defineTool } from '@deepseek-ai/dsh-tools'

ctx.tools.register(defineTool({
  name: 'read_file',
  description: 'Read a file from disk.',
  parameters: {
    path: { type: 'string', required: true, description: 'Absolute file path' },
  },
  output: {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: value }],
  },
  async execute(args, exec) {
    return readFile(args.path, { encoding: 'utf8', signal: exec.signal })
  },
}))
```

`register` returns the disposer that unregisters. Scoped registrations (`agent.ctx.tools.register`) **shadow** globals; duplicates **within one layer** fail:

> `tool "${name}" is already registered (for a per-agent variant, register through that agent's agent.ctx instead)`

(`dsh-tools/lib/index.js`). There is **no public "replace this global tool in place"** API.

Other registry methods:

- `ctx.tools.restrict({ allow?, deny? })` — per-agent mask over **inherited global** tools; scoped registrations stay visible; reserved `run_code` cannot be filtered.
- `ctx.tools.guard(guard)` — monotonic post-pre-execute denial (`string | undefined`). Cannot force-allow.
- `ctx.tools.get(name, scope?)` — definition as one scope sees it.
- `ctx.tools.schemas(scope?)` — model-facing `{ name, description, parameters }` only.
- `ctx.tools.presentAs(mode)` — per-scope `native` | `ptc` | `both`.
- `ctx.tools.execute(exec)` — full pipeline.

`ToolDefinition` extras: `finalizeContent?`, `timeoutMs?` (declarative; enforced only if `dsh-tool-call-timeout-policy` is mounted), `isConcurrencySafe?`, `presentCall?`, `presentResult?`. Host-local presenters may use the last two; **the built-in Web client does not** (`dsh-tools` README).

`ToolRunContext.deferContext(context)` attaches a `UserMessage` after the `tool/result`. `concludeTurn()` marks the successful result terminal for the current turn.

### 3.2 Wrap an existing tool (bash / edit / write)

**Supported wrap = the execution pipeline, not a monkey-patch of `execute`.**

| Need | Mechanism | Can it change bash/edit/write? |
|---|---|---|
| Deny / ask before run | `tools/pre-execute` | Yes. Cannot rewrite arguments (logged/presented args would desync; rewrite is a proposed Agent Note `2026-06-30-pre-tool-input-rewrite`). |
| Timeout / retry / metrics around body | `tools/execute` | Yes. Shipped: `dsh-tool-call-timeout-policy` wraps dispatch, swaps `exec.signal`, maps timeout to `TOOL_TIMEOUT`. Multiple wrappers compose by Cordis registration order. |
| Replace model-facing result | `tools/post-execute` | Yes. `accept` with new `content` or `value`, or `block` with feedback. Shipped: `dsh-spill-policy` prepends a listener to spill oversized plain text. |
| Observe only | `tools/result` | Yes. |
| Replace the tool implementation globally | Disable the base row + insert a new plugin that `register`s the same name, **or** scoped `agent.ctx.tools.register` shadow | Yes, but you own the whole schema+execute. Same-scope `register` of an existing name **throws**. |
| Patch the existing plugin's `config` | `cordis.patch.yml` `- id: tool-bash` / `tool-fs` with a full restated `config` | Only published config fields (e.g. bash `enableRunInBackground`, fs `readLimit`). Cannot swap `execute`. |

Default model-facing FS tools are **`read` / `write` / `edit`**, not `str_replace_editor` (`dsh-base` README; `dsh-tool-fs`). `str_replace_editor` is an explicit opt-in insert:

```yaml
- insert:
    - id: tool-str-replace-editor
      name: '@deepseek-ai/dsh-tool-str-replace-editor'
      config:
        maxOutputChars: 16000
```

Shell: macOS/Linux `bash` (`dsh-tool-bash`); Windows `pwsh`. Field names on FS tools are snake_case (`file_path`, `old_string`, `new_string`) to match Claude Code.

FS observation (read-before-edit) is **not** a tool wrap: `dsh-fs-observation-policy` listens to `fs/write-intent`, `fs/edit-intent`, `fs/observed` and is first-wins on those slots. Layered permission belongs on `tools/execute` instead (`dsh-fs-observation-policy` README).

MCP tools register on the same `ctx.tools` under `mcp__<server>__<tool>` (`dsh-mcp-client`).

### 3.3 TUI / web render of tool calls

**Web (shipped):** `dsh-client-ui-tool` renders the call tree. Built-in views cover generic fallback, bash/pwsh, read, read_image, write/edit, running `str_replace_editor` `create`/`str_replace`, grep/glob, web, todo, question, Code Dispatch. A third-party tool with a custom card **must** ship `dsh.client` + `./client` and register `tool.call.toolview` under its wire name. Unregistered names use `GenericToolCard`.

**TUI:** not a first-party profile in this install. `dsh-terminal` is a **persistent PTY session service** (`ctx.terminals`), not a chat TUI. A third-party TUI profile exists in the wild (`dsh-tui`) and consumes host events; this research does not treat it as a DSH public API.

Host `presentCall`/`presentResult` remain available for non-Web presenters.

---

## 4. Context transform (before LLM request)

This is the most important seam for a SoL-Pi port.

### 4.1 What the loop actually sends

Each step (`dsh-agent-loop` README):

1. Assemble prompt + tools via `ctx.systemPrompt.assemble({ agent, signal })`.
2. Project runtime context (dynamic `PromptContext` → sourced user-role snapshots).
3. `agent/pre-step`.
4. `step/start`, then `agent/request`, then `ctx.llm.prepareCall()`.
5. Reconcile the rendered system prompt against surviving `system/message` nodes; append accepted `user/message`s on the first attempt.
6. `session.deriveMessages()` + header tools → frozen `GenerateOptions`.
7. `ctx.llm.stream(options)` (with `llm/stream` waterfall).

`deriveMessages()` (`dsh-session/lib/types/index.d.ts`): walks the **surface** (not the raw log). Four surface types project: `system/message`, `user/message`, `assistant/message`, `tool/result`. Compaction `replace` deletes shadowed nodes from derivation. Returned `Message` objects are **shared and deep-frozen**.

### 4.2 What a plugin **can** transform

| Layer | API | Mutates conversation history? | Mutates this request's prompt/tools? |
|---|---|---|---|
| System prompt sections | `ctx.systemPrompt.section` / `variable` / `context` | No (prompt is a surface node, rewritten by the loop when text changes) | Yes, every assembly |
| Assembly waterfall | `system-prompt/assemble` | No | Yes — returned `PromptAssembly` is authoritative (except a `complete: true` section is restored afterwards) |
| Step admission | `agent/pre-step` | Replacing `messages` changes **what gets committed this step**, not prior history | Indirectly (admitted users) |
| Inject / steer | `agent.inject` / `agent.steer` | Appends user-role messages (inject does not wake) | Next admitted step |
| Tool post-policy | `tools/post-execute` `additionalContexts` | Appended after the tool result | Next request |
| Surface replace | `session.append(..., { surfaceOp: { op: 'replace', startSeq, endSeq } })` | Yes — this is compaction's mutation | Subsequent `deriveMessages()` |
| Call config | `agent/request` | No | Provider/model/effort/maxTokens only |

`MessageSource.kind: 'plugin'` with `plugin: string` plus optional `ContextForm` (`instructions` | `catalog` | `snapshot` | `notice` | `relay` | `recall`) is the attribution for injected context (`dsh-llm/lib/types/message.d.ts`).

### 4.3 What a plugin **cannot** transform

Documented, not inferred:

- **`agent/request` cannot mutate messages** (`runtime-types.d.ts` JSDoc: "Model-visible content must use logged channels; this waterfall cannot mutate messages.").
- **Loop-built `llm/stream` options are deep-frozen**; mutation throws (`dsh-llm` README + event JSDoc). Reconstructability invariant: anything that reaches a provider request is reconstructable from the session log.
- **`tools/pre-execute` cannot rewrite `exec.arguments`**.
- Compaction **cannot shrink** the system prompt, tools, or session prefix (`dsh-compaction` Known Limitations).
- There is **no** `before_provider_request` that receives a mutable `messages[]`.

**Implication for SoL-Pi observation packing / action fusion / context projection:** if those features need to rewrite the *already logged* tool results or assistant/user history for the *next* provider call without persisting a surface `replace`, **there is no public hook**. The supported approaches are:

1. Change what gets logged in the first place (`tools/post-execute`, `finalizeContent`, spill/pruner).
2. Persist a surface replacement (compaction-style) so `deriveMessages()` changes.
3. Inject extra context (additive, not a rewrite).
4. Mutate prompt assembly (tools/schemas/persona), not history.

PTC mode (`mode: ptc|both` on `dsh-tools`) is a presentation collapse (`run_code` + generated SDK), not a history rewriter. Intermediate PTC values are execution-local and never enter the conversation except the outer result (and optional image-bearing sub-results).

---

## 5. Compaction + continue

### 5.1 Contract (`dsh-compaction`)

Abstract service `ctx.compaction: CompactionEngine`:

```ts
abstract compactIfNeeded(agent, trigger: 'pressure' | 'context-overflow', signal): Promise<CompactionResult | null>
abstract compactNow(agent: ManualCompactAgentContext, signal, sourceCommandId?): Promise<CompactionResult | null>
abstract compactRegion(start, end, agent, signal?): Promise<CompactionResult>
```

A successful run:

1. appends log-only `compaction/start` (the lock),
2. summarizes,
3. appends log-only `compaction/summary`,
4. **one surface mutation**: `user/message` with `surfaceOp: { op: 'replace', startSeq, endSeq }` carrying the summary (checkpoint source `compactCheckpointSource`),
5. appends log-only `compaction/end`.

Helpers: `toolPairingBalancedBefore` / `toolPairingBalancedAfter` (safe edges; no unanswered tool call may cross a cut).

There is **no model-facing compaction tool**. Human `/compact` + automatic pressure only (`dsh-compaction` Known Limitations; Dev Note: model-facing tool undecided).

### 5.2 Shipped backend (`dsh-compaction-basic`)

Class `BasicCompactionEngine extends CompactionEngine` (`lib/types/index.d.ts`). Config (defaults): `thresholdRatio: 0.8`, `retainRatio: 0.16`, `maxTokens: 8192`, `compactionRetries: 1`, `maxOverflowRetries: 1`, `auto: true`, optional `summarizationProvider`/`summarizationModel`/`modelPolicies`.

**Automatic continue (this is the "compact then continue" path):**

1. **Pressure, mid-turn:** serial `agent/pre-step` listener calls `compactIfNeeded(agent, 'pressure', signal)`, then **always `next()`** — the step continues on the (possibly replaced) surface. Failure is logged; the turn continues with full history (`lib/index.js` `_registerAutomaticCompaction`).
2. **Overflow recovery:** `agent/request-error` listener, only when `failure.code === CONTEXT_WINDOW_EXCEEDED_CODE`. Calls `compactIfNeeded(..., 'context-overflow')`, and if `session.surface.replaceGeneration` advanced, returns **`{ kind: 'retry' }`** so the loop retries the same step on the compacted surface (capped by `maxOverflowRetries`).

Summarization is a **direct** `ctx.llm.stream()` with `GenerateOptions.purpose = 'compaction'`, replaying system prompt + tools + shadowed messages, **bypassing** `agent/request`. Only returned text is stored. Replacement is framed with `<compacted-summary>` tags.

Optional pruner (`dsh-compaction-tool-result-pruner`) is invoked **after a compaction trigger qualifies**, before summarization. `ctx.toolResultPruner.pruneSession(session)` rewrites over-budget `tool/result` nodes (head/marker/tail; defaults 8192 / 4096 / 1024). If pruning relieves pressure, summarization is skipped. Below-pressure conversations are never touched.

### 5.3 Human `/compact` (`dsh-command-compact`)

Registers `/compact` on `ctx.commands`. Calls `compactNow(agent, signal)`. **Idle-only:** if a turn is running, reports busy; the command is not queued. Prompts submitted while it runs stay in FIFO and start after compaction's durability checkpoint. Lifecycle events `command/run` / `command/done` are log-only (never model-visible).

`compactNow` requires `agent.runMaintenance(...)` (idle maintenance). `compactRegion` **requires an open turn** (`dsh-compaction-basic` Known Limitations).

### 5.4 Can a SoL plugin trigger compaction then continue?

| Want | Public API | Continues automatically? |
|---|---|---|
| Compact on pressure inside a turn | `ctx.compaction.compactIfNeeded(agent, 'pressure', signal)` (or rely on the shipped listener) | Yes — caller / loop proceeds; surface already replaced |
| Compact after overflow and retry the request | return `{ kind: 'retry' }` from `agent/request-error` after a successful replace (shipped backend does this) | Yes |
| Compact on demand while idle | `ctx.compaction.compactNow(agent, signal)` from `/compact` or `runMaintenance` | Next followup/steer starts after idle-task settlement |
| Compact a chosen span | `compactRegion(start, end, agent, signal)` | Returns; caller continues. Requires open turn |
| Model calls "compact" as a tool | **Not provided** | — |

A third-party plugin **may** subclass `CompactionEngine` / `BasicCompactionEngine` (override `summarize()`) and load as `ctx.compaction` — **one implementation per context**. Replacing the shipped backend means patching out `id: compaction-basic` and inserting yours.

---

## 6. Session storage

### 6.1 Identity and in-memory log

- `ctx.sessions.create(...)` → `Session` (`dsh-session`).
- `Session.id` is the shared agent/session id (`SessionId`).
- Append-only `SessionEvent` log; `session.append(type, data, opts?)` snapshots, validates lossless JSON, notifies `session/event`.
- `SESSION_FORMAT_VERSION = 3` (`dsh-session/lib/types/types.d.ts`).
- `Session.header`: `version`, `id`, `createdAt`, optional `cwd`, `parentSession`, `isSeeded`, `origin`, `delegationDepth`, `agentPreset`. Kept **out of** the event log (storage metadata).
- `firstLiveSeq` vs `inheritedEventCount` (fork prefix). Seeded sessions write `session/end-seed`.

### 6.2 On-disk layout (`dsh-session-persistence-jsonl`)

Base bundle config (`dsh-base/cordis.patch.yml`):

```yaml
- id: session-persistence-jsonl
  name: '@deepseek-ai/dsh-session-persistence-jsonl'
  config:
    root: !!js dshHomePath('sessions')
```

Physical layout (`dsh-session-persistence-jsonl` README):

```text
<root>/                          # default: $DSH_HOME/sessions
  --<normalized-cwd>--/          # or _no-cwd/
    <encoded-id>/
      session.jsonl.zstd         # v0
      session.v1.jsonl.zstd
      session.v2.jsonl.zstd
      session.vN.jsonl[.zstd]    # current
```

`compression` default `'zstd'`; `'none'` is newline-delimited UTF-8. `root` is required (no cwd default). Session ids are injectively escaped. Highest canonical generation wins.

Durable images live outside the log via `dsh-attachment-local`. KV storage: `dsh-storage-json` `root: !!js dshHomePath('storages')`. Settings document: `$DSH_HOME/settings.yaml` (`dsh-settings-file`). Credentials: `$DSH_HOME/.credentials.yaml`.

### 6.3 Home resolution (`dsh-home-paths`)

```ts
resolveDshHome()     // explicit > $DSH_HOME > ~/.dsh
dshHomePath('sessions')
```

`DSH_HOME_DIR_NAME = ".dsh"`, `DSH_HOME_ENV = "DSH_HOME"`. Profiles: `$DSH_HOME/profiles/<name>`.

A plugin that needs its own files should use `dshHomePath(...)` or session-scoped temp (`dsh-sandbox-windows-acl` documents `<temp>\dsh-<hash>` on Windows). Do not infer cwd from the harness checkout (`addHarnessSourceSection` tells the model this explicitly).

### 6.4 Projections (UI/state, not model history)

`ctx.sessionProjections.register({ key, stateSchema, stateVersion, init, apply, wire? })`. Fold is synchronous over committed events. Examples: `todos` (`dsh-tool-todo`), token-meter units `tokenUsage` / `contextPressure` / `contextBreakdown`. Cache: `dsh-session-projection-cache` under storage domain `session_projcache`.

---

## 7. Extra model calls from a plugin

The only supported path into providers is `ctx.llm`.

```ts
for await (const chunk of ctx.llm.stream({
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  messages: [createUserMessage({ content: [{ type: 'text', text: 'Hello' }] })],
  // optional:
  system: '...',          // one-shot callers; loop-built requests leave this unset
  tools: [...],
  maxTokens: 64,
  signal,
  purpose: 'compaction',  // or 'session-title'; ordinary conversation leaves unset
  sessionId,
})) { /* StreamChunk */ }
```

`GenerateOptions` (`dsh-llm/lib/types/types.d.ts`): `provider`, `model`, `reasoningEffort?`, `messages`, `system?`, `tools?`, `temperature?`, `maxTokens?`, `stop?`, `signal?`, `sessionId?`, `purpose?: 'compaction' | 'session-title'`.

Related APIs on `LlmRuntime`:

- `prepareCall(provider, model, signal?)` → `PreparedLlmCall` (one-shot dispatch bound to one adapter generation)
- `registerAdapter(providers, adapter)` / `registerConfigurableProviders` / `registerModelDiscovery`
- `listProviders()` / `listConfigurableProviders()` / `discoverModels`
- `stream` always ends with one terminal `finish` chunk (`stop` | `tool-calls` | `max-tokens` | `aborted` | `error`)

This service **never retries**; `@deepseek-ai/dsh-llm-retry` retries at `agent/request-error`. Auxiliary plugin calls (compaction summarizer, session-title, a reviewer model) typically call `stream` directly and do **not** go through `agent/request`.

`purpose` is a closed union today: `'compaction' | 'session-title'`. A SoL auxiliary call should leave `purpose` unset (as `dsh-advisor` documents) unless DSH adds a new variant.

Adapters in base: `dsh-llm-deepseek` (native DeepSeek) and dormant `dsh-llm-pi-ai` (activated by a `llm-pi-ai:` settings section). Default route: `provider: deepseek-official`, `model: deepseek-flash` (`agent-default-model` row).

---

## 8. Plugin packaging (files, exports, patch YAML, profile bundle)

### 8.1 Minimal host-only bundle

```
my-sol-plugin/
  package.json
  cordis.patch.yml
  lib/index.js          # ESM; exports name, inject, apply, Config; NO default export
  lib/types/index.d.ts
```

`package.json`:

```json
{
  "name": "my-sol-plugin",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
    "./package.json": "./package.json"
  },
  "files": ["lib", "cordis.patch.yml"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" }
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.2",
    "@deepseek-ai/dsh-agent": "^0.1.5-rc.2",
    "@deepseek-ai/dsh-tools": "^0.1.5-rc.2"
  }
}
```

`cordis.patch.yml`:

```yaml
- insert:
    - id: sol-pi
      name: my-sol-plugin
      config:
        enabled: true
```

Install: `dsh plugin --profile web add my-sol-plugin`. Verify: `dsh --profile web --dump-config` shows a `# == my-sol-plugin` layer.

### 8.2 Host + Web UI bundle

Add:

```json
"exports": {
  "./client": { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" }
},
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "client": {
    "platform": "web",
    "inject": [
      "@deepseek-ai/dsh-client-ui-slots",
      "@deepseek-ai/dsh-client-ui-tool"
    ]
  }
}
```

`pnpm run build` must produce `lib/client.js` before web boot (`dsh-client-modules`).

### 8.3 Patching an existing first-party row

Because config replace is whole-row, restating is mandatory. Example from a real out-of-tree bundle (`dsh-free-search/cordis.patch.yml` on this machine): it inserts its own row **and** restates `id: web` with both `searchProvider` and `fetchProvider`, because omitting `fetchProvider` would drop the base fetch provider.

To *disable* a first-party tool instead of wrapping it:

```yaml
- id: tool-bash
  disabled: true
- insert:
    - id: sol-bash
      name: my-sol-plugin/bash
```

(`disabled` is a Loader entry field; `!!js` expressions are allowed, as base does for platform gating.)

### 8.4 Profile manifest (`DshProfileManifest`)

```ts
{
  bundles?: string[]
  patchReload?: 'live' | 'startup'
}
```

Other `package.json.dsh` keys: `configTrees` (experimental image packer; declaring it does not register plugin behavior), `sessionFormatMigration` (discovered only for in-repo `session-format-vN-to-vN+1`, **not external plugins**), `moduleFallback` (launcher-generated, not author config).

---

## 9. Overlaps with SoL-Pi mechanisms

These already exist in `dsh-base` 0.1.5-rc.2. A native SoL port should **compose or replace**, not reimplement blindly.

| SoL-Pi-like concern | DSH mechanism | Package | Notes |
|---|---|---|---|
| Tool-result pruning / middle-omit | Head/marker/tail rewrite of over-budget `tool/result` on compaction trigger | `dsh-compaction-tool-result-pruner` | Model-free; original stays in raw log |
| Conversation compaction + continue | Pressure pre-step + overflow retry | `dsh-compaction-basic` + `dsh-command-compact` | Summarizer is an extra `ctx.llm.stream` call |
| Oversized result spill (observation packing analog for bytes) | Preview + locator; full text in spill file | `dsh-spill-policy` + `dsh-spill-local` + `dsh-output-retention` | `tools/post-execute`; skips `read` to avoid loops; `maxInlineBytes: 50000` in base |
| Read-before-edit / stale write | `fs/*` intent policy | `dsh-fs-observation-policy` | Process-local; **not persisted across resume** |
| Plan / todo | `/plan` + `exit_plan_mode`; `todo_write` | `dsh-plan-mode`, `dsh-tool-todo` | Plan mode does **not** hide mutation tools (KV-cache stability); sandbox/approval enforce limits |
| Action fusion / batched tools | PTC `run_code` + SDK; parallel-safe tool pool | `dsh-tools` `mode: ptc\|both`; `maxParallelToolCalls` on agent-loop | Not history fusion; presentation/executor collapse |
| Repeat-call hygiene | Consecutive-identical-call reminders | `dsh-repeat-tool-reminder` | Advisory inject after the result; thresholds `[3,5,8]` |
| Extra reviewer LLM | Independent `ctx.llm.stream` + `inject`/`steer` | (pattern proven by out-of-tree `dsh-advisor`; APIs are first-party) | |
| Claude Code hooks | Compatibility bridge | `dsh-hooks-claude-code` | Native plugins should use Cordis events |
| MCP tools | Bridge onto `ctx.tools` | `dsh-mcp-client` | Not in default base insert list |
| Goals / ralph loops | Same-session goals; fresh-agent iteration | `dsh-goal`, `dsh-tool-ralph` | |
| Token pressure display | Replay-aware meter + projections | `dsh-token-meter` | Heuristic 4 chars/token unless adapter image pricing |
| Subagents | spawn/fork in-process | `dsh-subagent*` | Fork stays same model for KV reuse |

**Not found as a public DSH feature:** SoL-style observation packing that *rewrites* the outgoing message list per request without a durable surface replace; action fusion that merges consecutive tool-call rounds in derived history; a session_start veto; argument rewrite; a model-facing compact tool.

---

## 10. Gaps / missing public APIs (for a native SoL-Pi plugin)

These are documented absences or closed doors, not guesses.

1. **No mutable pre-provider message transform.** `agent/request` forbids message mutation; loop-built `llm/stream` options are frozen (`dsh-agent` + `dsh-llm`). SoL observation packing / action fusion that currently rewrite context at request time have **no equivalent hook**.
2. **No tool-argument rewrite.** `tools/pre-execute` cannot change `exec.arguments` (proposed note `2026-06-30-pre-tool-input-rewrite`).
3. **No in-place global tool replace.** Same-scope `register` throws. Wrap via waterfalls, shadow via `agent.ctx`, or disable+reinsert the Loader row.
4. **`agent/session-start` cannot gate startup** (`dsh-agent` Known Limitations). Use unpublished `setup(agentCtx, agent)` for composition-before-publish.
5. **`SessionStartSource` `'clear' | 'compact'` reserved, no emitter** (`dsh-agent` Dev Note).
6. **No model-facing compact tool;** `/compact` is idle-only and not queued (`dsh-command-compact`).
7. **`compactRegion` requires an open turn;** `compactNow` requires idle `runMaintenance`.
8. **Compaction cannot split an indivisible non-tool node or shrink the envelope** (system/tools/prefix).
9. **Web UI ignores `presentCall`/`presentResult`.** Custom tool chrome requires a `dsh.client` bundle and `tool.call.toolview`.
10. **No shipped TUI plugin API** in this CLI. TUI is a separate profile ecosystem.
11. **`GenerateOptions.purpose` is a closed union** (`compaction` | `session-title`). Extra SoL LLM calls should leave it unset.
12. **External plugins cannot declare `sessionFormatMigration`** that the catalog generator will discover (`dsh-package-manifest` JSDoc).
13. **`HookOutput.updatedInput` and run-level `continue: false` are not honored** even on the Claude Code bridge — another reason not to implement SoL as hooks.json.
14. **FS observations do not survive resume** — a SoL "session_start rehydrate" cannot rely on `dsh-fs-observation-policy` state.
15. **Cookbook / cordis primer / subsystem pages** live in the source repo and are **not shipped in the npm package**. Public authoring docs in-install are the per-package READMEs cited above.

### Feasible native-plugin subset (given those gaps)

A native SoL-Pi DSH plugin **can** today, using only public APIs:

- Install as a profile bundle (`dsh.bundle` + `cordis.patch.yml` + `apply`).
- Register new tools; wrap bash/edit/write via `tools/pre-execute` / `tools/execute` / `tools/post-execute`.
- Inject/steer advice; add prompt sections; listen to `agent/session-start`, `agent/turn-stopping`, `tools/result`, `session/event`.
- Make extra `ctx.llm.stream` calls (reviewer, summarizer).
- Trigger `compactIfNeeded` / `compactNow` and rely on loop retry/continue.
- Optionally ship a web card (`dsh.client`).
- Optionally replace compaction by mounting a `CompactionEngine` subclass.

It **cannot** (without forking DSH or violating reconstructability) transparently rewrite the frozen request `messages` the way a Pi `before_provider_request` context projector does.

---

## 11. Sources

### Local install (authoritative for 0.1.5-rc.2)

| Path | What it owns |
|---|---|
| `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/package.json` | Version `0.1.5-rc.2`; dependency closure |
| `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/README.md` | Profile boot, `dsh plugin`, patch layer order |
| `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/lib/bin.js` | CLI grammar |
| `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/lib/plugin-Ddi42qoW.js` | `dsh plugin` pnpm forwarder + bundle reconcile |
| `.../dsh-app-boot/README.md`, `lib/types/{index,profile}.d.ts`, `lib/index.js` (`PROFILE_TEMPLATES`) | Profile load, patch watch, boot |
| `.../dsh-package-manifest/lib/types/types.d.ts` | `DshManifest` / bundle / profile / client |
| `.../dsh-base/README.md`, `cordis.patch.yml`, `package.json` | Shared core rows |
| `.../cordis/README.md`, `lib/types/{registry,service}.d.ts` | Plugin shapes, `Service`, `inject` |
| `.../cordis-plugin-loader/README.md`, `lib/types/index.d.ts` | Loader entries, `unwrapExports` |
| `.../cordis-plugin-include/README.md`, `lib/types/index.d.ts` | `PatchOptions`, `applyEntryPatches`, `!!js` |
| `.../dsh-tools/README.md`, `lib/types/index.d.ts`, `lib/index.js` | Tool registry + pipeline |
| `.../dsh-agent/README.md`, `lib/types/{index,runtime-types,dispatch}.d.ts` | Agent handle + `agent/*` events |
| `.../dsh-agent-loop/README.md` | Turn/step machine, freeze, persistence acquire |
| `.../dsh-session/README.md`, `lib/types/{index,types}.d.ts` | Log, `deriveMessages`, format v3 |
| `.../dsh-session-projection/README.md` | Projection registry |
| `.../dsh-session-persistence-jsonl/README.md` | On-disk layout |
| `.../dsh-home-paths/README.md`, `lib/types/index.d.ts` | `$DSH_HOME` |
| `.../dsh-llm/README.md`, `lib/types/{index,types,message}.d.ts` | `stream`, frozen requests, `GenerateOptions` |
| `.../dsh-system-prompt/README.md`, `lib/types/index.d.ts` | Prompt assembly |
| `.../dsh-compaction/README.md`, `lib/types/{index,types}.d.ts` | Compaction seam |
| `.../dsh-compaction-basic/README.md`, `lib/types/index.d.ts`, `lib/index.js` | Auto compact + retry |
| `.../dsh-compaction-tool-result-pruner/README.md`, `lib/types/index.d.ts` | Pruner |
| `.../dsh-command-compact/README.md` | `/compact` |
| `.../dsh-token-meter/README.md` | Measurement |
| `.../dsh-spill-policy/README.md` | Spill |
| `.../dsh-output-retention/README.md` | Retainers |
| `.../dsh-fs-observation-policy/README.md` | Read-before-edit |
| `.../dsh-tool-fs/README.md` | `read`/`write`/`edit` |
| `.../dsh-tool-bash/README.md` | `bash` |
| `.../dsh-tool-str-replace-editor/README.md` | Opt-in editor |
| `.../dsh-tool-todo/README.md`, `lib/types/index.d.ts` | Plugin export shape |
| `.../dsh-tool-call-timeout-policy/README.md` | `tools/execute` wrap example |
| `.../dsh-plan-mode/README.md` | Plan mode |
| `.../dsh-repeat-tool-reminder/README.md` | Repeat reminders |
| `.../dsh-hook-protocol/README.md` | Hook rules |
| `.../dsh-hooks-claude-code/README.md` | Hook → event map |
| `.../dsh-client-modules/README.md` | `dsh.client` loading |
| `.../dsh-client-ui-tool/README.md`, `package.json` | Web tool cards |
| `.../dsh-web-app/package.json`, `cordis.patch.yml` | Web bundle |
| `.../dsh-commands/README.md` | Slash commands |
| `.../dsh-mcp-client/README.md` | MCP → `ctx.tools` |
| `.../dsh-terminal/README.md` | Persistent PTY (not chat TUI) |
| `.../dsh-host-plugin-inventory/README.md` | Read-only plugin list RPC |

### Official remote (not fully mirrored in npm)

- Repo: <https://github.com/deepseek-ai/deepseek-harness> (directory layout: `apps/cli`, `packages/bundle/base`, …)
- npm: `@deepseek-ai/dsh`
- Named but **not in this install** (READMEs point at them): `docs/cookbook/adding-a-tool.md`, `docs/cordis-primer.md`, `docs/subsystems/{core,tools,session,compaction,system-prompt,llm-streaming,filesystem}.md`, `docs/tool-execution-pipeline.md`, `docs/config-catalog.md`, `docs/tool-catalog.md`

### Existence proof of the third-party bundle contract (not DSH source)

These are installed in `$DSH_HOME/profiles/web` and confirm the public packaging API, not DSH internals:

- `dsh-advisor` — `name`/`inject`/`apply`, `dsh.bundle` + `dsh.client`, extra `ctx.llm.stream`, `agent.inject`/`steer`
- `dsh-free-search` — bundle insert + whole-row patch of `id: web`
- `dsh-mattpocock-skills` — insert-only bundle
- `dsh-plugin-sandbox-escalation-fix` — insert-only host plugin

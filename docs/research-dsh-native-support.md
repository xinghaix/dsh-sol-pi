# Native DeepSeek Harness support for SoL-Pi — feasibility research

Date: 2026-09-14  
SoL-Pi: this checkout (`sol-pi` 0.1.0, Pi peer `@earendil-works/pi-coding-agent` 0.84.2)  
DSH: `@deepseek-ai/dsh` 0.1.5-rc.2 (local install at `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh`)

This note answers: can SoL-Pi be changed so that DeepSeek Harness (DSH) is a **first-class, native** host, not a shim around Pi?

**Verdict: yes, but not by loading today's Pi extension.** Native DSH support is a new Cordis plugin bundle that re-homes the four SoL mechanisms onto DSH public seams. The current `src/sol-pi/index.ts` entry cannot run inside DSH. Shared algorithm cores can be extracted; the harness adapters cannot.

Companion API dump (package manifests, `.d.ts`, patch rows): [`research-dsh-native-plugin-surface.md`](research-dsh-native-plugin-surface.md).

---

## 1. What “native DSH” means here

DSH's product claim is that every capability is a plugin and you extend the harness **without changing DSH source**. Official wording:

> Developers can select, swap, or extend any capability in configuration without changing the DeepSeek Harness source code.
>
> — [DeepSeek Harness developer preview](https://www.deepseek.com/harness/en/)

That matches SoL-Pi's existing Pi rule (“No Pi patches. SoL-Pi imports public Pi APIs”). Native DSH support must obey the same rule for DSH:

| Native | Not native |
|---|---|
| Cordis plugin(s) using `ctx.tools`, `ctx.llm`, `ctx.compaction`, session events | Loading `ExtensionAPI` / `pi.on(...)` inside DSH |
| Installed with `dsh plugin --profile <name> add …` as a `dsh.bundle` | Forking or vendoring `deepseek-harness` |
| Patch layer inserts/overrides rows by id | Claude Code / Codex `hooks.json` bridges (`dsh-hooks-*`) |
| Model-visible changes reconstructable from the session log | Rewriting a frozen `agent/request` payload |
| Compose with `dsh-base`, do not replace the loop | Wrapping Pi as a subprocess / ACP peer and calling that “DSH support” |

DSH itself says a hook-protocol bridge is the wrong tool for bespoke harness behavior:

> Avoid the whole group for bespoke behavior with no reference-tool equivalent: a native Cordis plugin has the full harness API with no hook protocol in between.
>
> — `@deepseek-ai/dsh-hook-protocol` README

SoL-Pi is exactly that class of behavior.

---

## 2. What SoL-Pi is today

SoL-Pi is a **standalone Pi coding-agent extension**, not a harness. It registers four opt-in mechanisms through Pi's public `ExtensionAPI` on `session_start` ([`src/sol-pi/index.ts`](../src/sol-pi/index.ts)):

| Mechanism | Pi seam | Effect |
|---|---|---|
| **Action Fusion** | `pi.registerTool` replacing built-in `edit` / `write` | Optional `then_run` runs a validation command in the same tool call |
| **ObservationPack** | `pi.on("context")` projection + `obs_recall` | After `FULL_SENDS` (2) full provider requests, large text results become placeholders; originals stay on disk |
| **Evidence-Preserving Reducer** | `pi.on("tool_result")` + Pi model registry | Long diagnostic logs → reducer model → receipt accepted only if every quote is byte-identical in the archive |
| **Online Context Compact** | `update_plan` tool + `turn_end` / `agent_settled` / `ExtensionContext.compact()` / `sendMessage({ triggerTurn: true })` | Plan-step boundary + cache-write/read economics decide when to compact, then abort, compact, and continue |

Hard constraints in this repo ([`README.md`](../README.md), [`docs/compatibility.md`](compatibility.md), [`agents-install.md`](../agents-install.md)):

- Do not patch, fork, or vendor Pi.
- Missing config leaves every mechanism **disabled**.
- Evidence is preserved: packing/reduction fail open; originals stay local.
- Auth, provider URLs, main model, and shell stay with the host harness.
- Persistent artifacts live under the host session directory: `<sessionDir>/sol-pi/<sessionId>/`.
- Tested Pi API surface is listed in [`docs/compatibility.md`](compatibility.md): `registerTool`, `context`, `before_provider_request`, `tool_result`, `turn_end`, `agent_settled`, `session_before_tree`, native `compact()`, `getContextUsage()`, `modelRegistry`, TUI `renderCall` / `renderResult` / `ui.notify`.

Those Pi events have **no identical names** in DSH. Mapping is semantic, not mechanical.

---

## 3. What DSH is

DSH (`@deepseek-ai/dsh`, repo [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)) is a Cordis microkernel. A running process is an ordered stack of **bundles** plus user patches ([CLI README](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md), local package README):

1. Each bundle in `package.json` → `dsh.profile.bundles`
2. Profile `cordis.patch.yml`
3. `$DSH_HOME/cordis.patch.yml`
4. `--patch` overlays

Shipped profiles (`web`, `headless`, `sdk`, `acp`) start with `@deepseek-ai/dsh-base`. `sdk-minimal` is a standalone tree.

A third-party plugin is an npm package that:

1. Exports **named** `name` / `inject` / `apply` / `Config` (or a Cordis `Service` class). First-party tools **must not** `export default`: Loader `unwrapExports` would collapse the module and drop `inject` (`dsh-tool-todo` README, “Export shape”).
2. Declares `inject: ['tools']` (or `llm`, `compaction`, …) so required services exist before `apply`.
3. Ships `dsh.bundle.patch` pointing at `cordis.patch.yml` ([package-and-install](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)).
4. Is installed with `dsh plugin --profile <name> add <package|path|github:…>`.

DSH is in **developer preview**. Core plugins and APIs will keep evolving ([product page](https://www.deepseek.com/harness/en/)). Any SoL-DSH release must pin a DSH version the same way SoL-Pi pins Pi 0.84.2.

Note: `@deepseek-ai/dsh-llm-pi-ai` is **not** SoL-Pi. It is an LLM adapter that routes `ctx.llm` through the `pi-ai` provider catalog. Sharing a library name does not share the coding-agent extension API.

---

## 4. Extension-point map (Pi → DSH)

Authoritative DSH turn flow ([architecture](https://deepseek-harness.github.io/deepseek-harness/en/reference/)):

```
turn/start
  agent/pre-step          (waterfall: reject | enter messages)
  step/start
  agent/request           (waterfall: replace frozen CALL CONFIG only; cannot mutate messages)
  deriveMessages() from the session log  →  llm/stream
  tools/pre-execute → tools/execute → tools/post-execute → tool/result
  step/end
  agent/turn-stopping     (serial: may steer another step)
turn/end
```

| SoL-Pi / Pi | DSH public seam | Notes |
|---|---|---|
| `session_start` | `agent/session-start` | Seed with `agent.inject()`, not a veto |
| `pi.registerTool` | `ctx.tools.register(defineTool(…))` | Duplicate names **in one layer** fail; scoped tools shadow globals |
| Built-in `edit` / `write` | `dsh-tool-fs` tools `edit` / `write` (row id `tool-fs`) | Default file editor. `str_replace_editor` is opt-in |
| Built-in `bash` | `dsh-tool-bash` (row id `tool-bash`) + `ctx.shell` | Windows uses PowerShell twins |
| `pi.on("context")` rewrite | **No equivalent.** `deriveMessages()` is the model history. `agent/request` “cannot mutate messages.” Model-visible ⇒ logged | ObservationPack cannot stay a silent projection |
| `before_provider_request` | `agent/pre-step` (before derivation) + `agent/request` (config only) + `ctx.tokenMeter` | Compaction-basic already listens on `agent/pre-step` |
| `tool_result` replace | `tools/post-execute` → `{ kind: 'accept', content }` | Spill-policy already uses this with `prepend` |
| Observe final result | `tools/result` | Immutable; do not transform here |
| Invoke another tool from a plugin | `ctx.tools.execute(exec)` | Full pipeline (policy, sandbox, spill) |
| `ExtensionContext.compact()` | `ctx.compaction.compactIfNeeded` / `compactNow` / `compactRegion` | `compactNow` is **idle-only** via `runMaintenance` |
| `getContextUsage()` | `ctx.tokenMeter` | Same measurement compaction uses |
| Nested reducer LLM call | `ctx.llm.stream({ provider, model, messages, signal })` | Bypasses `agent/request`. `purpose` is a closed union `'compaction' \| 'session-title'` — leave it **unset** for SoL auxiliary calls |
| `sendMessage({ triggerTurn })` | `agent.steer()` / `agent.followup()` / `agent.inject()` | `agent/turn-stopping` is the continue-after-compact hook |
| `agent_settled` / abort-then-compact | No named settled event. Use `Agent.whenIdle()` / `agent/status` idle. Compact at `agent/pre-step` or idle `compactNow` | Semantic mismatch for OCC |
| Session dir + id | `agent.session` + JSONL persistence root | Spill files: `ctx.spillStore.saveText` |
| Custom session entries | Extend `SessionEventMap` (declaration merge) + projection unit | Required if state must survive resume |
| TUI `renderCall` / `notify` | Web Client ignores `presentCall`/`presentResult`; uses `tool.call.toolview` | UI is a separate client plugin |
| Config `sol-pi.json` | Plugin `Config` schema (Schemastery) + profile patch `config:` | Plus optional settings card |

Sources: DSH architecture page; `@deepseek-ai/dsh-tools` / `dsh-agent` / `dsh-compaction` / `dsh-spill-policy` READMEs and published `.d.ts` (0.1.5-rc.2).

---

## 5. Mechanism-by-mechanism: overlap, gaps, native shape

DSH already ships three efficiency features that **overlap SoL-Pi's problem statements** and are on by default in `dsh-base`:

| DSH feature | Default in `dsh-base` | Overlaps |
|---|---|---|
| Spill policy (`maxInlineBytes: 50000`) | yes | ObservationPack |
| Tool-result pruner (`thresholdChars: 8192`, head 4096 / tail 1024) | yes | EPR (weakly) and ObservationPack |
| Compaction-basic (`thresholdRatio: 0.8`, `retainRatio: 0.16`) + `/compact` | yes | Online Context Compact |
| PTC / `run_code` (Code mode) | selectable, not default native | Action Fusion (superset) |
| `todo_write` | yes (`allowParallelInProgress: true`) | OCC's `update_plan` (partial) |

SoL-Pi still has unique policy that DSH does not implement. Native support should **compose with** these, not disable them blindly.

### 5.1 Action Fusion — feasible, native, partial overlap with PTC

**SoL behavior.** Replace `edit`/`write` schemas with an optional `then_run: { command, timeout? }`. Mutation then bash run in one observation. Per-file queue + hash check skips the command if the file changed. Saves one model round-trip.

**DSH overlap.** Code / PTC mode already lets the model call `tools.edit` then `tools.bash` inside one `run_code` program, so the *round-trip* saving is available without SoL when the profile is in `ptc` or `both`. Native-mode (`mode: native`, the `dsh-tools` default) still uses one tool call per model decision, so Action Fusion remains useful there.

**Native shape.**

1. Do **not** register a second global `edit`/`write` — `ctx.tools.register` fails on duplicates in one layer (`ToolRuntime.register` JSDoc, `dsh-tools` 0.1.5-rc.2).
2. Preferred: a later bundle that **overrides row `tool-fs` by id** and mounts a SoL plugin whose `edit`/`write` wrap `ctx.fs` (same observation policy / sandbox) and, when `then_run` is set, call `ctx.tools.execute` for `bash` so approval and sandbox still apply. The patch must restate the whole `tool-fs` config (DSH patches replace, they do not merge).
3. Alternative that does not steal the row: register fused tools under new names (`edit_then_run`) — weaker, because the model keeps seeing the original `edit`/`write`.
4. `tools/execute` wrappers cannot add `then_run` to the published schema; they only wrap dispatch.

**Reuse from this repo.** `executeMutationThenRun`, `withFusedFileQueue`, `assertUnchangedBeforeCommand` are harness-agnostic once bash invocation is injected.

**Do not** reimplement `ctx.fs` or bypass sandbox.

### 5.2 ObservationPack — feasible only as a logged surface policy; DSH already spills

**SoL behavior.** Threshold 10 KiB; first **two** provider requests keep the full tool result; later requests see a placeholder with `obs_*` id; `obs_recall` pages the archive. Projection-only: stored Pi history is untouched ([`observation-pack/index.ts`](../src/sol-pi/extensions/observation-pack/index.ts)).

**DSH overlap (strong).** `dsh-spill-policy` at `maxInlineBytes: 50000` replaces oversized **plain-text** results on first accept with a head/tail preview plus a locator. Retrieval is ordinary `read` / `grep`. Fail-open on spill errors. `read` results are skipped (to avoid a read→spill→read loop). Original bytes live in `ctx.spillStore` (`dsh-spill-local`).

**Hard DSH constraint.** Architecture: “Model-visible means logged.” `agent/request` “cannot mutate messages.” A Pi-style silent `context` projection would violate reconstructability.

**Native options.**

| Option | What it is | Recommendation |
|---|---|---|
| A. Treat spill as the DSH-native ObservationPack | Configure / document spill; optional SoL recall helper is unnecessary because `read` already pages files | Default: **do this**, plus optionally lower `maxInlineBytes` toward SoL's 10 KiB |
| B. Delayed packing (SoL FULL_SENDS=2) | At `agent/pre-step`, after two derived requests, **replace** historical `tool/result` surface nodes (same pattern as the pruner: new event + `sourceEventSeqs`) | Only if delayed full-send is a measured win over immediate spill |
| C. New `obs_recall` tool | Duplicates `read`/`grep` on spill files | Avoid; not native DSH vocabulary |

**Conflict.** If SoL delayed-packs *and* spill-policy already truncated at 50 KiB, there is nothing left to pack. A SoL ObservationPack plugin must either run **before** spill (as an earlier `tools/post-execute` listener) or disable/raise spill for the results it owns.

**Reuse.** Hashing, threshold, placeholder excerpt, ledger format can move to a core module. The Pi `context` handler cannot.

### 5.3 Evidence-Preserving Reducer — feasible, highest unique value

**SoL behavior.** Eligible diagnostic-command logs (≥ 4 KiB, command regex, no likely-secret) are archived; a nested reducer model returns a receipt; every quoted line must occur byte-for-byte in the archive; otherwise the original result is kept.

**DSH overlap (weak).** The tool-result pruner is **syntactic** head/middle/tail, model-free, and only runs after a compaction trigger. It explicitly does not interpret which middle lines matter (pruner README “Known Limitations”). That is the opposite of EPR.

**Native shape.**

1. `inject: ['tools', 'llm', 'spill']` (spill optional; can write under the session dir if no store).
2. `tools/post-execute` listener (order after spill or instead of it for diagnostic bash results):
   - Same eligibility as SoL (`DIAGNOSTIC_COMMAND`, `LIKELY_SECRET`, size bounds).
   - Archive via `ctx.spillStore.saveText` or session-scoped files.
   - `ctx.llm.stream({ provider, model, messages, signal })` — extra call, not the agent loop. Do **not** set `purpose`: the type is only `'compaction' | 'session-title'` (`GenerateOptions` in `@deepseek-ai/dsh-llm`).
   - `validateReceipt` unchanged; on failure `{ kind: 'accept' }` with original content (fail-open).
   - On success `{ kind: 'accept', content: receiptBlocks }`.
3. Config fields: reducer provider/model (DSH default should be a DeepSeek route, **not** SoL's built-in `openai-codex` / `gpt-5.6-luna`).
4. Credentials stay in DSH settings; never in SoL config.

**Reuse.** Almost all of `evidence-preserving-reducer/{candidate,receipt,archive,config}` is portable. Only `provider.ts` (Pi `modelRegistry.complete` / `pi-ai/compat`) must be rewritten against `ctx.llm`.

This is the mechanism DSH does not already approximate. If native support ships only one thing first, ship EPR.

### 5.4 Online Context Compact — feasible as a **policy plugin on `ctx.compaction`**, not a second engine

**SoL behavior.** `update_plan` records step completions. On `turn_end`, economics (`cacheWriteReadRatio`, remaining plan steps, context growth, cache-write debt) may decide to compact. Then: `abort()` → wait `agent_settled` → `context.compact()` → hidden `sendMessage` with `triggerTurn: true` so the task continues in a new turn. Print/JSON modes stay in-process via a settlement barrier.

**DSH overlap (strong).** `dsh-compaction-basic` already condenses at 80% of the routed window, recovers from `CONTEXT_WINDOW_EXCEEDED`, exposes `/compact`, and optionally prunes tool results first. Summarization **replays the warm prefix** (system + tools + shadowed messages) so KV-cache reuse is a first-class design, which SoL-Pi's Pi compact path does not expose.

**Semantic gaps.**

| SoL-Pi OCC | DSH compaction-basic |
|---|---|
| Trigger: completed **plan step** | Trigger: token **pressure** / overflow / human `/compact` |
| Economics: cache-write vs cache-read ratio | Economics: none (token-meter pressure only) |
| Aborts the active run, then compact | `compactIfNeeded` at `agent/pre-step`; `compactNow` **throws if the agent is not idle** |
| Injects `update_plan` | `todo_write` already exists; DSH **plan-mode** is “review before execute”, not a progress tracker |
| Continues via `sendMessage` | Continue via `agent.steer` / `followup` after compact, or just let the next step derive from the new surface |

**Native shape (do not subclass a second `CompactionEngine` unless replacing basic).** One engine per context; a second `ctx.compaction` fails the load.

1. Keep `dsh-compaction-basic` as the backend.
2. SoL plugin:
   - Either wrap `todo_write` completions (listen `tools/post-execute` / `tools/result`) or register a SoL `update_plan` **in addition** (risk: two plan tools). Prefer driving off `todo_write` unless measurements need SoL's richer progress schema (`files_changed`, `verification`, `decisions`).
   - Reuse `decideCompaction` from [`economics.ts`](../src/sol-pi/extensions/online-context-compact/economics.ts) with `ctx.tokenMeter` numbers.
   - When compact is selected: **do not abort mid-step.** Set a flag; on the next `agent/pre-step` call `ctx.compaction.compactIfNeeded(agent, 'pressure', signal)` (or, if idle at `agent/turn-stopping`, `compactNow`). After success, `agent.steer(...)` with the plan-rebuild reminder.
3. Persist OCC state as a declaration-merged session event + projection unit (DSH equivalent of Pi custom entries).
4. Economic ratio stays a SoL config field; DSH does not read model prices either.

**Pi abort-and-continue cannot be copied.** It exists because Pi's `compact()` aborts the agent. DSH already serializes compaction against the loop. Native OCC must use that serialization.

---

## 6. Packaging: how a native plugin actually ships

Minimal bundle (from the [publish tutorial](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)):

```
sol-dsh/   (name TBD)
├── package.json          # dsh.bundle.patch = ./cordis.patch.yml
├── cordis.patch.yml      # insert plugin rows; optionally override tool-fs
├── src/index.ts          # named export apply(ctx) — no export default
└── src/<mechanism>/      # Cordis listeners
```

```json
{
  "name": "sol-dsh",
  "type": "module",
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

```yaml
- insert:
    - id: sol-dsh
      name: sol-dsh
      # no config: Schemastery best defaults apply (see docs/dsh-configuration.md)
```

Install (does not fork DSH):

```bash
dsh plugin --profile web add /absolute/path/to/sol-dsh
dsh --profile web --dump-config   # must show a "# == sol-dsh" layer
```

Git installs need a self-contained `prepare` build and a user `allowBuilds` entry (pnpm ≥ 10). Prefer npm tarball / registry for the same reason SoL-Pi tells agents to use a full checkout with tests.

Config is the exported Schemastery `Config`, not `sol-pi.json`. **Installing the bundle is the opt-in.** Omitted keys take SoL’s DSH best profile (fusion / observation-immediate / EPR / OCC on; Flash `cacheWriteReadRatio: 50`). Users override individual metrics in `cordis.patch.yml`. Unknown keys and invalid metrics fail load. Full contract: [`dsh-configuration.md`](dsh-configuration.md).

Pi stays all-false until `sol-pi.json` is written. Do not copy that onto DSH — a DSH install that no-ops until YAML is edited would hide the mechanisms next to `dsh-base`’s already-on spill and compaction.

---

## 7. Recommended product shape (not “turn this repo into DSH”)

This repository is documented as “a standalone extension for Pi” and “not an official distribution of Pi.” Replacing Pi with DSH would abandon that product.

Three options:

| Option | What | Assessment |
|---|---|---|
| **A. Dual-host** | Extract `src/sol-core/` (queue, packing math, receipt validation, OCC economics). Keep `src/sol-pi/` as the Pi adapter. Add `src/sol-dsh/` (or package `sol-dsh`) as the Cordis bundle | **Recommended.** Matches “standalone extension” for both hosts |
| **B. DSH-only rewrite** | Drop Pi | Conflicts with README / agents-install / NVIDIA distribution |
| **C. Adapter / ACP shim** | Run Pi beside DSH, or speak ACP | Not native. Rejected by the “原生” requirement |

Do **not** try to implement `ExtensionAPI` on top of Cordis so the current files load unchanged. The seams differ in reconstructability, compaction lifecycle, tool identity, and UI. A fake Pi API would be a permanently leaky shim.

Suggested layout under option A:

```
src/
  sol-core/           # no Pi, no Cordis
    action-fusion/
    observation-pack/
    evidence-preserving-reducer/
    online-context-compact/
  sol-pi/             # today's ExtensionAPI (thin)
  sol-dsh/            # Cordis apply() + patch (thin)
```

Tests: keep the zero-spend Pi suite; add a DSH suite against public seams (`ctx.tools`, fake `ctx.llm`, in-memory session) the way first-party DSH packages test.

Pin `@deepseek-ai/dsh*` peers to a single tested version (start with 0.1.5-rc.2) and re-run the suite on upgrades, same as `scripts/check-pi-compat.mjs`.

---

## 8. What would *not* work

1. **`pi install` of this package into DSH.** DSH does not read `package.json#pi.extensions`.
2. **Silent `context` rewriting.** Violates “model-visible means logged.”
3. **Second `CompactionEngine`.** One `ctx.compaction` per context.
4. **Second global `edit`/`write`.** Duplicate names in the global layer fail.
5. **Calling `compactNow` mid-turn.** Throws `busy` / not idle; use `agent/pre-step` or `runMaintenance` when idle.
6. **Pi TUI renderers on the Web Client.** `presentCall`/`presentResult` are Host-local; Web uses `toolview`.
7. **Copying default EPR route `openai-codex` / `gpt-5.6-luna`.** That is a Pi-world reducer. DSH-native default must be a configured DSH provider/model.
8. **Forking DSH to insert SoL into `dsh-base`.** Allowed for DeepSeek, not for this standalone extension.

---

## 9. Effort and sequencing

Rough, assuming option A and DSH 0.1.5-rc.2:

| Work | Size | Why |
|---|---|---|
| Extract sol-core + keep Pi green | M | Mechanical, high test leverage |
| EPR Cordis plugin | M | Clean `tools/post-execute` + `ctx.llm.stream` |
| Action Fusion via `tool-fs` override | M | Schema + `ctx.tools.execute('bash')` + sandbox |
| ObservationPack decision (likely “use spill”) | S if A; L if delayed replace | Delayed packing needs surface replace + reconstructability tests |
| OCC policy on `ctx.compaction` | L | Idle/pre-step semantics, todo vs update_plan, steer-after-compact |
| Bundle packaging, profile install, `--dump-config` | S | Documented |
| Web savings UI | S–M | Optional; not required for native behavior |
| Dual CI + DSH pin script | M | Preview churn |

Suggested ship order: **EPR → Action Fusion (native mode) → OCC policy → ObservationPack-as-spill (document, don't clone).** That order is unique-value first, overlap last.

---

## 10. Risks

- **Preview API drift.** DSH 0.1.x will change event payloads and service methods. Pin and re-verify.
- **Listener order.** `tools/post-execute` is a waterfall; spill-policy `prepend`s. SoL must document order relative to spill and the pruner.
- **PTC mode.** Fused `then_run` is invisible under `ptc` (only `run_code` is model-direct). Either skip Action Fusion when `presentAs('ptc')` or document Code mode as the substitute.
- **KV-cache.** Surface replacement (spill, prune, compact, delayed pack) invalidates prefix cache from the first changed token. OCC economics exist to price that; DSH basic compaction already tries to keep the summarizer prefix warm, which is a different cache story.
- **Secrets.** EPR still sends logs to a reducer model. Same SECURITY.md rules; DSH credentials must not enter SoL config.
- **Subagents.** DSH scopes tools per agent. SoL plugins should register globally and rely on inheritance, or the child will not get fusion/EPR.

---

## 11. Does the ObservationPack “gap” block complete DSH support?

**No.** The gap is Pi’s *projector hook*, not the ObservationPack *mechanism*.

Pi ObservationPack does three product things:

1. Keep a large tool result retrievable without replaying it on every later request.
2. Let the model see the full payload while it is still hot (`FULL_SENDS = 2`), then switch to a placeholder.
3. Never destroy the original bytes (fail-open; recall after resume/compaction).

Pi implements (1)–(3) by rewriting `event.messages` in `pi.on("context")` and leaving stored history untouched. DSH forbids that: model-visible content must be reconstructable from the log, `agent/request` cannot mutate messages, and loop-built `GenerateOptions` are frozen.

DSH already has the *native* way to do the same job: **append-only original + surface `replace` that cites `sourceEventSeqs`**. That is how `dsh-compaction-tool-result-pruner` and `dsh-spill-policy` work. The original event stays in the log; `deriveMessages()` shows the replacement; replay recovers the input.

| ObservationPack property | Pi | DSH-native |
|---|---|---|
| Original bytes survive | Session dir archive + untouched history | Spill file and/or shadowed log event |
| Later requests do not replay the full blob | Silent projection | Surface replace (spill now, or delayed replace after N sends) |
| `FULL_SENDS = 2` | Count assistant messages in the projector | Count derived requests, then `replace` the `tool/result` at `agent/pre-step` (same pattern as the pruner) |
| Paged recall | dedicated `obs_recall` | `read` / `grep` on the spill locator (DSH vocabulary). A SoL `obs_recall` would be redundant. |
| Fail-open | packing error keeps the observation | spill/save rejection keeps the inline result |
| After compaction | archive still on disk; projector still runs | locator still on disk; replacement is what compaction sees |

So “complete ObservationPack on DSH” has two honest levels:

- **Complete mechanism (recommended):** delayed surface replace + spill store + `read`/`grep`. Same efficiency contract as Pi, including `FULL_SENDS`. Not a silent projector.
- **Complete enough, more DSH-native:** do not reimplement packing; configure/document `dsh-spill-policy` (default 50 KiB, immediate). You give up the two hot full-sends; you keep (1) and (3).

What you **cannot** have, even with a fork-level effort that we should not do:

- Model-visible placeholders that never appear in the session log.
- A `before_provider_request` rewrite of frozen `messages[]`.

Those are DSH invariants, not missing SoL features. Evidence preservation is *stronger* on the DSH path because the replacement is an explicit logged fact.

The other three mechanisms are not blocked by this gap at all (Action Fusion, EPR, OCC). Residual non-identity vs Pi is lifecycle/UI, not capability: OCC cannot abort a live step; Web savings cards need a `dsh.client` slot; PTC mode makes `then_run` less relevant.

---

## 12. Conclusion

| Question | Answer |
|---|---|
| Can this **current** package load in DSH? | **No.** |
| Can the four mechanisms be **native DSH plugins** without forking DSH? | **Yes.** That is the supported extension model. |
| Does the missing Pi `context` projector block ObservationPack? | **No.** Use logged surface replace (or shipped spill). The missing hook is an implementation detail of Pi, not a SoL requirement. |
| Does DSH already do SoL's job? | **Partially.** Spill + pruner + compaction-basic + PTC cover the *problems*; they do not implement EPR, plan-boundary economics, or `then_run` in native tool mode. |
| Should SoL-Pi stop being a Pi extension? | **No.** Dual-host, shared core. |
| Hardest native port? | OCC (compaction lifecycle). ObservationPack is a dialect choice, not a blocker. |
| Highest unique native value? | Evidence-Preserving Reducer. |
| How to track SoL-Pi / DSH churn? | Thin adapters + `sol-core`; pin DSH like Pi 0.84.2; `check-dsh-compat.mjs`. |
| Does SoL bust KV cache? | Fusion/EPR/immediate spill: no (append-only). Delayed pack and OCC: yes, from the replaced token — OCC already requires the remaining horizon to repay `cacheWriteReadRatio`. |
| DSH config when unset? | Best profile via Schemastery defaults. Key metrics are config; install = opt-in. See [`dsh-configuration.md`](dsh-configuration.md). |
| Settings UI? | Native dshweb Plugins card (`settings.plugin.item`), not a Pi JSON/TUI skin. |
| Language? | Follow 通用设置 → 语言. zh+en dicts, miss → en. No SoL language field. |

Native DSH support is the right architecture if the goal is “SoL mechanisms inside DeepSeek Harness.” It is a new adapter plus a bundle manifest, not a flag on the Pi entrypoint.

---

## 13. Keeping the DSH plugin in sync as SoL-Pi (and DSH) move

Two clocks will tick independently:

1. **SoL-Pi mechanisms** — NVIDIA will keep changing thresholds, receipt rules, economics, fusion queue behavior.
2. **DSH public seams** — 0.1.x is developer preview; events, `ctx.*` services, and patch semantics will change.

The elegant way is the same pattern this repo already uses for Pi: **pin the host, share the algorithm, keep adapters thin**.

### 13.1 Split the tree so mechanism PRs do not touch Cordis

```
src/
  sol-core/            # no Pi imports, no Cordis imports
    action-fusion/     # queue, hash-before-then_run
    observation-pack/  # threshold, FULL_SENDS, placeholder, ledger
    evidence-preserving-reducer/  # eligibility, archive, validateReceipt
    online-context-compact/       # decideCompaction, economics constants
  sol-pi/              # Pi ExtensionAPI only
  sol-dsh/             # Cordis apply() + cordis.patch.yml only
```

| Kind of upstream change | Where it lands | DSH plugin work |
|---|---|---|
| Receipt schema, regex, `FULL_SENDS`, `cacheWriteReadRatio` default, fusion skip-if-changed | `sol-core` + shared tests | **None**, if the adapter already calls that function |
| New Pi event / Pi 0.85 | `sol-pi` + `scripts/check-pi-compat.mjs` | None |
| DSH renamed `tools/post-execute`, compaction idle rules, tool-fs row id | `sol-dsh` + `scripts/check-dsh-compat.mjs` | Only the adapter |
| New fifth SoL mechanism | `sol-core` + both adapters | New listener, same bundle |

Rule: a mechanism PR that needs `import` from `@earendil-works/*` or `@deepseek-ai/*` in `sol-core/` is in the wrong layer.

This is the dual-host layout already recorded as the intended architecture; it is **not in the tree yet**.

### 13.2 Pin DSH the way Pi is pinned

Today Pi is not a floating range at test time: devDependencies are `0.84.2`, `scripts/check-pi-compat.mjs` asserts the public symbols SoL actually imports, and `agents-install.md` treats a different Pi version as a compatibility change.

Do the same for DSH:

- Peer/dev-pin one tested `@deepseek-ai/dsh*` version (start at `0.1.5-rc.2`). Do **not** use `*` while DSH is preview.
- `scripts/check-dsh-compat.mjs` imports the seams the plugin calls (`defineTool`, `ctx.tools` types, `CompactionEngine` methods, `GenerateOptions.purpose` union, `PostToolDecision`, row ids `tool-fs` / `spill-policy`).
- CI: `npm run check` (core + Pi) and a DSH job that boots `dsh --profile web --dump-config` against a fixture profile listing the SoL bundle.
- When DSH breaks a seam: bump the pin, fix `sol-dsh` only, keep `sol-core` tests green without a DSH install.

### 13.3 Bundle identity so users update without editing YAML

Ship `sol-dsh` as a real `dsh.bundle` package. Users update with:

```bash
dsh plugin --profile web update sol-dsh
# or
dsh plugin --profile web add sol-dsh@<new>
```

Because composition is **bundle patches in list order**, a new SoL version can insert new rows or override `tool-fs` by **stable ids** (`sol-dsh`, `sol-dsh-epr`, …). Users’ `cordis.patch.yml` keeps winning on those ids if they restated config — document that they must restate, because DSH patches replace whole `config` objects.

Do not ask users to copy plugin source into a profile. That cannot track SoL-Pi.

### 13.4 Contract tests, not snapshotting DSH

Shared tests in `sol-core` are zero-host and should stay the source of truth for “what SoL does.” Each adapter adds a thin harness test:

- Pi: already drives `ExtensionAPI` with no provider (`tests/all-mechanisms.test.ts`).
- DSH: in-memory session + fake `ctx.llm.stream` + `ctx.tools.execute`, assert EPR fail-open, fusion `then_run`, OCC `decideCompaction` inputs.

When NVIDIA tightens a receipt rule, one core test fails on both hosts. When DSH changes an event name, only the DSH adapter test fails.

### 13.5 What not to do

- A fake `ExtensionAPI` inside DSH — every SoL-Pi commit becomes an emulator bug.
- Vendor `deepseek-harness` and merge DSH master — violates “no upstream patches” and makes SoL-Pi updates a monorepo rebase.
- One file that `if (host === 'dsh')` through Pi types — the next NVIDIA refactor will not compile on DSH, and the next DSH rename will not compile on Pi.

---

## 14. KV cache: will SoL on DSH bust prefix cache and lose money?

**Sometimes, by design — and SoL already prices that.** The wrong implementation (rewriting the middle of history every turn) would be expensive. The DSH-native shapes below are mostly **append-only**, which DSH documents as prefix-cache safe.

### 14.1 What actually invalidates KV cache on DSH

From first-party “KV Cache effect” notes (`dsh-agent-loop`, `dsh-tools`, `dsh-spill-policy`, `dsh-compaction-basic`, `dsh-compaction-tool-result-pruner`):

| Event | Cache |
|---|---|
| New user/tool/result appended at the tail | **Hit** on everything before it |
| Spill-policy first result is already a preview (`tools/post-execute` before commit) | **Append-only; does not invalidate** existing entries |
| Tool schemas / order change | Miss from the first changed schema token |
| Surface `replace` of an older `tool/result` (pruner, delayed pack) | Miss from the first replaced history token |
| Compaction checkpoint | Miss from the first shadowed history token; prefix *before* that range can remain reusable |
| Compaction summarizer that replays the last routed request byte-for-byte | **Hit** on that warm prefix; only the trailing instruction is uncached |

Pi ObservationPack’s silent projector can shrink a *past* message without a logged replace. That is cache-hostile on any provider that keys the prefix on exact bytes — and DSH forbids it. Logged replace is the honest version of the same miss.

### 14.2 Per-mechanism cost

**Action Fusion.** Registers a larger `edit`/`write` schema **once at boot**. For a whole session the schema bytes are identical, so the tools prefix stays cacheable (`dsh-tools`: prefix-stable while definitions and order are unchanged). Extra cost is a few schema tokens every request, not a mid-session bust. The win is **one avoided model round-trip** (the follow-up bash never becomes its own request that would re-send the growing prefix). Net: usually cheaper.

**EPR (`tools/post-execute`).** The first model-visible `tool/result` is already the receipt. Later requests append after a *shorter* tail. That is the same cache shape as spill: append-only. Extra cost is one small nested `ctx.llm.stream` (purpose unset). Fail-open means a reducer miss does not rewrite history. Net: cheaper on the main agent; the nested call is the bill.

**ObservationPack / spill.** Immediate spill (recommended DSH dialect): same as EPR — first visible result is small, **no invalidation**. Delayed `FULL_SENDS=2` then surface-replace: after two cached turns you **rewrite a historical node**, so the next request misses from that result onward. That is the expensive dialect. Only do it if measurements beat immediate spill; default should follow DSH spill (append-only).

**OCC / compaction.** This *is* a prefix miss from the shadowed range. SoL’s `decideCompaction` exists so it does not fire unless remaining requests repay the cache-write penalty:

```
incrementalCacheCostRatio = max(0, cacheWriteReadRatio - 1)
breakevenRequests = (writeTokens * incrementalCacheCostRatio) / savingTokens
compact only if remaining horizon ≥ breakeven (or window protection)
```

Default `cacheWriteReadRatio` is `12.5` (GPT-5.6 Sol OpenAI Standard, checked 2026-08-21 in `agents-install.md`). **DeepSeek’s cache-write/read price is not 12.5.** Before enabling OCC on DSH, set the ratio from the routed DeepSeek (or whatever) price sheet, or set `0` to mean “cache write is free relative to cache read.” If the ratio is unavailable, current code **defers** (`cache_ratio_unavailable`).

DSH `compaction-basic` will still auto-compact at 80% of the window even without SoL. OCC does not add a second engine; it only adds an *earlier, priced* trigger. The cache miss of a checkpoint is a cost you would pay at overflow anyway.

### 14.3 Design rules so SoL stays cache-cheap on DSH

1. Prefer **post-execute shrink** (EPR, spill) over **rewriting old surface nodes**.
2. Register fused tool schemas at plugin load, never swap `edit`/`write` mid-session (`tools/change` would bust the schema prefix).
3. Do not inject a new system-prompt section every step; if guidance is needed, register a stable `ctx.systemPrompt.section()` whose text is byte-identical across turns.
4. After OCC, `agent.steer` a short reminder — that is a new tail, not a rewrite of node 0.
5. Retune `cacheWriteReadRatio` per provider; do not copy 12.5 onto DeepSeek blindly.

**Bottom line:** using SoL on DSH does not inherently “作废缓存.” Fusion + EPR + immediate spill are prefix-stable and reduce future input. Delayed packing and OCC *do* miss cache, and OCC already refuses when that miss would not pay back. The cache-hostile port would be cloning Pi’s silent `context` rewrite or replacing history every turn.

### 14.4 Does “prefer append-only” fight SoL’s purpose?

**Only if it is treated as a ban on replace.** SoL’s purpose is not “never rewrite context.” It is [constrained efficiency](../README.md): *spend less without making the agent do less useful work* — fewer turns, less replay, less oversized observation, less whole-log reading — **without** stopping early, skipping verification, or hiding evidence.

Those savings come from two different times:

| When the bytes shrink | Mechanisms | Relation to purpose |
|---|---|---|
| **At birth** (never insert the expensive form) | Action Fusion; EPR on `tool_result` / `tools/post-execute`; immediate spill | Same purpose, cheaper cache. Pi already does EPR this way. |
| **After they have been useful** (stop replaying dead prefix) | ObservationPack after `FULL_SENDS`; OCC / native compaction | Same purpose, **must** change what later requests see. Pi ObservationPack already says it does not edit stored history, only the projection; DSH encodes that as logged surface replace. |

An absolute “append-only, never replace” rule **would** conflict with the project:

- OCC exists because “completed subtasks remain in active context.” Compaction is a replace. Forbidding it leaves DSH’s unpriced 80% auto-compact as the only shrink, which is *worse* SoL, not more SoL.
- ObservationPack’s product sentence is “sent in full for its first few provider requests, **then replaced** with a placeholder.” Immediate spill is a *dialect* (give up the hot full-sends); it is not a replacement for OCC.

The intended rule is a **preference, not a prohibition**:

1. If shrinking at birth achieves the same evidence-preserving saving (EPR, fusion, spill), do that — rewriting a cached prefix later would be extra miss for no extra SoL win.
2. If the bytes were still decision-relevant for a while (hot observation, completed plan step), replace later, and **pay** for it: ObservationPack after N full sends, OCC only when `decideCompaction` says the remaining horizon repays `cacheWriteReadRatio` (or the window is about to blow).

SoL already internalized cache cost in OCC (`incrementalCacheCostRatio = max(0, ratio - 1)`). “Prefer append-only” is the same economics applied to ObservationPack’s *implementation choice* on DSH, not a walk-back of compaction.

---

## 15. Native Web UI and locale (not a Pi skin)

DSH Web is the product surface. SoL on DSH must use it, not a translated Pi TUI.

**Settings.** Host `ctx.settings.installSection(ctx, 'sol-dsh', Config, …)` plus a `dsh.client` card on `settings.plugin.item` keyed `sol-dsh` ([settings-card cookbook](https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/adding-a-settings-card), `dsh-client-ui-settings-plugins`). Same Plugins tab as bash / agent-loop: expandable card, stage-until-save, discard, reset to composition default, revision-fenced writes. Widgets match General (switch, select, numeric+unit, caption). Full contract: [`dsh-configuration.md`](dsh-configuration.md).

**Language.** Do **not** add a SoL language field. Follow Settings → 通用设置 → 语言 (`dsh-client-locale`). Register `ctx.locale.register(ns, { zh, en })` with identical key sets. `zh` falls back to `en`; `FALLBACK_LOCALE` is `en` when the browser matches nothing. Missing copy must not invent a second i18n stack. SoL never calls `setLocale`. If dshweb is English, the card is English.

**Not Pi-shaped.** `sol-core` may still share algorithms with the Pi adapter. The DSH plugin’s config, events, storage, and UI are DSH-native. Reject: `sol-pi.json` on DSH, Pi `renderCall` in Web, a SoL sidebar language dropdown.

---

## Sources

### SoL-Pi (this repo)

- [`README.md`](../README.md), [`docs/compatibility.md`](compatibility.md), [`docs/configuration.md`](configuration.md), [`agents-install.md`](../agents-install.md)
- [`src/sol-pi/index.ts`](../src/sol-pi/index.ts) and the four `src/sol-pi/extensions/*` trees

### DSH first-party (0.1.5-rc.2 unless noted)

- Product: [https://www.deepseek.com/harness/en/](https://www.deepseek.com/harness/en/)
- Docs: [first plugin](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/), [package and install](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish), [architecture](https://deepseek-harness.github.io/deepseek-harness/en/reference/), [extension cookbook](https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/extension-cookbook), [compaction subsystem](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/compaction)
- Repo: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- Local packages: `@deepseek-ai/dsh-base` (`cordis.patch.yml` rows `tool-fs`, `tool-bash`, `spill-policy`, `tool-result-pruner`, `tool-todo`), `@deepseek-ai/dsh-tools`, `@deepseek-ai/dsh-agent`, `@deepseek-ai/dsh-agent-loop`, `@deepseek-ai/dsh-compaction`, `@deepseek-ai/dsh-compaction-basic`, `@deepseek-ai/dsh-compaction-tool-result-pruner`, `@deepseek-ai/dsh-spill`, `@deepseek-ai/dsh-spill-policy`, `@deepseek-ai/dsh-spill-local`, `@deepseek-ai/dsh-llm`, `@deepseek-ai/dsh-tool-fs`, `@deepseek-ai/dsh-plan-mode`, `@deepseek-ai/dsh-tool-todo`, `@deepseek-ai/dsh-hook-protocol`, `@deepseek-ai/dsh-package-manifest`

# DSH configuration (`dsh-sol-pi` bundle)

Install steps: [dsh.md](dsh.md).

Native DeepSeek Harness contract. **Do not shape this after Pi.** No `sol-pi.json`, no Pi TUI copy, no Pi event names, no separate language switch. The DSH adapter is a Cordis plugin + settings namespace + Web settings card. The npm package, Cordis plugin id, and settings namespace are all `dsh-sol-pi`. Source lives in `src/sol-dsh/`.

- Installing the bundle with `dsh plugin --profile <name> add …` **is** the opt-in.
- After install, omitted fields take **SoL’s DSH best defaults** (Schemastery `.default()`).
- Users change values in **Settings → 插件 → Plugin configuration** (same shell as bash / agent-loop cards), or by a partial `cordis.patch.yml` override.
- Invalid values fail plugin load. Unknown keys fail load (strict object).
- No environment variables. No credentials. Reducer route, when set, uses DSH-managed auth.
- **No `locale` / `language` field** in SoL config. UI language is Settings → 通用设置 → 语言 (`ctx.locale`).

Rationale: [research-dsh-native-support.md](research-dsh-native-support.md). Settings cookbook: [adding a settings card](https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/adding-a-settings-card). Locale: [`dsh-client-locale`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/locale).

## How config is applied

Cordis fills defaults from the exported `Config` schema ([plugin configuration](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/config)). The bundle row should **omit** `config` so the schema is the single source of “best”:

```yaml
# src/sol-dsh/cordis.patch.yml — ship this
- insert:
    - id: dsh-sol-pi
      name: dsh-sol-pi
```

Partial user override (profile `cordis.patch.yml` or `$DSH_HOME/cordis.patch.yml`):

```yaml
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 30   # DeepSeek V4 Pro miss/hit; other nested fields keep schema defaults
```

A DSH patch replaces the row’s `config` **object** as a whole, then Schemastery fills missing keys. Nested objects work the same: specify only `cacheWriteReadRatio` and `enabled` / other metrics stay at best defaults. Restating a nested object does **not** require listing every sibling mechanism.

HMR: changing the patch reloads the plugin; registrations unwind.

Runtime edits go through `ctx.settings.installSection` so the Web card and the Host plugin share one namespace (join key `dsh-sol-pi`). Composition `base` = schema best defaults (+ any patch). User layer = settings card overrides. `unset` returns a field to the composed default.

## Settings UI (must look and behave like dshweb)

The card lives only in **设置 → 插件 → 插件配置**, keyed as `settings.plugin.item` / namespace `dsh-sol-pi`. It must not invent a sidebar item, a second Settings app, or a Pi-like JSON editor.

Follow first-party plugin cards (`dsh-client-ui-settings-plugins`):

| Interaction | Required behavior |
|---|---|
| Layout | One expandable card among bash / agent-loop / … Same section chrome, not a custom page. |
| Edit model | Stage locally until **保存**. **丢弃** drops drafts. Header shows unsaved state while collapsed. |
| Reset | Stages the composed default; does not write until save. Overridden fields follow DSH (presence in the user layer, not value inequality). |
| Concurrency | Writes fenced with `expectedRevision`. Stale save is rejected, drafts kept. |
| Controls | Same widgets as General: switch, select, numeric+unit (like 字号 `14` `px`), helper caption under the title. |
| Secrets | None in v1. Never put keys in this namespace. |
| Copy | `ctx.locale.bind('settings.solDsh')` (or equivalent ns). No hardcoded UI strings. |
| Packaging | Host `src/` + browser `src/client/` as `./client`, `dsh.client.platform: 'web'`, `inject` includes `@deepseek-ai/dsh-client-ui-settings-plugins`. Card **owns its chrome** (first-party cards cannot be value-imported). |

Do not port Pi `renderCall` / `ui.notify` / lightning TUI into Web. Optional later: `tool.call.toolview` for savings, still using locale dictionaries.

## Language (follow dshweb, no SoL setting)

Screenshot reference: Settings → 通用设置 → 语言 (`中文` / `English`). That row is `dsh-client-locale`. SoL **must not** add a parallel control.

| Rule | Detail |
|---|---|
| Source of truth | `ctx.locale` / Host `locale.preference`. Absence ⇒ browser `navigator.languages`, then English (`FALLBACK_LOCALE`, `@deepseek-ai/dsh-client-locale`). |
| SoL config | **No language field.** Switching 通用设置语言 immediately restyles SoL copy (`locale/change` + LocaleFace revision). |
| Dictionaries | `ctx.locale.register(ns, { zh, en })` with **the same key set** in both (typed namespace). v1 only `zh` and `en`. |
| Authored default | Chinese copy is first-class (`zh` complete, not an afterthought). |
| Missing string | Walk the active locale’s fallback chain (shipped `zh` falls back to `en`), then `common`, then the key. That **is** “找不到回退英文”. Do not wrap a second i18n library. |
| Do not | Call `setLocale('zh')`, persist a SoL language, or default the whole app to Chinese from this plugin. |

If the user’s dshweb is English, SoL’s card is English. If it is 中文, the card is 中文.

## Best profile (what you get with no config)

| Mechanism | Default | Why this is the DSH best |
|---|---|---|
| Action Fusion | **on** | Local, schema-stable for the session, saves a round-trip. PTC/code mode already fuses; native mode needs this. |
| ObservationPack | **on**, mode `immediate` | Shrink at birth (append-only). Matches DSH spill dialect; `fullSends: 0`. Evidence stays in `ctx.spillStore` / `read`+`grep`. |
| Evidence-Preserving Reducer | **on**, reducer = current agent route | Unique SoL value. Fail-open. Diagnostic-command + likely-secret filters. Uses the model the user already configured — not `openai-codex` / `gpt-5.6-luna`. |
| Online Context Compact | **on**, `cacheWriteReadRatio: 50` | Priced replace. DeepSeek Flash peak cache **miss/hit = 0.30 / 0.006 = 50** ([Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing), checked 2026-09-14). Conservative: prefers not to bust a 50× cache. Window protection still fires. |

Installing the plugin enables this profile. Set any `enabled: false` to drop a mechanism without touching the others.

EPR still sends eligible diagnostic logs to the routed model. Same SECURITY.md rule: do not enable (or set `enabled: false`) when those logs must never leave the machine.

## Schema

```yaml
# All keys optional. Omitted ⇒ best default below.
actionFusion:
  enabled: true                    # boolean
observationPack:
  enabled: true                    # boolean
  mode: immediate                  # immediate | delayed
  thresholdBytes: 10240            # positive int; SoL 10 KiB
  fullSends: 0                     # immediate ⇒ 0; delayed typical 2
  placeholderExcerptBytes: 1024    # positive int; head+tail budget
evidencePreservingReducer:
  enabled: true                    # boolean
  minBytes: 4096                   # UTF-8; below this, skip
  maxChars: 600000                 # above this, fail-open
  maxOutputTokens: 2048            # reducer cap
  timeoutMs: 90000                 # reducer abort
  reducerProvider: ''              # empty ⇒ latest routed agent provider
  reducerModel: ''                 # empty ⇒ latest routed agent model
onlineContextCompact:
  enabled: true                    # boolean
  cacheWriteReadRatio: 50          # finite ≥ 0; 0 ⇒ cache write free vs read
  keepRecentTokens: 0              # 0 ⇒ follow DSH retainRatio (0.16 × window)
  nativeSummaryTokenEstimate: 1000
  windowReserveTokens: 16384
  firstCompactionRequestScale: 2
  subsequentCompactionMargin: 1.5
```

### Validation

| Field | Rule |
|---|---|
| booleans | must be boolean |
| `mode` | `immediate` \| `delayed` only |
| `fullSends` | integer ≥ 0; `immediate` forces effective 0 even if set higher (load warning or reject — reject is better: `immediate` + `fullSends > 0` fails load) |
| byte/char/token/ms metrics | finite numbers; counts are positive safe integers except `keepRecentTokens` and `cacheWriteReadRatio` which allow 0 |
| `cacheWriteReadRatio` | finite ≥ 0 |
| `keepRecentTokens` | 0 or positive safe integer |
| `subsequentCompactionMargin` | finite ≥ 1 |
| `reducerProvider` / `reducerModel` | strings; both empty or both non-empty |
| unknown keys | fail load |
| credentials, URLs, storage paths | forbidden keys — fail load |

Protocol constants that are **not** config (changing them changes receipt identity): `MAX_EVIDENCE_ITEMS` (12), `MAX_QUOTE_CHARS` (600), receipt schema id, `LIKELY_SECRET` / `DIAGNOSTIC_COMMAND` regexes. Those stay in `sol-core`.

## Metric catalog (what each number does)

### ObservationPack

| Key | Best | Effect |
|---|---|---|
| `mode` | `immediate` | `immediate`: first model-visible result is already a preview + locator (append-only, cache-safe). `delayed`: Pi dialect — `fullSends` full requests, then logged surface replace (cache miss from that node). |
| `thresholdBytes` | `10240` | Below this, leave the result alone. DSH spill-policy (50 000) remains a backstop for text SoL does not pack. |
| `fullSends` | `0` | Only for `delayed`. Pi uses 2. |
| `placeholderExcerptBytes` | `1024` | Head+tail excerpt in the placeholder. |

Do not invent `obs_recall` on DSH. Retrieval is `read` / `grep` on the spill locator.

### Evidence-Preserving Reducer

| Key | Best | Effect |
|---|---|---|
| `minBytes` | `4096` | Smaller logs stay inline (not worth a nested call). |
| `maxChars` | `600000` | Over this, fail-open (do not send a huge body to the reducer). |
| `maxOutputTokens` | `2048` | Receipt cap. |
| `timeoutMs` | `90000` | Nested call abort; original result kept. |
| `reducerProvider` / `reducerModel` | `''` / `''` | Empty pair uses the agent’s current route via `ctx.llm.stream` with `purpose` **unset**. A set pair must exist in `ctx.llm`. |

### Online Context Compact

| Key | Best | Effect |
|---|---|---|
| `cacheWriteReadRatio` | `50` | `breakevenRequests = writeTokens × max(0, ratio − 1) / savingTokens`. Flash miss/hit = 50. V4 Pro miss/hit = 30 (`1.32 / 0.044`). Off-peak ratios are the same (both sides halve). Non-DeepSeek: measure and set. `0` = no cache-write penalty. |
| `keepRecentTokens` | `0` | `0` = do not override DSH `retainRatio` 0.16. A positive value is an absolute retained tail for OCC’s archive estimate (Pi used 20 000 because Pi hid that setting). |
| `nativeSummaryTokenEstimate` | `1000` | Estimated size of the compaction memo in the economic check. |
| `windowReserveTokens` | `16384` | Compact regardless of economics when `contextTokens ≥ window − reserve`. |
| `firstCompactionRequestScale` | `2` | First compact uses a more optimistic remaining-request horizon. |
| `subsequentCompactionMargin` | `1.5` | Later compacts need 1.5× breakeven remaining requests. |

OCC still does **not** mount a second `CompactionEngine`. These numbers only decide *when* to call `ctx.compaction`.

### Action Fusion

No extra metrics in v1. `enabled` is the only switch. Timeout of `then_run` stays per-call (`then_run.timeout`), same as Pi (no implicit default).

## Suggested overrides

```yaml
# Cheaper compaction on DeepSeek V4 Pro (miss/hit = 30)
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 30

# Pi-like delayed packing (pays a cache miss after two full sends)
- id: dsh-sol-pi
  config:
    observationPack:
      mode: delayed
      fullSends: 2

# Logs must stay local
- id: dsh-sol-pi
  config:
    evidencePreservingReducer:
      enabled: false

# Provider with no prefix cache (ratio 1 ⇒ incremental cost 0)
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 1
```

## What stays with DSH

Do not put these in SoL config: API keys, provider URLs, main model, sandbox mode, `dsh-compaction-basic.thresholdRatio` / `retainRatio`, `dsh-spill-policy.maxInlineBytes`. Override those on their own row ids (`compaction-basic`, `spill-policy`) if needed. SoL’s `thresholdBytes` (10 KiB) is intentionally below DSH spill (50 KiB) so SoL handles the mid-size band and spill remains the backstop.

## Pi vs DSH (DSH is not a Pi port)

| | Pi | DSH (`dsh-sol-pi`) |
|---|---|---|
| Config file | `sol-pi.json` | settings namespace + optional patch; **no JSON sidecar** |
| Missing keys | all mechanisms **false** | best profile **on** |
| Opt-in moment | writing `sol-pi.json` | `dsh plugin add` |
| Settings UI | none (TUI notify only) | Settings → 插件 card, dshweb widgets |
| Language | n/a | follow 通用设置 → 语言; zh+en dicts; miss → en |
| `cacheWriteReadRatio` | 12.5 (GPT-5.6 OpenAI Standard, 2026-08-21) | 50 (DeepSeek Flash miss/hit, 2026-09-14) |
| EPR reducer | `openai-codex` / `gpt-5.6-luna` | empty = routed agent model |
| ObservationPack | projection after 2 full sends | immediate spill dialect |
| Tool chrome | Pi `renderCall` / `renderResult` | later `tool.call.toolview` if needed; not Pi TUI |

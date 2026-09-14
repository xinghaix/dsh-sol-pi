<p align="center">
  <img src="assets/sol-pi-hero.png" width="100%" alt="dsh-sol-pi: SoL efficiency mechanisms for DeepSeek Harness" />
</p>

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

# dsh-sol-pi

<p align="center">
  <a href="#install"><img src="https://img.shields.io/badge/Install-dsh%20plugin-76B900" alt="Install" /></a>
  <a href="docs/dsh-configuration.md"><img src="https://img.shields.io/badge/Docs-DSH%20config-555555" alt="DSH configuration" /></a>
  <a href="https://nvlabs.github.io/SoL-Pi/"><img src="https://img.shields.io/badge/Blog-SoL--Pi-76B900" alt="SoL-Pi Blog" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

> [!NOTE]
> **`dsh-sol-pi`** is a **native [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Cordis plugin**. It packages the four SoL efficiency mechanisms for DSH Web / TUI / headless. Algorithms live in `src/sol-core/`; the DSH adapter is `src/sol-dsh/`. This is not an official DeepSeek or NVIDIA distribution. Upstream research and the original Pi extension live at [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi); this repo also keeps a Pi adapter for that path.

## TL;DR

**Spend less without making the agent do less useful work.**

Install the plugin into your DSH profile. That install **is** the opt-in: all four mechanisms default **on**. Configure them in **Settings → 插件 → 插件配置** (SoL card), or under the `dsh-sol-pi` namespace in `~/.dsh/settings.yaml`.

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi
dsh --profile web --dump-config | grep dsh-sol-pi   # expect id: dsh-sol-pi
dsh web
```

Then open **Settings → 插件**. Language follows **Settings → 通用设置 → 语言**. There is no separate SoL language setting.

## What you get

| Area | Mechanism | On DSH |
|---|---|---|
| Tools | **Action Fusion** | `edit` / `write` can take optional `then_run` so a follow-up command shares one observation. |
| Observations | **ObservationPack** | Large tool results spill to disk and show a preview; retrieve with `read` / `grep`. No `obs_recall`. |
| Delegation | **Evidence-Preserving Reducer** | Long diagnostic logs may become a verified local receipt (uses the current agent model unless you pin a reducer route). |
| Context | **Online Context Compact** | Policy on official `ctx.compaction` (`todo_write` boundaries + `compactNow`). **Not** a second compression engine — `dsh-compaction-basic` still owns how compaction runs. |

Shared rules on DSH:

- **No DSH / Pi forks.** Uses public Cordis seams (`ctx.tools`, `ctx.llm.stream`, `ctx.compaction`).
- **Install = opt-in.** Omitted keys take the DSH best profile (all four enabled).
- **Preserve evidence.** Archives stay local; reducer failures leave the original result.
- **Host owns auth and models.** Do not put API keys or provider URLs in the SoL namespace.

## Install

Requirements: Node.js 22.19+, a working `dsh` CLI, profile `web` (or another profile that loads `dsh-base`). Tested on DSH **0.1.5-rc.2**.

### From GitHub (typical)

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi
dsh --profile web --dump-config    # composed tree must include id: dsh-sol-pi
dsh web
```

Uninstall by **package name**, not the GitHub URL:

```bash
dsh plugin --profile web remove dsh-sol-pi
```

### From a local checkout

```bash
git clone https://github.com/xinghaix/dsh-sol-pi.git
cd dsh-sol-pi
npm ci --ignore-scripts
npm run build:dsh
dsh plugin --profile web add "$(pwd)"
dsh web
```

`npm run build:dsh` writes `dist/sol-dsh/index.js` (Host) and `dist/sol-dsh/client.js` (Web settings card). GitHub installs use the committed `dist/` copies.

### Other profiles

```bash
dsh plugin --profile tui add github:xinghaix/dsh-sol-pi
dsh plugin --profile headless add github:xinghaix/dsh-sol-pi
```

The settings card is Web-only (`dsh.client.platform: web`). TUI / headless still get the Host mechanisms.

## Configure

| Where | What |
|---|---|
| **Settings → 插件 → SoL** | Stage changes, **保存** / **放弃修改**, per-field **已覆盖** / **恢复默认**. |
| `~/.dsh/settings.yaml` | User layer under `dsh-sol-pi:` (same file as other plugins). |
| Profile / `$DSH_HOME/cordis.patch.yml` | Composition `config:` on the `dsh-sol-pi` row. |

Defaults after install (no extra config):

- Action Fusion **on**
- ObservationPack **on**, `mode: immediate`
- Evidence-Preserving Reducer **on** (reducer = current agent route)
- Online Context Compact **on**, `cacheWriteReadRatio: 50` (DeepSeek Flash peak miss/hit; use **30** for V4 Pro)

Example patch:

```yaml
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 30
    evidencePreservingReducer:
      enabled: false    # logs must not leave the machine
```

Full schema and UI rules: **[docs/dsh-configuration.md](docs/dsh-configuration.md)**. Install / status detail: **[docs/dsh.md](docs/dsh.md)**.

Online Context Compact **calls** official compaction; it does **not** replace `dsh-compaction-basic` (`thresholdRatio`, `retainRatio`, `autoCompact`, …). Keep those under their own settings namespace.

## Confirm it is active

1. `dsh --profile web --dump-config` lists `id: dsh-sol-pi`.
2. **Settings → 插件** shows the **SoL** card.
3. In a running session, the system prompt includes `SoL (dsh-sol-pi) is active.`

The plugin loads with the profile. **New sessions and resumed historical sessions** both use it, as long as that `dsh` process has the plugin installed. Mechanisms apply to **later** turns and tool calls; they do not rewrite old messages.

Run only one `dsh web` (or Desktop-supervised web) against the same session at a time, or you can hit `SessionAlreadyOwnedError`.

## Storage and security

Session archives (ObservationPack / EPR) live under the session directory as `dsh-sol-pi/<session-id>/`. They stay local.

Evidence-Preserving Reducer may send eligible diagnostic logs to the routed model. Turn it off in the SoL card (or set `evidencePreservingReducer.enabled: false`) if logs must not leave the machine. See [SECURITY.md](SECURITY.md).

## Documentation

| Document | Purpose |
|---|---|
| [DSH install and status](docs/dsh.md) | Install, defaults, confirm, remove |
| [DSH configuration](docs/dsh-configuration.md) | Settings schema, Web card, locale, OCC vs `dsh-compaction-basic` |
| [Compatibility](docs/compatibility.md) | DSH seams and Pi adapter notes |
| [Security](SECURITY.md) | Local storage and remote reduction |
| [Pi configuration](docs/configuration.md) | Optional Pi `sol-pi.json` path (not used by DSH) |

## Development

```bash
npm ci --ignore-scripts
npm run check          # typecheck + tests + check:dsh + pack
npm run build:dsh      # dist/sol-dsh/{index,client}.js
```

## Pi adapter (optional)

This checkout still includes the original Pi extension under `src/sol-pi/`. On Pi, missing `sol-pi.json` leaves every mechanism **off** (opposite of DSH). Install and config for that path: upstream [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi), [docs/configuration.md](docs/configuration.md), and [agents-install.md](agents-install.md).

## Project status

- **DSH:** Cordis plugin `dsh-sol-pi`, Web settings card, tested on **0.1.5-rc.2**.
- **Pi:** Opt-in via `sol-pi.json`, defaults all false, tested on **0.84.2**.
- Known DSH limits: ObservationPack `delayed` only archives (no silent projection hook); OCC uses `todo_write` boundaries rather than Pi’s `update_plan`.

We welcome tested, host-compatible PRs. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgements

SoL mechanisms come from NVIDIA’s SoL-Pi research and the public interfaces of [Pi](https://github.com/earendil-works/pi) and [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Neither host is vendored here.

## License

Released under the [MIT License](LICENSE).

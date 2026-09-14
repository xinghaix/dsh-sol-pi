<p align="center">
  <img src="assets/sol-pi-hero.png" width="100%" alt="SoL-Pi: Scaling Auto-Research Loops for Efficient Agent Harnesses" />
</p>

# ⚡ SoL-Pi: Scaling Auto-Research Loops for Efficient Agent Harnesses

<p align="center">
  <a href="#getting-started"><img src="https://img.shields.io/badge/Getting%20Started-Install-76B900" alt="Getting Started" /></a>
  <a href="docs/configuration.md"><img src="https://img.shields.io/badge/Docs-Configuration-555555" alt="Configuration" /></a>
  <a href="https://nvlabs.github.io/SoL-Pi/"><img src="https://img.shields.io/badge/Blog-SoL--Pi-76B900" alt="SoL-Pi Blog" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

> [!NOTE]
> Upstream SoL-Pi is a standalone extension for [Pi](https://github.com/earendil-works/pi), maintained by NVIDIA ([NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi)). This public repo is **`dsh-sol-pi`**: native DeepSeek Harness plugin plus the Pi adapter. It is not an official distribution of Pi or of DeepSeek Harness.

## 💡 TL;DR

**Spend less without making the agent do less useful work.**

SoL-Pi is a standalone extension for Pi that packages four reusable efficiency mechanisms discovered through scaled auto-research loops. It reduces repeated model turns, context replay, oversized observations, and unnecessary long-log reading while preserving the work and evidence an agent needs to finish a task.

On Pi, SoL installs on an unmodified release and every mechanism is opt-in (disabled by default). On DeepSeek Harness, installing the `dsh-sol-pi` bundle **is** the opt-in and omitted keys take the DSH best profile.

## Introduction

Long-running coding agents accumulate repeated work. A file edit is often followed by a predictable validation command. Large tool results are replayed long after their first use. Completed subtasks remain in active context, and a frontier model may spend a full request reading a log when only a few lines affect the next decision.

SoL-Pi grew out of a broader question from our auto-research work: before scaling agent loops, can agents first make the harness itself more efficient? The search focused on constrained efficiency: reducing token traffic, inference work, and agent turns without stopping early, skipping verification, or hiding evidence.

The standalone release contains four mechanisms that survived that process. They operate at different parts of the harness and compose through Pi's public extension APIs.

## What SoL-Pi Adds

| Area | Mechanism | What changes |
|---|---|---|
| Tools | **Action Fusion** | An edit or write can run its follow-up validation command in the same tool call. |
| Observations | **ObservationPack** | Repeated large text results become stable handles with exact paged recall. |
| Delegation | **Evidence-Preserving Reducer** | Long diagnostic logs become compact receipts only when every retained quotation matches the archived source. |
| Context | **Online Context Compact** | Completed plan steps become candidate points for Pi's native compaction, subject to economic and window-pressure checks; after a successful compaction, Pi continues the task in a new turn. |

The mechanisms share four rules:

- **No Pi patches.** SoL-Pi imports public Pi APIs and does not vendor the Pi source tree.
- **Explicit opt-in.** A missing configuration leaves every mechanism disabled.
- **Preserve evidence.** Original observations remain available locally, and reducer failures leave the original result unchanged.
- **Use Pi's runtime choices.** Authentication, provider URLs, the main model, and shell behavior remain under Pi's control.

## DeepSeek Harness (native)

The same four mechanisms ship as a **native Cordis plugin** (`dsh-sol-pi`), not a Pi shim. Algorithms live in `src/sol-core/`. The adapter uses `ctx.tools`, `ctx.llm.stream` (`purpose` unset), and `ctx.compaction`.

Full install, status, and security notes: **[docs/dsh.md](docs/dsh.md)**. Config contract: [docs/dsh-configuration.md](docs/dsh-configuration.md).

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi --allow-build dsh-sol-pi
dsh --profile web --dump-config    # must show id: dsh-sol-pi
dsh web
```

Then **Settings → 插件**. Language follows **Settings → 通用设置 → 语言** (zh / en). No SoL language setting. Omitted config = all four on, ObservationPack immediate, `cacheWriteReadRatio` 50.

## Technical Details and Core Insights

Read the [SoL-Pi blog](https://nvlabs.github.io/SoL-Pi/) for a deeper look at the technical details, design rationale, and core insights behind SoL-Pi, including how auto-research led to the four efficiency mechanisms and how they work.

## Getting Started

### Requirements

- Node.js 22.19 or newer
- npm
- `@earendil-works/pi-coding-agent` 0.84.2

### Install

Install the tested Pi release:

```bash
npm install --global @earendil-works/pi-coding-agent@0.84.2
```

Then install SoL-Pi directly from [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi):

```bash
pi install git:github.com/NVlabs/SoL-Pi
```

To install it only for the current project, use the project-local scope:

```bash
pi install git:github.com/NVlabs/SoL-Pi --local --approve
```

### Configure

SoL-Pi uses a single effective configuration. With the official Pi distribution, it looks for a `sol-pi.json` file in the following locations, in order:

1. `.pi/sol-pi.json` in the current project, if the project is trusted and the file exists;
2. `~/.pi/agent/sol-pi.json` otherwise.

If neither file exists, SoL-Pi uses its built-in defaults. The project-level configuration takes precedence over the user-level configuration; the two files are not merged.

The following conservative configuration enables only the two local mechanisms that make no additional model calls and do not stop an active run:

```json
{
  "version": 1,
  "actionFusion": true,
  "observationPack": true,
  "evidencePreservingReducer": false,
  "onlineContextCompact": false,
  "cacheWriteReadRatio": 12.5
}
```

Enable additional mechanisms only after reviewing their configuration and security implications. SoL-Pi uses no dedicated environment variables; feature flags, the reducer provider/model route, and the compaction ratio are configured in `sol-pi.json`.

For the complete schema, see [Configuration](docs/configuration.md). Coding agents and automated environments should follow the canonical [agent installation and configuration protocol](agents-install.md). Its all-enabled profile is checked with `scripts/check-sol-pi-config.mjs --require-all-enabled`.

## Storage and Security

ObservationPack and Evidence-Preserving Reducer store session-specific archives under:

```text
<session-directory>/sol-pi/<session-id>/
├── observation-pack/
└── evidence-preserving-reducer/
```

They archive eligible source material in this directory. The archived copies remain local and are not automatically deleted when the Pi session ends.

Online Context Compact stores its state in Pi's session log. After a successful compaction, it starts a new turn and automatically continues the active task. Cancelling the run or exiting Pi does not trigger automatic continuation.

Evidence-Preserving Reducer may send eligible diagnostic-log content to its configured reducer model using Pi-managed authentication. Review [SECURITY.md](SECURITY.md) before enabling it. Do not enable remote reduction for logs that must remain local.

## Documentation

| Document | Purpose |
|---|---|
| [DSH install and status](docs/dsh.md) | Native DeepSeek Harness plugin: install, defaults, current state |
| [DSH configuration](docs/dsh-configuration.md) | DSH settings schema, best profile, UI and locale rules |
| [Configuration](docs/configuration.md) | Pi `sol-pi.json` search order, schema, defaults, and trust behavior |
| [Compatibility](docs/compatibility.md) | Supported Pi APIs, DSH adapter seams, standalone integration |
| [Security](SECURITY.md) | Local storage, remote reduction, and sensitive behavior |
| [Agent installation](agents-install.md) | Reproducible Pi installation and all-enabled validation procedure |

## Development

Install from the lockfile and run the complete source checks:

```bash
npm ci --ignore-scripts
npm run check
npm audit --audit-level=high
node scripts/check-pi-compat.mjs
```

`npm run check` covers TypeScript, the complete test suite, and package inspection. The development dependency set is pinned to Pi 0.84.2; runtime Pi packages remain peer dependencies so Pi owns their installation and upgrades.

## Project Status

Upstream SoL-Pi is developed and maintained by NVIDIA as a standalone Pi extension.

This public repository ([xinghaix/dsh-sol-pi](https://github.com/xinghaix/dsh-sol-pi)) keeps that Pi path and publishes the DSH host as **`dsh-sol-pi`**:

- **Pi:** opt-in via `sol-pi.json`, defaults all **false**, tested on 0.84.2.
- **DSH:** Cordis bundle `dsh-sol-pi`, install = opt-in, Web settings card, tested on 0.1.5-rc.2. See [docs/dsh.md](docs/dsh.md).

DSH v1 limitations: ObservationPack `delayed` only archives (no silent projection hook); the Web card needs `npm run build:dsh` or `--allow-build dsh-sol-pi`; OCC uses `todo_write` rather than Pi’s `update_plan`.

We welcome tested, host-compatible PRs that improve token efficiency and reduce token cost. NVIDIA’s upstream contribution process is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgements

SoL-Pi builds on the public extension interfaces provided by [Pi](https://github.com/earendil-works/pi). Pi remains an independent upstream project and is not vendored into this repository.

## License

SoL-Pi is released under the [MIT License](LICENSE).

## Star History

<a href="https://www.star-history.com/?repos=NVlabs%2FSoL-Pi&amp;type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NVlabs/SoL-Pi/star-history/star-history-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/NVlabs/SoL-Pi/star-history/star-history-light.svg" />
    <img alt="SoL-Pi star history chart" src="https://raw.githubusercontent.com/NVlabs/SoL-Pi/star-history/star-history-light.svg" width="100%" />
  </picture>
</a>

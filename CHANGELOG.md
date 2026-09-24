# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

中文版：[CHANGELOG.zh-CN.md](./CHANGELOG.zh-CN.md)

## [0.2.2] - 2026-09-24

### Fixed

- Synced Action Fusion Unicode-space and Windows shell path normalization from upstream into shared `sol-core` (`resolveToolPath` / `normalizeWindowsShellPath`).
- Pi `stringConfigValue` (and config preflight) now trim EPR reducer route identifiers.

### Added

- arXiv paper link badge and short Paper line in `README.md` / `README.zh-CN.md` ([arXiv:2609.20519](https://arxiv.org/abs/2609.20519)).

## [0.2.1] - 2026-09-24

### Added

- Plugin manager artwork: root `icon.svg` (36×36, official DSH palette) declared via package.json `icon`. Mark encodes Action Fusion (amber twin notches + weld), ObservationPack/OCC density cascade, and EPR evidence receipt — not a generic plug/gear/wifi glyph.

## [0.2.0] - 2026-09-24

### Changed

- **Breaking (DSH 0.1.7-rc.1):** Client fiber inject switches from removed `settingsScope` to `configForms` (`ctx.configForms.get("dsh-sol-pi")`). Boot no longer waits forever on `settingsScope`.
- **Breaking:** Host no longer calls `settings.installSection`. Live settings use Schemastery `.volatile()` top-level sections; `apply` reads them via `liveSolDshConfig`.
- `configForms.mutate` now treats a `false` return (refused write + recovery) as save failure, matching official cards.
- `package.json`: version `0.2.0`; `dsh.engines.dsh` set to `>=0.1.7-rc.1`; peer `@deepseek-ai/dsh-settings` `^0.1.7-rc.1`; `@deepseek-ai/schemastery` `^3.18.4` (provides `.volatile()`).
- Custom `SolDshCard` UX kept (badges, save/discard, reducer model fold, model catalog inject); still mounts on `plugins.bundle.config`.

### Fixed

- Plugin activation pending on DSH 0.1.7-rc.1: `dsh-sol-pi: pending (waiting for service: settingsScope)`.

## [0.1.1] - 2026-09-20

### Fixed

- Migrate DSH plugin settings card wiring and bump package to 0.1.1 (see commit `fa6cd05`).

## Earlier

Earlier history (Pi dual-host port, native DSH seams, ObservationPack / EPR / OCC / Action Fusion) lives in git history starting from the `sol-dsh` / `dsh-sol-pi` rebrand commits. Notable themes: native Cordis plugin, Web settings card on the plugin-manager slot, and DSH 0.1.5–0.1.6-era `settingsScope` + `installSection` (superseded in 0.2.0).

[0.2.2]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.2
[0.2.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.1
[0.2.0]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.0
[0.1.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.1.1

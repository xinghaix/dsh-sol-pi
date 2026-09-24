# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

中文版：[CHANGELOG.zh-CN.md](./CHANGELOG.zh-CN.md)

## [0.2.7] - 2026-09-24

### Fixed
- Settings Save/Discard no-op after editing numeric fields (e.g. fullSends / keepRecentTokens): `dirty` ignored pending `texts` staging used by plain ValueRow inputs, so the footer buttons stayed disabled while 「已覆盖」still appeared. Dirty now includes pending text edits; Discard clears them.
- Footer 「放弃修改」/「保存」lacked hover/active feedback after dropping ui-primitives — add CSS hover/active/focus transitions without reintroducing ModuleLoader deps.

## [0.2.6] - 2026-09-24

### Fixed
- Settings missing because the client required `@deepseek-ai/dsh-client-ui-primitives`, which can miss the ModuleLoader seed table → factory aborts → no `plugins.bundle.config` → no Settings. Fix: seed-only deps (`react` / `react/jsx-runtime`) plus plain checkbox/select/badge controls in `SolDshCard`; drop primitives from the client build. Optional factory `console.info` logs remain for debug.

## [0.2.5] - 2026-09-24

### Fixed
- Plugin detail Settings still missing after 0.2.4: `dist/sol-dsh/client.js` ModuleLoader factory ended with esbuild's `module.exports = __toCommonJS(...)` (getter bag + `__esModule`) and never assigned `exports.apply = apply` / `exports.inject = inject` (unlike working `dsh-web-fetch-allowlist`). Cordis therefore never received `apply`, so `plugins.bundle.config` never registered, `ledger.bundles` lacked `dsh-sol-pi`, and PackageDetail hid Settings (`configured = ledger.bundles.has(pkg.name)`). Client build now re-homes own-property `exports.apply` / `exports.inject` before return; tests and `check-dsh-compat` lock the contract.

## [0.2.4] - 2026-09-24

### Fixed
- Plugin detail Settings still missing on DSH 0.1.7-rc.1 after 0.2.3: the Web client bundled Schemastery/cosmokit via `config.ts` and nested `ctx.inject(["modelDirectories"])`, unlike the working `dsh-web-fetch-allowlist` client. Split Cordis `Config` into `config-schema.ts`, keep `resolveSolDshConfig` Schema-free for the client, and register `plugins.bundle.config` with key `dsh-sol-pi` only (no soft inject).

## [0.2.3] - 2026-09-24

### Fixed

- Settings card missing on the DSH 0.1.7-rc.1 plugin detail page: `dsh.client.immediately` plus a hard `dsh.client.inject` on `@deepseek-ai/dsh-client-ui-model-selection` could leave the client fiber pending, so `plugins.bundle.config` never entered the plugin-manager ledger (`configured` stayed false). Align with `dsh-web-fetch-allowlist`: drop `immediately`, drop the model-selection package inject, and register the slot before the optional `modelDirectories` soft-inject.

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

[0.2.6]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.6
[0.2.3]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.3
[0.2.2]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.2
[0.2.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.1
[0.2.0]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.0
[0.1.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.1.1

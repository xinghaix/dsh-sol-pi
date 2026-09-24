# 更新日志

本文件记录本项目的重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

English: [CHANGELOG.md](./CHANGELOG.md)

## [0.2.6] - 2026-09-24

### 修复
- Settings 缺失：客户端 require 了 `@deepseek-ai/dsh-client-ui-primitives`，可能未命中 ModuleLoader seed 表 → 工厂中止 → 未注册 `plugins.bundle.config` → 无 Settings。修复：仅依赖 seed 模块（`react` / `react/jsx-runtime`），`SolDshCard` 改用原生 checkbox/select/badge；客户端构建不再 externalize primitives。可选保留工厂 `console.info` 便于调试。

## [0.2.5] - 2026-09-24

### 修复
- 0.2.4 之后插件详情 Settings 仍缺失：`dist/sol-dsh/client.js` 的 ModuleLoader 工厂以 esbuild 的 `module.exports = __toCommonJS(...)`（getter 包 + `__esModule`）结尾，从未像可用的 `dsh-web-fetch-allowlist` 那样赋值 `exports.apply = apply` / `exports.inject = inject`。Cordis 因此拿不到 `apply`，`plugins.bundle.config` 未注册，`ledger.bundles` 缺少 `dsh-sol-pi`，PackageDetail 隐藏 Settings（`configured = ledger.bundles.has(pkg.name)`）。客户端构建现在在 return 前把 `exports.apply` / `exports.inject` 写成自有属性；测试与 `check-dsh-compat` 锁定该契约。

## [0.2.4] - 2026-09-24

### 修复
- 在 DSH 0.1.7-rc.1 上，0.2.3 仍不显示插件详情 Settings：Web 客户端经 `config.ts` 打进了 Schemastery/cosmokit，并嵌套 `ctx.inject(["modelDirectories"])`，与可用的 `dsh-web-fetch-allowlist` 客户端不同。将 Cordis `Config` 拆到 `config-schema.ts`，客户端侧 `resolveSolDshConfig` 保持无 Schema，仅以 key `dsh-sol-pi` 注册 `plugins.bundle.config`（不再 soft-inject）。

## [0.2.3] - 2026-09-24

### 修复

- DSH 0.1.7-rc.1 插件详情页设置区消失：`dsh.client.immediately` 加上对 `@deepseek-ai/dsh-client-ui-model-selection` 的硬 inject，可能让客户端 fiber 一直 pending，导致 `plugins.bundle.config` 从未写入 plugin-manager ledger（`configured` 恒为 false）。与 `dsh-web-fetch-allowlist` 对齐：去掉 `immediately`、去掉 model-selection 包级 inject，并在可选的 `modelDirectories` soft-inject 之前先注册槽位。

## [0.2.2] - 2026-09-24

### 修复

- 从上游同步 Action Fusion 的 Unicode 空格与 Windows shell 路径归一化到共享的 `sol-core`（`resolveToolPath` / `normalizeWindowsShellPath`）。
- Pi 侧 `stringConfigValue`（及配置预检）对 EPR 归约路由标识做 trim。

### 新增

- 在 `README.md` / `README.zh-CN.md` 增加 arXiv 论文徽章与简短「论文」行（[arXiv:2609.20519](https://arxiv.org/abs/2609.20519)）。

## [0.2.1] - 2026-09-24

### 新增

- 插件管理器图标：根目录 `icon.svg`（36×36，官方 DSH 配色），经 package.json `icon` 声明。造型对应动作融合（琥珀双槽 + 焊柱）、ObservationPack/OCC 变密层叠，以及 EPR 证据回执——避免插头 / 齿轮 / Wi‑Fi 等大众符号。

## [0.2.0] - 2026-09-24

### 变更

- **破坏性（DSH 0.1.7-rc.1）：** 客户端 fiber inject 从已移除的 `settingsScope` 改为 `configForms`（`ctx.configForms.get("dsh-sol-pi")`）。启动不再永久等待 `settingsScope`。
- **破坏性：** Host 不再调用 `settings.installSection`。实时配置改为 Schemastery 顶层字段 `.volatile()`；`apply` 通过 `liveSolDshConfig` 读取。
- `configForms.mutate` 在返回 `false`（拒绝写入并恢复）时视为保存失败，与官方卡片一致。
- `package.json`：版本 `0.2.0`；`dsh.engines.dsh` 为 `>=0.1.7-rc.1`；peer `@deepseek-ai/dsh-settings` `^0.1.7-rc.1`；`@deepseek-ai/schemastery` `^3.18.4`（提供 `.volatile()`）。
- 保留自定义 `SolDshCard` 体验（覆盖徽章、保存/丢弃、归约模型折叠、模型目录 inject）；仍挂在 `plugins.bundle.config`。

### 修复

- DSH 0.1.7-rc.1 上插件无法激活：`dsh-sol-pi: pending (waiting for service: settingsScope)`。

## [0.1.1] - 2026-09-20

### 修复

- 迁移 DSH 插件设置卡接线并将包版本升至 0.1.1（见提交 `fa6cd05`）。

## 更早

更早的历史（Pi 双宿主移植、原生 DSH 接缝、ObservationPack / EPR / OCC / Action Fusion）见 git 记录，自 `sol-dsh` / `dsh-sol-pi` 品牌化提交起。主要主题：原生 Cordis 插件、plugin-manager 槽位上的 Web 设置卡，以及 DSH 0.1.5–0.1.6 时代的 `settingsScope` + `installSection`（已在 0.2.0 取代）。

[0.2.6]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.6
[0.2.3]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.3
[0.2.2]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.2
[0.2.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.1
[0.2.0]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.0
[0.1.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.1.1

# 更新日志

本文件记录本项目的重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

English: [CHANGELOG.md](./CHANGELOG.md)

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

[0.2.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.1
[0.2.0]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.2.0
[0.1.1]: https://github.com/xinghaix/dsh-sol-pi/releases/tag/v0.1.1

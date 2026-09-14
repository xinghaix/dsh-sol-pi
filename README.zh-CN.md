<p align="center">
  <img src="assets/sol-pi-hero.png" width="100%" alt="dsh-sol-pi：面向 DeepSeek Harness 的 SoL 效率机制" />
</p>

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

# dsh-sol-pi

<p align="center">
  <a href="#安装"><img src="https://img.shields.io/badge/安装-dsh%20plugin-76B900" alt="安装" /></a>
  <a href="docs/dsh-configuration.md"><img src="https://img.shields.io/badge/文档-DSH%20配置-555555" alt="DSH 配置" /></a>
  <a href="https://nvlabs.github.io/SoL-Pi/"><img src="https://img.shields.io/badge/Blog-SoL--Pi-76B900" alt="SoL-Pi Blog" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

> [!NOTE]
> **`dsh-sol-pi`** 是面向 **[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** 的 **原生 Cordis 插件**。它把四套 SoL 效率机制接到 DSH Web / TUI / headless。算法在 `src/sol-core/`，DSH 适配在 `src/sol-dsh/`。这不是 DeepSeek 或 NVIDIA 的官方发行版。上游研究与原始 Pi 扩展见 [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi)；本仓库仍保留 Pi 适配路径。

## 一句话

**少花钱，也不少干有用的活。**

把插件装进 DSH profile 就是 opt-in：四个机制默认 **全开**。在 **设置 → 插件 → 插件配置**（SoL 卡）里改，或编辑 `~/.dsh/settings.yaml` 里的 `dsh-sol-pi` 段。

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi
dsh --profile web --dump-config | grep dsh-sol-pi   # 应看到 id: dsh-sol-pi
dsh web
```

然后打开 **设置 → 插件**。界面语言跟随 **设置 → 通用设置 → 语言**，没有单独的 SoL 语言项。

## 你能得到什么

| 区域 | 机制 | 在 DSH 上的表现 |
|---|---|---|
| 工具 | **动作融合 (Action Fusion)** | `edit` / `write` 可带可选 `then_run`，跟进命令与文件改动写在同一次观察里。 |
| 观察 | **ObservationPack** | 大工具结果落盘并以预览展示；用 `read` / `grep` 取回全文。没有 `obs_recall`。 |
| 委派 | **证据保留归约 (EPR)** | 很长的诊断日志可收成可核对的本地回执（默认跟当前 Agent 模型；也可钉专用归约路由）。 |
| 上下文 | **在线上下文压缩 (OCC)** | 挂在官方 `ctx.compaction` 上的策略（`todo_write` 边界 + `compactNow`）。**不是**第二套压缩引擎——怎么压仍由 `dsh-compaction-basic` 负责。 |

DSH 上的共同约定：

- **不 fork DSH / Pi。** 只用公开 Cordis 接缝（`ctx.tools`、`ctx.llm.stream`、`ctx.compaction`）。
- **安装即 opt-in。** 省略的键走 DSH 最佳默认（四套全开）。
- **保留证据。** 归档留在本地；归约失败则保留原文。
- **鉴权与模型归宿主。** 不要在 SoL namespace 里放 API Key 或供应商 URL。

## 安装

要求：Node.js 22.19+、可用的 `dsh` CLI、`web` profile（或其它加载了 `dsh-base` 的 profile）。已在 DSH **0.1.5-rc.2** 验证。

### 从 GitHub 安装（常用）

```bash
dsh plugin --profile web add github:xinghaix/dsh-sol-pi
dsh --profile web --dump-config    # 合成树里必须有 id: dsh-sol-pi
dsh web
```

卸载请用 **包名**，不要用 GitHub URL：

```bash
dsh plugin --profile web remove dsh-sol-pi
```

### 从本地仓库安装

```bash
git clone https://github.com/xinghaix/dsh-sol-pi.git
cd dsh-sol-pi
npm ci --ignore-scripts
npm run build:dsh
dsh plugin --profile web add "$(pwd)"
dsh web
```

`npm run build:dsh` 会生成 `dist/sol-dsh/index.js`（Host）和 `dist/sol-dsh/client.js`（Web 设置卡）。从 GitHub 安装时使用仓库里已提交的 `dist/`。

### 其它 profile

```bash
dsh plugin --profile tui add github:xinghaix/dsh-sol-pi
dsh plugin --profile headless add github:xinghaix/dsh-sol-pi
```

设置卡仅 Web（`dsh.client.platform: web`）。TUI / headless 仍有 Host 侧机制。

## 配置

| 位置 | 内容 |
|---|---|
| **设置 → 插件 → SoL** | 本地暂存后 **保存** / **放弃修改**；字段级 **已覆盖** / **恢复默认**。 |
| `~/.dsh/settings.yaml` | 用户层 `dsh-sol-pi:`（与其它插件同一文件）。 |
| Profile / `$DSH_HOME/cordis.patch.yml` | `dsh-sol-pi` 行上的合成 `config:`。 |

安装后、不加额外配置时的默认：

- 动作融合 **开**
- ObservationPack **开**，`mode: immediate`
- 证据保留归约 **开**（归约 = 当前 Agent 路由）
- 在线上下文压缩 **开**，`cacheWriteReadRatio: 50`（DeepSeek Flash 峰值 miss/hit；V4 Pro 建议 **30**）

示例 patch：

```yaml
- id: dsh-sol-pi
  config:
    onlineContextCompact:
      cacheWriteReadRatio: 30
    evidencePreservingReducer:
      enabled: false    # 日志不得离机时关闭
```

完整 schema 与 UI 约定见 **[docs/dsh-configuration.md](docs/dsh-configuration.md)**。安装与状态见 **[docs/dsh.md](docs/dsh.md)**。

在线上下文压缩会 **调用** 官方压缩；它 **不会** 取代 `dsh-compaction-basic`（`thresholdRatio`、`retainRatio`、`autoCompact` 等）。那些仍写在各自的设置 namespace 里。

## 如何确认已生效

1. `dsh --profile web --dump-config` 里有 `id: dsh-sol-pi`。
2. **设置 → 插件** 能看到 **SoL** 卡。
3. 运行中的会话系统提示包含 `SoL (dsh-sol-pi) is active.`

插件随 profile 加载。**新会话和恢复的历史会话都会启用**，只要当前这个 `dsh` 进程已安装插件。机制作用在 **之后的** 轮次与工具调用，不会改写旧消息。

同一 session 不要同时开两个 `dsh web`（或 Desktop 托管的 web），否则可能出现 `SessionAlreadyOwnedError`。

## 存储与安全

ObservationPack / EPR 的会话归档在会话目录下的 `dsh-sol-pi/<session-id>/`，留在本地。

证据保留归约可能把符合条件的诊断日志发给当前路由模型。若日志不得离机，在 SoL 卡关掉，或设 `evidencePreservingReducer.enabled: false`。详见 [SECURITY.md](SECURITY.md)。

## 文档

| 文档 | 用途 |
|---|---|
| [DSH 安装与状态](docs/dsh.md) | 安装、默认值、确认、卸载 |
| [DSH 配置](docs/dsh-configuration.md) | 设置 schema、Web 卡、语言、OCC 与 `dsh-compaction-basic` |
| [兼容性](docs/compatibility.md) | DSH 接缝与 Pi 适配说明 |
| [安全](SECURITY.md) | 本地存储与远程归约 |
| [Pi 配置](docs/configuration.md) | 可选的 Pi `sol-pi.json` 路径（DSH 不用） |

## 开发

```bash
npm ci --ignore-scripts
npm run check          # typecheck + tests + check:dsh + pack
npm run build:dsh      # dist/sol-dsh/{index,client}.js
```

## Pi 适配（可选）

本仓库仍包含 `src/sol-pi/` 下的原始 Pi 扩展。在 Pi 上，缺少 `sol-pi.json` 时机制全部 **关闭**（与 DSH 相反）。安装与配置见上游 [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi)、[docs/configuration.md](docs/configuration.md)、[agents-install.md](agents-install.md)。

## 项目状态

- **DSH：** Cordis 插件 `dsh-sol-pi`，带 Web 设置卡，已在 **0.1.5-rc.2** 验证。
- **Pi：** 通过 `sol-pi.json` opt-in，默认全关，已在 **0.84.2** 验证。
- DSH 已知限制：ObservationPack 的 `delayed` 只做归档（无静默投影钩子）；OCC 用 `todo_write` 边界，而不是 Pi 的 `update_plan`。

欢迎经过测试、与宿主兼容的 PR。见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 致谢

SoL 机制来自 NVIDIA 的 SoL-Pi 研究，以及 [Pi](https://github.com/earendil-works/pi) 与 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的公开接口。本仓库不内嵌任一宿主源码。

## 许可证

以 [MIT License](LICENSE) 发布。

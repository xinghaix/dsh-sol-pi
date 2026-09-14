/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

export const SOL_DSH_LOCALE_NS = "settings.solDsh" as const;

export const zh = {
	title: "SoL",
	description: "上下文与工具效率：动作融合、ObservationPack、证据保留归约、在线压缩。",
	expand: "展开",
	overridden: "已覆盖",
	invalidNumber: "请输入有效数字",
	collapse: "收起",
	unsaved: "未保存",
	save: "保存",
	discard: "丢弃",
	reset: "重置为默认",
	saving: "正在保存…",
	saveFailed: "保存失败。草稿已保留。",
	conflict: "配置已在别处更新，保存被拒绝。请丢弃后重试。",
	readonly: "当前环境只读，无法写入设置。",
	actionFusion: "动作融合",
	actionFusionHelp: "为 edit / write 增加可选 then_run，在同一次观察里跑完后续命令。",
	observationPack: "ObservationPack",
	observationPackHelp: "大工具结果落盘并以预览代替全文。检索请用 read / grep，不要发明 obs_recall。",
	mode: "模式",
	modeImmediate: "立即（默认，不改历史前缀）",
	modeDelayed: "延迟（若干次全文后再替换，会缓存未命中）",
	thresholdBytes: "体积阈值（字节）",
	fullSends: "全文发送次数",
	placeholderExcerptBytes: "预览摘录（字节）",
	epr: "证据保留归约",
	eprHelp: "把诊断日志收成可核对的证据回执。日志不得离机时请关闭。",
	minBytes: "最小体积（字节）",
	maxChars: "最大字符",
	maxOutputTokens: "归约输出上限",
	timeoutMs: "超时（毫秒）",
	reducerProvider: "归约供应商",
	reducerModel: "归约模型",
	reducerRouteHelp: "留空则使用当前 agent 路由。两项必须同空或同填。",
	occ: "在线上下文压缩",
	occHelp: "只作为 ctx.compaction 的策略，不挂第二套压缩引擎。",
	cacheWriteReadRatio: "缓存写/读比",
	cacheWriteReadRatioHelp: "DeepSeek Flash 峰值 miss/hit = 50。V4 Pro = 30。",
	keepRecentTokens: "保留近期 token",
	keepRecentTokensHelp: "0 表示跟随 DSH retainRatio（约 0.16 × 窗口）。",
	nativeSummaryTokenEstimate: "摘要 token 估计",
	windowReserveTokens: "窗口保护预留",
	firstCompactionRequestScale: "首次压缩视野倍率",
	subsequentCompactionMargin: "后续压缩余量",
	enabled: "启用",
} as const;

export const en = {
	title: "SoL",
	description: "Context and tool efficiency: action fusion, ObservationPack, evidence-preserving reduction, online compaction.",
	expand: "Expand",
	overridden: "Overridden",
	invalidNumber: "Enter a valid number",
	collapse: "Collapse",
	unsaved: "Unsaved",
	save: "Save",
	discard: "Discard",
	reset: "Reset to defaults",
	saving: "Saving…",
	saveFailed: "Save failed. Drafts were kept.",
	conflict: "Configuration changed elsewhere; save was rejected. Discard and retry.",
	readonly: "This environment is read-only.",
	actionFusion: "Action fusion",
	actionFusionHelp: "Adds optional then_run on edit/write so the follow-up command shares one observation.",
	observationPack: "ObservationPack",
	observationPackHelp: "Stores large tool results and shows a preview. Retrieve with read/grep — do not invent obs_recall.",
	mode: "Mode",
	modeImmediate: "Immediate (default, prefix-cache safe)",
	modeDelayed: "Delayed (full sends then replace; cache miss)",
	thresholdBytes: "Threshold (bytes)",
	fullSends: "Full sends",
	placeholderExcerptBytes: "Preview excerpt (bytes)",
	epr: "Evidence-preserving reducer",
	eprHelp: "Turns diagnostic logs into a verifiable receipt. Disable if logs must not leave the machine.",
	minBytes: "Minimum size (bytes)",
	maxChars: "Maximum characters",
	maxOutputTokens: "Reducer output cap",
	timeoutMs: "Timeout (ms)",
	reducerProvider: "Reducer provider",
	reducerModel: "Reducer model",
	reducerRouteHelp: "Leave both empty to use the current agent route. Both must be empty or both set.",
	occ: "Online context compact",
	occHelp: "A policy on ctx.compaction — not a second compaction engine.",
	cacheWriteReadRatio: "Cache write/read ratio",
	cacheWriteReadRatioHelp: "DeepSeek Flash peak miss/hit = 50. V4 Pro = 30.",
	keepRecentTokens: "Keep-recent tokens",
	keepRecentTokensHelp: "0 follows DSH retainRatio (about 0.16 × window).",
	nativeSummaryTokenEstimate: "Summary token estimate",
	windowReserveTokens: "Window-protection reserve",
	firstCompactionRequestScale: "First-compaction horizon scale",
	subsequentCompactionMargin: "Subsequent compaction margin",
	enabled: "Enabled",
} as const;

export type SolDshLocaleKey = keyof typeof zh;

const zhKeys = Object.keys(zh).sort();
const enKeys = Object.keys(en).sort();
if (zhKeys.join("\0") !== enKeys.join("\0")) {
	throw new Error("sol-dsh locale dictionaries must share one key set");
}

export const solDshLocales = { zh, en };

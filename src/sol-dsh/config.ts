/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import Schema from "@deepseek-ai/schemastery";

export const SOL_DSH_SETTINGS_NAMESPACE = "dsh-sol-pi" as const;

const FORBIDDEN_KEYS = new Set([
	"apikey",
	"api_key",
	"api-key",
	"token",
	"password",
	"secret",
	"url",
	"baseurl",
	"base_url",
	"storagepath",
	"storeroot",
	"credentials",
	"locale",
	"language",
]);

const ROOT_KEYS = new Set([
	"actionFusion",
	"observationPack",
	"evidencePreservingReducer",
	"onlineContextCompact",
]);

const ACTION_FUSION_KEYS = new Set(["enabled"]);
const OBSERVATION_PACK_KEYS = new Set([
	"enabled",
	"mode",
	"thresholdBytes",
	"fullSends",
	"placeholderExcerptBytes",
]);
const EPR_KEYS = new Set([
	"enabled",
	"minBytes",
	"maxChars",
	"maxOutputTokens",
	"timeoutMs",
	"reducerProvider",
	"reducerModel",
]);
const OCC_KEYS = new Set([
	"enabled",
	"cacheWriteReadRatio",
	"keepRecentTokens",
	"nativeSummaryTokenEstimate",
	"windowReserveTokens",
	"firstCompactionRequestScale",
	"subsequentCompactionMargin",
]);

export type ObservationPackMode = "immediate" | "delayed";

export interface ActionFusionConfig {
	readonly enabled: boolean;
}

export interface ObservationPackConfig {
	readonly enabled: boolean;
	readonly mode: ObservationPackMode;
	readonly thresholdBytes: number;
	readonly fullSends: number;
	readonly placeholderExcerptBytes: number;
}

export interface EvidencePreservingReducerConfig {
	readonly enabled: boolean;
	readonly minBytes: number;
	readonly maxChars: number;
	readonly maxOutputTokens: number;
	readonly timeoutMs: number;
	readonly reducerProvider: string;
	readonly reducerModel: string;
}

export interface OnlineContextCompactConfig {
	readonly enabled: boolean;
	readonly cacheWriteReadRatio: number;
	readonly keepRecentTokens: number;
	readonly nativeSummaryTokenEstimate: number;
	readonly windowReserveTokens: number;
	readonly firstCompactionRequestScale: number;
	readonly subsequentCompactionMargin: number;
}

export interface SolDshConfig {
	readonly actionFusion: ActionFusionConfig;
	readonly observationPack: ObservationPackConfig;
	readonly evidencePreservingReducer: EvidencePreservingReducerConfig;
	readonly onlineContextCompact: OnlineContextCompactConfig;
}

const positiveInt = (fallback: number) => Schema.number().step(1).min(1).default(fallback);
const nonNegativeInt = (fallback: number) => Schema.number().step(1).min(0).default(fallback);

export const Config = Schema.object({
	actionFusion: Schema.object({
		enabled: Schema.boolean().default(true),
	}).default({ enabled: true }),
	observationPack: Schema.object({
		enabled: Schema.boolean().default(true),
		mode: Schema.union(["immediate", "delayed"] as const).default("immediate"),
		thresholdBytes: positiveInt(10_240),
		fullSends: nonNegativeInt(0),
		placeholderExcerptBytes: positiveInt(1024),
	}).default({
		enabled: true,
		mode: "immediate",
		thresholdBytes: 10_240,
		fullSends: 0,
		placeholderExcerptBytes: 1024,
	}),
	evidencePreservingReducer: Schema.object({
		enabled: Schema.boolean().default(true),
		minBytes: positiveInt(4096),
		maxChars: positiveInt(600_000),
		maxOutputTokens: positiveInt(2048),
		timeoutMs: positiveInt(90_000),
		reducerProvider: Schema.string().default(""),
		reducerModel: Schema.string().default(""),
	}).default({
		enabled: true,
		minBytes: 4096,
		maxChars: 600_000,
		maxOutputTokens: 2048,
		timeoutMs: 90_000,
		reducerProvider: "",
		reducerModel: "",
	}),
	onlineContextCompact: Schema.object({
		enabled: Schema.boolean().default(true),
		cacheWriteReadRatio: Schema.number().min(0).default(50),
		keepRecentTokens: nonNegativeInt(0),
		nativeSummaryTokenEstimate: positiveInt(1000),
		windowReserveTokens: positiveInt(16_384),
		firstCompactionRequestScale: Schema.number().min(0).default(2),
		subsequentCompactionMargin: Schema.number().min(1).default(1.5),
	}).default({
		enabled: true,
		cacheWriteReadRatio: 50,
		keepRecentTokens: 0,
		nativeSummaryTokenEstimate: 1000,
		windowReserveTokens: 16_384,
		firstCompactionRequestScale: 2,
		subsequentCompactionMargin: 1.5,
	}),
});

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new TypeError(`dsh-sol-pi: ${label} must be a plain object`);
	}
}

function rejectForbiddenAndUnknown(record: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
	for (const key of Object.keys(record)) {
		if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
			throw new Error(`dsh-sol-pi: forbidden config key "${key}"`);
		}
		if (!allowed.has(key)) {
			throw new Error(`dsh-sol-pi: unknown config key "${label}${key}"`);
		}
	}
}

/**
 * Validate and fill SoL's DSH best-profile defaults. Unknown and credential-like
 * keys fail load. `immediate` + `fullSends > 0` is rejected. Reducer route must
 * be both empty or both set.
 */
export function resolveSolDshConfig(raw: unknown = {}): SolDshConfig {
	assertPlainObject(raw, "configuration");
	rejectForbiddenAndUnknown(raw, ROOT_KEYS, "");
	if (raw.actionFusion !== undefined) {
		assertPlainObject(raw.actionFusion, "actionFusion");
		rejectForbiddenAndUnknown(raw.actionFusion, ACTION_FUSION_KEYS, "actionFusion.");
	}
	if (raw.observationPack !== undefined) {
		assertPlainObject(raw.observationPack, "observationPack");
		rejectForbiddenAndUnknown(raw.observationPack, OBSERVATION_PACK_KEYS, "observationPack.");
	}
	if (raw.evidencePreservingReducer !== undefined) {
		assertPlainObject(raw.evidencePreservingReducer, "evidencePreservingReducer");
		rejectForbiddenAndUnknown(raw.evidencePreservingReducer, EPR_KEYS, "evidencePreservingReducer.");
	}
	if (raw.onlineContextCompact !== undefined) {
		assertPlainObject(raw.onlineContextCompact, "onlineContextCompact");
		rejectForbiddenAndUnknown(raw.onlineContextCompact, OCC_KEYS, "onlineContextCompact.");
	}

	const config = Config(raw) as SolDshConfig;
	if (config.observationPack.mode === "immediate" && config.observationPack.fullSends > 0) {
		throw new Error("dsh-sol-pi: observationPack.mode immediate requires fullSends = 0");
	}
	const provider = config.evidencePreservingReducer.reducerProvider.trim();
	const model = config.evidencePreservingReducer.reducerModel.trim();
	if ((provider === "") !== (model === "")) {
		throw new Error("dsh-sol-pi: reducerProvider and reducerModel must both be empty or both be set");
	}
	if (!Number.isFinite(config.onlineContextCompact.cacheWriteReadRatio)) {
		throw new Error("dsh-sol-pi: cacheWriteReadRatio must be finite");
	}
	return {
		...config,
		evidencePreservingReducer: {
			...config.evidencePreservingReducer,
			reducerProvider: provider,
			reducerModel: model,
		},
	};
}

export const DEFAULT_SOL_DSH_CONFIG = resolveSolDshConfig({});

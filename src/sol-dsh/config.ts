/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

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

/** Best-profile defaults — plain data so the Web client never pulls Schemastery. */
export const SOL_DSH_DEFAULTS: SolDshConfig = {
	actionFusion: { enabled: true },
	observationPack: {
		enabled: true,
		mode: "immediate",
		thresholdBytes: 10_240,
		fullSends: 0,
		placeholderExcerptBytes: 1024,
	},
	evidencePreservingReducer: {
		enabled: true,
		minBytes: 4096,
		maxChars: 600_000,
		maxOutputTokens: 2048,
		timeoutMs: 90_000,
		reducerProvider: "",
		reducerModel: "",
	},
	onlineContextCompact: {
		enabled: true,
		cacheWriteReadRatio: 50,
		keepRecentTokens: 0,
		nativeSummaryTokenEstimate: 1000,
		windowReserveTokens: 16_384,
		firstCompactionRequestScale: 2,
		subsequentCompactionMargin: 1.5,
	},
};

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

function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNonNegInt(value: unknown, fallback: number): number {
	const n = asNumber(value, fallback);
	return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function asPosInt(value: unknown, fallback: number): number {
	const n = asNumber(value, fallback);
	return Number.isInteger(n) && n >= 1 ? n : fallback;
}

function asString(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

function asMode(value: unknown, fallback: ObservationPackMode): ObservationPackMode {
	return value === "delayed" || value === "immediate" ? value : fallback;
}

/**
 * Validate and fill SoL's DSH best-profile defaults. Unknown and credential-like
 * keys fail load. `immediate` + `fullSends > 0` is rejected. Reducer route must
 * be both empty or both set.
 *
 * Schema-free so `dist/sol-dsh/client.js` never bundles Schemastery/cosmokit
 * (those bloated the Web factory and risked ModuleLoader materialization failures
 * on Desktop WKWebView while dsh-web-fetch-allowlist's tiny client still worked).
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

	const d = SOL_DSH_DEFAULTS;
	const actionFusionRaw = (raw.actionFusion ?? {}) as Record<string, unknown>;
	const observationRaw = (raw.observationPack ?? {}) as Record<string, unknown>;
	const eprRaw = (raw.evidencePreservingReducer ?? {}) as Record<string, unknown>;
	const occRaw = (raw.onlineContextCompact ?? {}) as Record<string, unknown>;

	const config: SolDshConfig = {
		actionFusion: {
			enabled: asBoolean(actionFusionRaw.enabled, d.actionFusion.enabled),
		},
		observationPack: {
			enabled: asBoolean(observationRaw.enabled, d.observationPack.enabled),
			mode: asMode(observationRaw.mode, d.observationPack.mode),
			thresholdBytes: asPosInt(observationRaw.thresholdBytes, d.observationPack.thresholdBytes),
			fullSends: asNonNegInt(observationRaw.fullSends, d.observationPack.fullSends),
			placeholderExcerptBytes: asPosInt(
				observationRaw.placeholderExcerptBytes,
				d.observationPack.placeholderExcerptBytes,
			),
		},
		evidencePreservingReducer: {
			enabled: asBoolean(eprRaw.enabled, d.evidencePreservingReducer.enabled),
			minBytes: asPosInt(eprRaw.minBytes, d.evidencePreservingReducer.minBytes),
			maxChars: asPosInt(eprRaw.maxChars, d.evidencePreservingReducer.maxChars),
			maxOutputTokens: asPosInt(eprRaw.maxOutputTokens, d.evidencePreservingReducer.maxOutputTokens),
			timeoutMs: asPosInt(eprRaw.timeoutMs, d.evidencePreservingReducer.timeoutMs),
			reducerProvider: asString(eprRaw.reducerProvider, d.evidencePreservingReducer.reducerProvider),
			reducerModel: asString(eprRaw.reducerModel, d.evidencePreservingReducer.reducerModel),
		},
		onlineContextCompact: {
			enabled: asBoolean(occRaw.enabled, d.onlineContextCompact.enabled),
			cacheWriteReadRatio: asNumber(occRaw.cacheWriteReadRatio, d.onlineContextCompact.cacheWriteReadRatio),
			keepRecentTokens: asNonNegInt(occRaw.keepRecentTokens, d.onlineContextCompact.keepRecentTokens),
			nativeSummaryTokenEstimate: asPosInt(
				occRaw.nativeSummaryTokenEstimate,
				d.onlineContextCompact.nativeSummaryTokenEstimate,
			),
			windowReserveTokens: asPosInt(occRaw.windowReserveTokens, d.onlineContextCompact.windowReserveTokens),
			firstCompactionRequestScale: asNumber(
				occRaw.firstCompactionRequestScale,
				d.onlineContextCompact.firstCompactionRequestScale,
			),
			subsequentCompactionMargin: asNumber(
				occRaw.subsequentCompactionMargin,
				d.onlineContextCompact.subsequentCompactionMargin,
			),
		},
	};

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
	if (!(config.onlineContextCompact.subsequentCompactionMargin >= 1)) {
		throw new Error("dsh-sol-pi: subsequentCompactionMargin must be >= 1");
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

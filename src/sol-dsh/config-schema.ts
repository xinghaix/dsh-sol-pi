/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Cordis Host Config only — kept out of the Web client bundle.
 */

import Schema from "@deepseek-ai/schemastery";
import { SOL_DSH_DEFAULTS } from "./config.ts";

const d = SOL_DSH_DEFAULTS;

const positiveInt = (fallback: number) => Schema.number().step(1).min(1).default(fallback);
const nonNegativeInt = (fallback: number) => Schema.number().step(1).min(0).default(fallback);

const actionFusionSchema = Schema.object({
	enabled: Schema.boolean().default(d.actionFusion.enabled),
}).default({ enabled: d.actionFusion.enabled });

const observationPackSchema = Schema.object({
	enabled: Schema.boolean().default(d.observationPack.enabled),
	mode: Schema.union(["immediate", "delayed"] as const).default(d.observationPack.mode),
	thresholdBytes: positiveInt(d.observationPack.thresholdBytes),
	fullSends: nonNegativeInt(d.observationPack.fullSends),
	placeholderExcerptBytes: positiveInt(d.observationPack.placeholderExcerptBytes),
}).default({ ...d.observationPack });

const evidencePreservingReducerSchema = Schema.object({
	enabled: Schema.boolean().default(d.evidencePreservingReducer.enabled),
	minBytes: positiveInt(d.evidencePreservingReducer.minBytes),
	maxChars: positiveInt(d.evidencePreservingReducer.maxChars),
	maxOutputTokens: positiveInt(d.evidencePreservingReducer.maxOutputTokens),
	timeoutMs: positiveInt(d.evidencePreservingReducer.timeoutMs),
	reducerProvider: Schema.string().default(d.evidencePreservingReducer.reducerProvider),
	reducerModel: Schema.string().default(d.evidencePreservingReducer.reducerModel),
}).default({ ...d.evidencePreservingReducer });

const onlineContextCompactSchema = Schema.object({
	enabled: Schema.boolean().default(d.onlineContextCompact.enabled),
	cacheWriteReadRatio: Schema.number().min(0).default(d.onlineContextCompact.cacheWriteReadRatio),
	keepRecentTokens: nonNegativeInt(d.onlineContextCompact.keepRecentTokens),
	nativeSummaryTokenEstimate: positiveInt(d.onlineContextCompact.nativeSummaryTokenEstimate),
	windowReserveTokens: positiveInt(d.onlineContextCompact.windowReserveTokens),
	firstCompactionRequestScale: Schema.number().min(0).default(d.onlineContextCompact.firstCompactionRequestScale),
	subsequentCompactionMargin: Schema.number().min(1).default(d.onlineContextCompact.subsequentCompactionMargin),
}).default({ ...d.onlineContextCompact });

/**
 * Cordis Host Config — top-level sections are volatile so Plugins-card edits
 * apply in place (DSH 0.1.7+; `settings.installSection` was removed).
 */
export const Config = Schema.object({
	actionFusion: actionFusionSchema.volatile(),
	observationPack: observationPackSchema.volatile(),
	evidencePreservingReducer: evidencePreservingReducerSchema.volatile(),
	onlineContextCompact: onlineContextCompactSchema.volatile(),
});

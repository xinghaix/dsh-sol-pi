/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { resolveSolDshConfig, type SolDshConfig } from "./config.ts";

export type ConfigSource = () => SolDshConfig;

type VolatileRef<T> = { get(): T };

function isVolatileRef(value: unknown): value is VolatileRef<unknown> {
	return typeof value === "object" && value !== null && typeof (value as VolatileRef<unknown>).get === "function";
}

function sectionValue(value: unknown): unknown {
	return isVolatileRef(value) ? value.get() : value;
}

/**
 * Live config reader for DSH 0.1.7+.
 *
 * Cordis passes Schemastery volatile refs for each top-level section; `.get()`
 * always returns the current Host value (no `settings.installSection`). Plain
 * objects (unit tests) still resolve through `resolveSolDshConfig`.
 */
export function liveSolDshConfig(config: unknown = {}): ConfigSource {
	return () => {
		if (config && typeof config === "object") {
			const record = config as Record<string, unknown>;
			if (
				isVolatileRef(record.actionFusion) ||
				isVolatileRef(record.observationPack) ||
				isVolatileRef(record.evidencePreservingReducer) ||
				isVolatileRef(record.onlineContextCompact)
			) {
				return resolveSolDshConfig({
					actionFusion: sectionValue(record.actionFusion),
					observationPack: sectionValue(record.observationPack),
					evidencePreservingReducer: sectionValue(record.evidencePreservingReducer),
					onlineContextCompact: sectionValue(record.onlineContextCompact),
				});
			}
		}
		return resolveSolDshConfig(config ?? {});
	};
}

/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { Config, resolveSolDshConfig, SOL_DSH_SETTINGS_NAMESPACE, type SolDshConfig } from "./config.ts";
import type { DshContext } from "./host.ts";

export type ConfigSource = () => SolDshConfig;

/**
 * Register the `sol-dsh` settings namespace when a settings service exists.
 * The plugin-row config is the composition base. Missing service = entry only.
 */
export function installSolDshSettings(ctx: DshContext, entry: SolDshConfig, onLive: (config: SolDshConfig) => void): ConfigSource {
	let current = entry;
	let sourceThunk: () => unknown = () => current;
	onLive(current);
	const source = () => current;

	const readLive = () => {
		try {
			current = resolveSolDshConfig(sourceThunk());
		} catch {
			current = entry;
		}
		onLive(current);
	};

	const attach = (host: DshContext) => {
		if (!host.settings?.installSection) return;
		host.settings.installSection(host, SOL_DSH_SETTINGS_NAMESPACE, Config, entry, {
			setSource: (next) => {
				sourceThunk = next;
			},
			onChange: readLive,
			validate: (value) => {
				resolveSolDshConfig(value);
			},
		});
	};

	if (typeof ctx.inject === "function") {
		ctx.inject(["settings"], (child) => attach(child));
	} else {
		attach(ctx);
	}

	return source;
}

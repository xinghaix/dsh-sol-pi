/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { createElement } from "react";
import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig, SOL_DSH_SETTINGS_NAMESPACE, type SolDshConfig } from "../config.ts";
import { SolDshCard } from "./card.tsx";
import { SOL_DSH_LOCALE_NS, solDshLocales, type SolDshLocaleKey } from "./locales.ts";

type ClientContext = {
	locale?: {
		register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): void;
		bind?(ns: string): (key: string) => string;
		t?(ns: string, key: string): string;
	};
	slots?: {
		inject(slot: string, options: { key: string }, render: (ctx: ClientContext) => unknown): void;
	};
	get?(name: string): unknown;
};

/** Cordis fiber services — package names belong in package.json dsh.client.inject, not here. */
export const inject = ["slots", "locale"];

type SettingsRemote = {
	describe?(): Promise<readonly { namespace: string; revision?: number; value?: unknown; user?: unknown }[]>;
	get?(ns: string): Promise<{ value: unknown; revision: number } | unknown>;
	update?(ns: string, patch: object, expectedRevision?: number): Promise<void>;
};

function translator(ctx: ClientContext): (key: SolDshLocaleKey) => string {
	const bound = ctx.locale?.bind?.(SOL_DSH_LOCALE_NS);
	if (bound) return (key) => bound(key);
	return (key) => ctx.locale?.t?.(SOL_DSH_LOCALE_NS, key) ?? solDshLocales.en[key];
}

async function readConfig(remote: SettingsRemote | undefined): Promise<{ value: SolDshConfig; revision: number; writable: boolean }> {
	try {
		if (remote?.get) {
			const snapshot = await remote.get(SOL_DSH_SETTINGS_NAMESPACE);
			if (snapshot && typeof snapshot === "object" && "value" in snapshot) {
				const record = snapshot as { value: unknown; revision?: number };
				return {
					value: resolveSolDshConfig(record.value),
					revision: record.revision ?? 0,
					writable: true,
				};
			}
			return { value: resolveSolDshConfig(snapshot), revision: 0, writable: true };
		}
		const described = await remote?.describe?.();
		const row = described?.find((item) => item.namespace === SOL_DSH_SETTINGS_NAMESPACE);
		if (row) {
			return {
				value: resolveSolDshConfig(row.value),
				revision: row.revision ?? 0,
				writable: true,
			};
		}
	} catch {
		/* fall through */
	}
	return { value: DEFAULT_SOL_DSH_CONFIG, revision: 0, writable: false };
}

export function apply(ctx: ClientContext): void {
	ctx.locale?.register(SOL_DSH_LOCALE_NS, solDshLocales);
	ctx.slots?.inject("settings.plugin.item", { key: SOL_DSH_SETTINGS_NAMESPACE }, (frame) => {
		const remote = (frame.get?.("remote.settings") ?? frame.get?.("settings")) as SettingsRemote | undefined;
		const t = translator(frame);
		return createElement(SolDshCard, {
			t,
			load: () => readConfig(remote),
			onSave: async (patch, expectedRevision) => {
				if (!remote?.update) throw new Error(t("readonly"));
				await remote.update(SOL_DSH_SETTINGS_NAMESPACE, patch, expectedRevision);
			},
		});
	});
}

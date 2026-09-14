/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig, SOL_DSH_SETTINGS_NAMESPACE, type SolDshConfig } from "../config.ts";
import { SolDshCard } from "./card.tsx";
import { SOL_DSH_LOCALE_NS, solDshLocales, type SolDshLocaleKey } from "./locales.ts";

type SettingsScopeSnapshot = {
	status: "loading" | "ready" | "unavailable";
	value: SolDshConfig | undefined;
	base: unknown;
	user: unknown;
	revision: number | undefined;
	writable: boolean;
};

type SettingsScope = {
	getSnapshot(): SettingsScopeSnapshot;
	subscribe(listener: () => void): () => void;
	mutate(ops: readonly { op: "set" | "unset"; path: string[]; value?: unknown }[], expectedRevision?: number): Promise<void>;
	dispose?(): Promise<void>;
};

type SettingsScopeBinder = {
	bind(spec: { namespace: string; decode?: (section: unknown) => SolDshConfig | undefined }): SettingsScope;
};

type ClientContext = {
	locale: {
		register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): void;
		bind?(ns: string): (key: string) => string;
		t?(ns: string, key: string): string;
	};
	slots: {
		inject(slot: string, callback: () => unknown): () => void;
		register(options: Record<string, unknown>, component: unknown): () => void;
	};
	settingsScope: SettingsScopeBinder;
	effect?(callback: () => void | (() => void), label?: string): void;
};

/** Cordis fiber services — package rows belong in package.json dsh.client.inject. */
export const inject = ["slots", "locale", "settingsScope"];

export type SolDshSnapshot = {
	readonly value: SolDshConfig;
	readonly base: SolDshConfig;
	readonly user: Record<string, unknown> | undefined;
	readonly revision: number;
	readonly writable: boolean;
};

function translator(ctx: ClientContext): (key: SolDshLocaleKey) => string {
	const bound = ctx.locale.bind?.(SOL_DSH_LOCALE_NS);
	if (bound) return (key) => bound(key);
	return (key) => ctx.locale.t?.(SOL_DSH_LOCALE_NS, key) ?? solDshLocales.en[key];
}

function decodeSection(section: unknown): SolDshConfig | undefined {
	try {
		return resolveSolDshConfig(section);
	} catch {
		return undefined;
	}
}

function asUserLayer(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function whenSettled(scope: SettingsScope, timeoutMs = 8_000): Promise<SettingsScopeSnapshot> {
	const first = scope.getSnapshot();
	if (first.status !== "loading") return Promise.resolve(first);
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			off();
			resolve(scope.getSnapshot());
		}, timeoutMs);
		const off = scope.subscribe(() => {
			const next = scope.getSnapshot();
			if (next.status === "loading") return;
			clearTimeout(timer);
			off();
			resolve(next);
		});
	});
}

function deepEqual(left: unknown, right: unknown): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Settings → 插件 → 插件配置 card.
 * Reads/writes through `ctx.settingsScope` (same path as first-party cards).
 */
export function apply(ctx: ClientContext): void {
	ctx.effect?.(() => ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales), "dsh-sol-pi: locale dictionaries");
	if (!ctx.effect) ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales);

	const t = translator(ctx);
	const scope = ctx.settingsScope.bind({
		namespace: SOL_DSH_SETTINGS_NAMESPACE,
		decode: decodeSection,
	});
	ctx.effect?.(() => () => {
		void scope.dispose?.();
	}, "dsh-sol-pi: settings scope");

	ctx.slots.inject("settings.plugin.item", () =>
		ctx.slots.register(
			{
				name: "settings.plugin.item",
				key: SOL_DSH_SETTINGS_NAMESPACE,
				locale: SOL_DSH_LOCALE_NS,
				inject: () => ({
					t,
					load: async (): Promise<SolDshSnapshot> => {
						const snap = await whenSettled(scope);
						const base = decodeSection(snap.base) ?? DEFAULT_SOL_DSH_CONFIG;
						return {
							value: snap.value ?? base,
							base,
							user: asUserLayer(snap.user),
							revision: snap.revision ?? 0,
							writable: snap.writable && snap.status !== "unavailable",
						};
					},
					onSave: async (patch: SolDshConfig, expectedRevision: number, base: SolDshConfig, user: Record<string, unknown> | undefined) => {
						const snap = scope.getSnapshot();
						if (!snap.writable || snap.status === "unavailable") throw new Error(t("readonly"));
						const ops: { op: "set" | "unset"; path: string[]; value?: unknown }[] = [];
						for (const key of Object.keys(patch) as (keyof SolDshConfig)[]) {
							const next = patch[key];
							const composition = base[key];
							if (deepEqual(next, composition)) {
								if (user && Object.prototype.hasOwnProperty.call(user, key)) {
									ops.push({ op: "unset", path: [key] });
								}
							} else {
								ops.push({ op: "set", path: [key], value: next });
							}
						}
						if (ops.length > 0) await scope.mutate(ops, expectedRevision);
					},
				}),
			},
			SolDshCard,
		),
	);
}

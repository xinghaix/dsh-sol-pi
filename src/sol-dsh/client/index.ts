/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig, SOL_DSH_SETTINGS_NAMESPACE, type SolDshConfig } from "../config.ts";
import { SolDshCard } from "./card.tsx";
import { SOL_DSH_LOCALE_NS, solDshLocales, type SolDshLocaleKey } from "./locales.ts";

type ConfigFormSnapshot = {
	status: "loading" | "ready" | "unavailable";
	value: SolDshConfig | undefined;
	base: unknown;
	user: unknown;
	revision: number | undefined;
	writable: boolean;
};

/** DSH 0.1.7+ `configForms.get` face — mutate resolves to false after refused write + recovery. */
type ConfigForm = {
	getSnapshot(): ConfigFormSnapshot;
	subscribe(listener: () => void): () => void;
	mutate(ops: readonly { op: "set" | "unset"; path: string[]; value?: unknown }[], expectedRevision?: number): Promise<boolean>;
};

type ConfigFormsService = {
	get(entryId: string): ConfigForm;
};

type ModelCatalogProvider = {
	id: string;
	name: string;
	models: { id: string; name: string }[];
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
	configForms: ConfigFormsService;
	effect?(callback: () => void | (() => void), label?: string): void;
};

/** Cordis fiber services — package rows belong in package.json dsh.client.inject. */
export const inject = ["slots", "locale", "configForms"];

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

function whenSettled(scope: ConfigForm, timeoutMs = 8_000): Promise<ConfigFormSnapshot> {
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
 * Sidebar Plugins → dsh-sol-pi bundle configuration.
 * Reads/writes through `ctx.configForms` (DSH 0.1.7+; settingsScope was removed).
 *
 * Registration mirrors dsh-web-fetch-allowlist: register `plugins.bundle.config`
 * with `key === package.json name` (`dsh-sol-pi`) synchronously in `apply`, with
 * no nested `ctx.inject` and no Schemastery in this module graph.
 */
export function apply(ctx: ClientContext): void {
	try { console.info("[dsh-sol-pi] apply() registering plugins.bundle.config"); } catch { /* ignore */ }
	ctx.effect?.(() => ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales), "dsh-sol-pi: locale dictionaries");
	if (!ctx.effect) ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales);

	const t = translator(ctx);
	// Cordis Host entry id / plugin `name` export (same string as the npm package).
	const scope = ctx.configForms.get(SOL_DSH_SETTINGS_NAMESPACE);

	// PackageDetail shows Settings iff ledger.bundles.has(pkg.name); ledger keys
	// are plugins.bundle.config entry options.key values. Key MUST be the npm
	// package name — not a shortened Cordis host alias.
	ctx.slots.inject("plugins.bundle.config", () =>
		ctx.slots.register(
			{
				name: "plugins.bundle.config",
				key: SOL_DSH_SETTINGS_NAMESPACE,
				locale: SOL_DSH_LOCALE_NS,
				inject: () => ({
					t,
					// Model catalog is optional chrome; never gate slot registration on it.
					loadModelCatalog: async () => [] as ModelCatalogProvider[],
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
						if (ops.length > 0) {
							// configForms.mutate resolves to false after a refused write + recovery.
							const ok = await scope.mutate(ops, expectedRevision);
							if (!ok) {
								throw new Error(t("saveFailed"));
							}
							// Belt-and-suspenders: confirm the mirrored user layer matches.
							const settled = await whenSettled(scope);
							const value = decodeSection(settled.value);
							const settledUser = asUserLayer(settled.user);
							if (settled.status !== "ready" || !value || !deepEqual(value, patch) ||
								ops.some((op) => op.op === "unset"
									? settledUser && Object.prototype.hasOwnProperty.call(settledUser, op.path[0]!)
									: !deepEqual(settledUser?.[op.path[0]!], op.value))) {
								throw new Error(t("saveFailed"));
							}
						}
					},
				}),
			},
			SolDshCard,
		),
	);
}

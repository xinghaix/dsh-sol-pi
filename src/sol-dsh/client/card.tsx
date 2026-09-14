/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { IconChevronDownOutline14, Menu, Switch, Tag } from "@deepseek-ai/dsh-client-ui-primitives";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SolDshConfig } from "../config.ts";
import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig } from "../config.ts";
import type { SolDshLocaleKey } from "./locales.ts";
import styles from "./card.module.css";

export type Translator = (key: SolDshLocaleKey) => string;

export type SolDshSnapshot = {
	readonly value: SolDshConfig;
	readonly base: SolDshConfig;
	readonly user: Record<string, unknown> | undefined;
	readonly revision: number;
	readonly writable: boolean;
};

export type SolDshCardProps = {
	readonly t: Translator;
	readonly load: () => Promise<SolDshSnapshot>;
	readonly onSave: (
		patch: SolDshConfig,
		expectedRevision: number,
		base: SolDshConfig,
		user: Record<string, unknown> | undefined,
	) => Promise<void>;
};

function cloneConfig(value: SolDshConfig): SolDshConfig {
	return structuredClone(value);
}

function sameConfig(left: SolDshConfig, right: SolDshConfig): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function readPath(source: unknown, path: readonly string[]): unknown {
	let current: unknown = source;
	for (const key of path) {
		if (typeof current !== "object" || current === null || Array.isArray(current)) return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

function hasPath(user: unknown, path: readonly string[]): boolean {
	let current: unknown = user;
	for (const key of path) {
		if (typeof current !== "object" || current === null || Array.isArray(current)) return false;
		if (!Object.prototype.hasOwnProperty.call(current, key)) return false;
		current = (current as Record<string, unknown>)[key];
	}
	return true;
}

function writePath(target: SolDshConfig, path: readonly string[], value: unknown): SolDshConfig {
	const next = cloneConfig(target);
	let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>;
	for (let i = 0; i < path.length - 1; i += 1) {
		const key = path[i]!;
		const child = cursor[key];
		const copy =
			typeof child === "object" && child !== null && !Array.isArray(child)
				? { ...(child as Record<string, unknown>) }
				: {};
		cursor[key] = copy;
		cursor = copy;
	}
	cursor[path[path.length - 1]!] = value;
	return next;
}

function pathKey(path: readonly string[]): string {
	return path.join(".");
}

function FieldHead(props: {
	id?: string;
	label: string;
	overridden: boolean;
	disabled: boolean;
	overriddenLabel: string;
	resetLabel: string;
	onReset?: () => void;
}) {
	return (
		<div className={styles.head}>
			{props.id ? (
				<label className={styles.label} htmlFor={props.id}>
					{props.label}
				</label>
			) : (
				<span className={styles.label}>{props.label}</span>
			)}
			{props.overridden ? (
				<span className={styles.badges}>
					<Tag tone="neutral">{props.overriddenLabel}</Tag>
					{props.onReset ? (
						<button type="button" className={styles.reset} disabled={props.disabled} onClick={props.onReset}>
							{props.resetLabel}
						</button>
					) : null}
				</span>
			) : null}
		</div>
	);
}

function SwitchRow(props: {
	label: string;
	hint?: string;
	checked: boolean;
	disabled: boolean;
	overridden: boolean;
	overriddenLabel: string;
	resetLabel: string;
	onChange: (checked: boolean) => void;
	onReset: () => void;
}) {
	return (
		<div className={styles.field}>
			<div className={styles.toggleRow}>
				<span className={styles.toggleLabel}>{props.label}</span>
				{props.overridden ? (
					<span className={styles.badges}>
						<Tag tone="neutral">{props.overriddenLabel}</Tag>
						<button type="button" className={styles.reset} disabled={props.disabled} onClick={props.onReset}>
							{props.resetLabel}
						</button>
					</span>
				) : null}
				<Switch
					checked={props.checked}
					label={props.label}
					disabled={props.disabled}
					onChange={props.onChange}
				/>
			</div>
			{props.hint ? <p className={styles.hint}>{props.hint}</p> : null}
		</div>
	);
}

function ValueRow(props: {
	id: string;
	label: string;
	hint?: string;
	text: string;
	disabled: boolean;
	numeric?: boolean;
	invalid?: boolean;
	invalidLabel: string;
	overridden: boolean;
	overriddenLabel: string;
	resetLabel: string;
	onEdit: (text: string) => void;
	onReset: () => void;
}) {
	return (
		<div className={styles.field}>
			<FieldHead
				id={props.id}
				label={props.label}
				overridden={props.overridden}
				disabled={props.disabled}
				overriddenLabel={props.overriddenLabel}
				resetLabel={props.resetLabel}
				onReset={props.onReset}
			/>
			<input
				id={props.id}
				className={props.invalid ? styles.inputInvalid : styles.input}
				type="text"
				inputMode={props.numeric ? "numeric" : undefined}
				aria-invalid={props.invalid || undefined}
				value={props.text}
				disabled={props.disabled}
				onChange={(event) => props.onEdit(event.target.value)}
			/>
			{props.invalid ? (
				<p className={styles.invalid}>{props.invalidLabel}</p>
			) : props.hint ? (
				<p className={styles.hint}>{props.hint}</p>
			) : null}
		</div>
	);
}

function SelectRow(props: {
	id: string;
	label: string;
	hint?: string;
	detail?: string;
	value: string;
	options: readonly { id: string; label: string }[];
	disabled: boolean;
	overridden: boolean;
	overriddenLabel: string;
	resetLabel: string;
	onChange: (value: string) => void;
	onReset: () => void;
}) {
	const [open, setOpen] = useState(false);
	const selected = props.options.find((option) => option.id === props.value);
	const triggerLabel = selected?.label ?? props.value;

	return (
		<div className={styles.field}>
			<FieldHead
				id={props.id}
				label={props.label}
				overridden={props.overridden}
				disabled={props.disabled}
				overriddenLabel={props.overriddenLabel}
				resetLabel={props.resetLabel}
				onReset={props.onReset}
			/>
			<Menu
				open={open}
				onClose={() => setOpen(false)}
				items={props.options}
				selectedId={props.value}
				align="start"
				portal
				onSelect={(id) => {
					setOpen(false);
					if (id === props.value) return;
					props.onChange(id);
				}}
				anchor={
					<button
						type="button"
						id={props.id}
						className={styles.selector}
						aria-haspopup="menu"
						aria-expanded={open}
						disabled={props.disabled}
						onClick={() => setOpen((value) => !value)}
					>
						<span className={styles.selectorLabel}>{triggerLabel}</span>
						<IconChevronDownOutline14
							className={`${styles.selectorChevron}${open ? ` ${styles.selectorChevronOpen}` : ""}`}
						/>
					</button>
				}
			/>
			{props.hint ? <p className={styles.hint}>{props.hint}</p> : null}
			{props.detail ? <p className={styles.hint}>{props.detail}</p> : null}
		</div>
	);
}

/**
 * Settings → 插件 → 插件配置 card, chrome aligned with first-party PluginCard.
 */
export function SolDshCard(props: SolDshCardProps) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(() => cloneConfig(DEFAULT_SOL_DSH_CONFIG));
	const [loaded, setLoaded] = useState(DEFAULT_SOL_DSH_CONFIG);
	const [base, setBase] = useState(DEFAULT_SOL_DSH_CONFIG);
	const [user, setUser] = useState<Record<string, unknown> | undefined>();
	const [texts, setTexts] = useState<Record<string, string>>({});
	const [clears, setClears] = useState<Set<string>>(() => new Set());
	const [revision, setRevision] = useState(0);
	const [writable, setWritable] = useState(false);
	const [saving, setSaving] = useState(false);
	const [failed, setFailed] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const saveStarted = useRef(false);

	const syncFromSnapshot = (snapshot: SolDshSnapshot) => {
		setLoaded(snapshot.value);
		setDraft(cloneConfig(snapshot.value));
		setBase(snapshot.base);
		setUser(snapshot.user);
		setRevision(snapshot.revision);
		setWritable(snapshot.writable);
		setTexts({});
		setClears(new Set());
		setFailed(false);
		setError(undefined);
	};

	useEffect(() => {
		void props.load().then(syncFromSnapshot);
	}, [props]);

	useEffect(() => {
		if (saving) {
			saveStarted.current = true;
			return;
		}
		if (!saveStarted.current) return;
		saveStarted.current = false;
		if (!sameConfig(draft, loaded) || clears.size > 0) return;
		if (!failed) setOpen(false);
	}, [saving, draft, loaded, clears, failed]);

	const dirty = useMemo(() => !sameConfig(draft, loaded) || clears.size > 0, [draft, loaded, clears]);
	const t = props.t;
	const disabled = !writable || saving;

	const textOf = (path: readonly string[], fallback: string | number): string => {
		const key = pathKey(path);
		return Object.prototype.hasOwnProperty.call(texts, key) ? texts[key]! : String(fallback);
	};

	const overridden = (path: readonly string[]): boolean => {
		const key = pathKey(path);
		if (clears.has(key)) return false;
		if (Object.prototype.hasOwnProperty.call(texts, key)) return true;
		const draftValue = readPath(draft, path);
		const loadedValue = readPath(loaded, path);
		if (JSON.stringify(draftValue) !== JSON.stringify(loadedValue)) return true;
		return hasPath(user, path);
	};

	const editText = (path: readonly string[], text: string) => {
		const key = pathKey(path);
		setTexts((current) => ({ ...current, [key]: text }));
		setClears((current) => {
			const next = new Set(current);
			next.delete(key);
			return next;
		});
		setFailed(false);
		setError(undefined);
	};

	const editValue = (path: readonly string[], value: unknown) => {
		const key = pathKey(path);
		setDraft((current) => writePath(current, path, value));
		setTexts((current) => {
			if (!Object.prototype.hasOwnProperty.call(current, key)) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
		setClears((current) => {
			const next = new Set(current);
			next.delete(key);
			return next;
		});
		setFailed(false);
		setError(undefined);
	};

	const resetPath = (path: readonly string[]) => {
		const key = pathKey(path);
		const composition = readPath(base, path);
		setDraft((current) => writePath(current, path, composition));
		setTexts((current) => {
			if (!Object.prototype.hasOwnProperty.call(current, key)) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
		setClears((current) => new Set(current).add(key));
		setFailed(false);
		setError(undefined);
	};

	const parseNumericDrafts = (): { ok: true; value: SolDshConfig } | { ok: false } => {
		let next = draft;
		const numericPaths: [string[], number][] = [
			[["observationPack", "thresholdBytes"], draft.observationPack.thresholdBytes],
			[["observationPack", "fullSends"], draft.observationPack.fullSends],
			[["observationPack", "placeholderExcerptBytes"], draft.observationPack.placeholderExcerptBytes],
			[["evidencePreservingReducer", "minBytes"], draft.evidencePreservingReducer.minBytes],
			[["evidencePreservingReducer", "maxChars"], draft.evidencePreservingReducer.maxChars],
			[["evidencePreservingReducer", "maxOutputTokens"], draft.evidencePreservingReducer.maxOutputTokens],
			[["evidencePreservingReducer", "timeoutMs"], draft.evidencePreservingReducer.timeoutMs],
			[["onlineContextCompact", "cacheWriteReadRatio"], draft.onlineContextCompact.cacheWriteReadRatio],
			[["onlineContextCompact", "keepRecentTokens"], draft.onlineContextCompact.keepRecentTokens],
			[["onlineContextCompact", "nativeSummaryTokenEstimate"], draft.onlineContextCompact.nativeSummaryTokenEstimate],
			[["onlineContextCompact", "windowReserveTokens"], draft.onlineContextCompact.windowReserveTokens],
			[["onlineContextCompact", "firstCompactionRequestScale"], draft.onlineContextCompact.firstCompactionRequestScale],
			[["onlineContextCompact", "subsequentCompactionMargin"], draft.onlineContextCompact.subsequentCompactionMargin],
		];
		for (const [path, fallback] of numericPaths) {
			const key = pathKey(path);
			if (!Object.prototype.hasOwnProperty.call(texts, key)) continue;
			const raw = texts[key]!;
			const n = Number(raw);
			if (!Number.isFinite(n) || n < 0) return { ok: false };
			next = writePath(next, path, n);
		}
		return { ok: true, value: next };
	};

	const invalidNumeric = (path: readonly string[]): boolean => {
		const key = pathKey(path);
		if (!Object.prototype.hasOwnProperty.call(texts, key)) return false;
		const n = Number(texts[key]);
		return !Number.isFinite(n) || n < 0;
	};

	const anyInvalid = useMemo(() => {
		return Object.keys(texts).some((key) => {
			if (key.includes("reducerProvider") || key.includes("reducerModel")) return false;
			const n = Number(texts[key]);
			return !Number.isFinite(n) || n < 0;
		});
	}, [texts]);

	const saveDisabled = !dirty || saving || !writable || anyInvalid;
	const discardDisabled = !dirty || saving;

	const onDiscard = () => {
		setDraft(cloneConfig(loaded));
		setTexts({});
		setClears(new Set());
		setFailed(false);
		setError(undefined);
	};

	const onSave = async () => {
		if (saveDisabled) return;
		const parsed = parseNumericDrafts();
		if (!parsed.ok) return;
		setSaving(true);
		setFailed(false);
		setError(undefined);
		try {
			const resolved = resolveSolDshConfig(parsed.value);
			await props.onSave(resolved, revision, base, user);
			const snapshot = await props.load();
			syncFromSnapshot(snapshot);
		} catch (failure) {
			setFailed(true);
			setError(failure instanceof Error ? failure.message : t("saveFailed"));
		} finally {
			setSaving(false);
		}
	};

	const title = t("title");
	const common = {
		disabled,
		overriddenLabel: t("overridden"),
		resetLabel: t("reset"),
		invalidLabel: t("invalidNumber"),
	};

	return (
		<li className={`${styles.card}${open ? ` ${styles.cardOpen}` : ""}`} data-plugin="dsh-sol-pi">
			<button
				type="button"
				className={styles.header}
				aria-expanded={open}
				aria-label={`${t(open ? "collapse" : "expand")}: ${title}`}
				onClick={() => setOpen((value) => !value)}
			>
				<span className={styles.headText}>
					<span className={styles.name}>{title}</span>
					<span className={styles.description}>{t("description")}</span>
				</span>
				{dirty ? (
					<Tag tone="neutral" className={styles.pending}>
						{t("unsaved")}
					</Tag>
				) : null}
				<IconChevronDownOutline14 className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`} />
			</button>

			{open ? (
				<div className={styles.body}>
					{!writable ? (
						<p className={styles.readOnly} role="status">
							{t("readonly")}
						</p>
					) : null}

					<SwitchRow
						{...common}
						label={t("actionFusion")}
						hint={t("actionFusionHelp")}
						checked={draft.actionFusion.enabled}
						overridden={overridden(["actionFusion", "enabled"])}
						onChange={(checked) => editValue(["actionFusion", "enabled"], checked)}
						onReset={() => resetPath(["actionFusion", "enabled"])}
					/>

					<SwitchRow
						{...common}
						label={t("observationPack")}
						hint={t("observationPackHelp")}
						checked={draft.observationPack.enabled}
						overridden={overridden(["observationPack", "enabled"])}
						onChange={(checked) => editValue(["observationPack", "enabled"], checked)}
						onReset={() => resetPath(["observationPack", "enabled"])}
					/>
					<SelectRow
						{...common}
						id="sol-obs-mode"
						label={t("mode")}
						hint={t("modeHelp")}
						detail={
							draft.observationPack.mode === "delayed" ? t("modeDelayedHint") : t("modeImmediateHint")
						}
						value={draft.observationPack.mode}
						options={[
							{ id: "immediate", label: t("modeImmediate") },
							{ id: "delayed", label: t("modeDelayed") },
						]}
						overridden={overridden(["observationPack", "mode"])}
						onChange={(value) => {
							editValue(["observationPack", "mode"], value === "delayed" ? "delayed" : "immediate");
							if (value === "delayed" && draft.observationPack.fullSends < 2) {
								editValue(["observationPack", "fullSends"], 2);
							}
							if (value === "immediate") editValue(["observationPack", "fullSends"], 0);
						}}
						onReset={() => resetPath(["observationPack", "mode"])}
					/>
					<ValueRow
						{...common}
						id="sol-obs-threshold"
						label={t("thresholdBytes")}
						hint={t("thresholdBytesHelp")}
						numeric
						text={textOf(["observationPack", "thresholdBytes"], draft.observationPack.thresholdBytes)}
						invalid={invalidNumeric(["observationPack", "thresholdBytes"])}
						overridden={overridden(["observationPack", "thresholdBytes"])}
						onEdit={(text) => editText(["observationPack", "thresholdBytes"], text)}
						onReset={() => resetPath(["observationPack", "thresholdBytes"])}
					/>
					<ValueRow
						{...common}
						id="sol-obs-fullsends"
						label={t("fullSends")}
						hint={t("fullSendsHelp")}
						numeric
						text={textOf(["observationPack", "fullSends"], draft.observationPack.fullSends)}
						invalid={invalidNumeric(["observationPack", "fullSends"])}
						overridden={overridden(["observationPack", "fullSends"])}
						onEdit={(text) => editText(["observationPack", "fullSends"], text)}
						onReset={() => resetPath(["observationPack", "fullSends"])}
					/>
					<ValueRow
						{...common}
						id="sol-obs-excerpt"
						label={t("placeholderExcerptBytes")}
						hint={t("placeholderExcerptBytesHelp")}
						numeric
						text={textOf(["observationPack", "placeholderExcerptBytes"], draft.observationPack.placeholderExcerptBytes)}
						invalid={invalidNumeric(["observationPack", "placeholderExcerptBytes"])}
						overridden={overridden(["observationPack", "placeholderExcerptBytes"])}
						onEdit={(text) => editText(["observationPack", "placeholderExcerptBytes"], text)}
						onReset={() => resetPath(["observationPack", "placeholderExcerptBytes"])}
					/>

					<SwitchRow
						{...common}
						label={t("epr")}
						hint={t("eprHelp")}
						checked={draft.evidencePreservingReducer.enabled}
						overridden={overridden(["evidencePreservingReducer", "enabled"])}
						onChange={(checked) => editValue(["evidencePreservingReducer", "enabled"], checked)}
						onReset={() => resetPath(["evidencePreservingReducer", "enabled"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-min"
						label={t("minBytes")}
						hint={t("minBytesHelp")}
						numeric
						text={textOf(["evidencePreservingReducer", "minBytes"], draft.evidencePreservingReducer.minBytes)}
						invalid={invalidNumeric(["evidencePreservingReducer", "minBytes"])}
						overridden={overridden(["evidencePreservingReducer", "minBytes"])}
						onEdit={(text) => editText(["evidencePreservingReducer", "minBytes"], text)}
						onReset={() => resetPath(["evidencePreservingReducer", "minBytes"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-maxchars"
						label={t("maxChars")}
						hint={t("maxCharsHelp")}
						numeric
						text={textOf(["evidencePreservingReducer", "maxChars"], draft.evidencePreservingReducer.maxChars)}
						invalid={invalidNumeric(["evidencePreservingReducer", "maxChars"])}
						overridden={overridden(["evidencePreservingReducer", "maxChars"])}
						onEdit={(text) => editText(["evidencePreservingReducer", "maxChars"], text)}
						onReset={() => resetPath(["evidencePreservingReducer", "maxChars"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-out"
						label={t("maxOutputTokens")}
						hint={t("maxOutputTokensHelp")}
						numeric
						text={textOf(["evidencePreservingReducer", "maxOutputTokens"], draft.evidencePreservingReducer.maxOutputTokens)}
						invalid={invalidNumeric(["evidencePreservingReducer", "maxOutputTokens"])}
						overridden={overridden(["evidencePreservingReducer", "maxOutputTokens"])}
						onEdit={(text) => editText(["evidencePreservingReducer", "maxOutputTokens"], text)}
						onReset={() => resetPath(["evidencePreservingReducer", "maxOutputTokens"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-timeout"
						label={t("timeoutMs")}
						hint={t("timeoutMsHelp")}
						numeric
						text={textOf(["evidencePreservingReducer", "timeoutMs"], draft.evidencePreservingReducer.timeoutMs)}
						invalid={invalidNumeric(["evidencePreservingReducer", "timeoutMs"])}
						overridden={overridden(["evidencePreservingReducer", "timeoutMs"])}
						onEdit={(text) => editText(["evidencePreservingReducer", "timeoutMs"], text)}
						onReset={() => resetPath(["evidencePreservingReducer", "timeoutMs"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-provider"
						label={t("reducerProvider")}
						hint={t("reducerRouteHelp")}
						text={textOf(["evidencePreservingReducer", "reducerProvider"], draft.evidencePreservingReducer.reducerProvider)}
						overridden={overridden(["evidencePreservingReducer", "reducerProvider"])}
						onEdit={(text) => {
							editText(["evidencePreservingReducer", "reducerProvider"], text);
							editValue(["evidencePreservingReducer", "reducerProvider"], text);
						}}
						onReset={() => resetPath(["evidencePreservingReducer", "reducerProvider"])}
					/>
					<ValueRow
						{...common}
						id="sol-epr-model"
						label={t("reducerModel")}
						text={textOf(["evidencePreservingReducer", "reducerModel"], draft.evidencePreservingReducer.reducerModel)}
						overridden={overridden(["evidencePreservingReducer", "reducerModel"])}
						onEdit={(text) => {
							editText(["evidencePreservingReducer", "reducerModel"], text);
							editValue(["evidencePreservingReducer", "reducerModel"], text);
						}}
						onReset={() => resetPath(["evidencePreservingReducer", "reducerModel"])}
					/>

					<SwitchRow
						{...common}
						label={t("occ")}
						hint={t("occHelp")}
						checked={draft.onlineContextCompact.enabled}
						overridden={overridden(["onlineContextCompact", "enabled"])}
						onChange={(checked) => editValue(["onlineContextCompact", "enabled"], checked)}
						onReset={() => resetPath(["onlineContextCompact", "enabled"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-ratio"
						label={t("cacheWriteReadRatio")}
						hint={t("cacheWriteReadRatioHelp")}
						numeric
						text={textOf(["onlineContextCompact", "cacheWriteReadRatio"], draft.onlineContextCompact.cacheWriteReadRatio)}
						invalid={invalidNumeric(["onlineContextCompact", "cacheWriteReadRatio"])}
						overridden={overridden(["onlineContextCompact", "cacheWriteReadRatio"])}
						onEdit={(text) => editText(["onlineContextCompact", "cacheWriteReadRatio"], text)}
						onReset={() => resetPath(["onlineContextCompact", "cacheWriteReadRatio"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-keep"
						label={t("keepRecentTokens")}
						hint={t("keepRecentTokensHelp")}
						numeric
						text={textOf(["onlineContextCompact", "keepRecentTokens"], draft.onlineContextCompact.keepRecentTokens)}
						invalid={invalidNumeric(["onlineContextCompact", "keepRecentTokens"])}
						overridden={overridden(["onlineContextCompact", "keepRecentTokens"])}
						onEdit={(text) => editText(["onlineContextCompact", "keepRecentTokens"], text)}
						onReset={() => resetPath(["onlineContextCompact", "keepRecentTokens"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-summary"
						label={t("nativeSummaryTokenEstimate")}
						hint={t("nativeSummaryTokenEstimateHelp")}
						numeric
						text={textOf(
							["onlineContextCompact", "nativeSummaryTokenEstimate"],
							draft.onlineContextCompact.nativeSummaryTokenEstimate,
						)}
						invalid={invalidNumeric(["onlineContextCompact", "nativeSummaryTokenEstimate"])}
						overridden={overridden(["onlineContextCompact", "nativeSummaryTokenEstimate"])}
						onEdit={(text) => editText(["onlineContextCompact", "nativeSummaryTokenEstimate"], text)}
						onReset={() => resetPath(["onlineContextCompact", "nativeSummaryTokenEstimate"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-reserve"
						label={t("windowReserveTokens")}
						hint={t("windowReserveTokensHelp")}
						numeric
						text={textOf(["onlineContextCompact", "windowReserveTokens"], draft.onlineContextCompact.windowReserveTokens)}
						invalid={invalidNumeric(["onlineContextCompact", "windowReserveTokens"])}
						overridden={overridden(["onlineContextCompact", "windowReserveTokens"])}
						onEdit={(text) => editText(["onlineContextCompact", "windowReserveTokens"], text)}
						onReset={() => resetPath(["onlineContextCompact", "windowReserveTokens"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-first"
						label={t("firstCompactionRequestScale")}
						hint={t("firstCompactionRequestScaleHelp")}
						numeric
						text={textOf(
							["onlineContextCompact", "firstCompactionRequestScale"],
							draft.onlineContextCompact.firstCompactionRequestScale,
						)}
						invalid={invalidNumeric(["onlineContextCompact", "firstCompactionRequestScale"])}
						overridden={overridden(["onlineContextCompact", "firstCompactionRequestScale"])}
						onEdit={(text) => editText(["onlineContextCompact", "firstCompactionRequestScale"], text)}
						onReset={() => resetPath(["onlineContextCompact", "firstCompactionRequestScale"])}
					/>
					<ValueRow
						{...common}
						id="sol-occ-margin"
						label={t("subsequentCompactionMargin")}
						hint={t("subsequentCompactionMarginHelp")}
						numeric
						text={textOf(
							["onlineContextCompact", "subsequentCompactionMargin"],
							draft.onlineContextCompact.subsequentCompactionMargin,
						)}
						invalid={invalidNumeric(["onlineContextCompact", "subsequentCompactionMargin"])}
						overridden={overridden(["onlineContextCompact", "subsequentCompactionMargin"])}
						onEdit={(text) => editText(["onlineContextCompact", "subsequentCompactionMargin"], text)}
						onReset={() => resetPath(["onlineContextCompact", "subsequentCompactionMargin"])}
					/>

					<div className={styles.footer}>
						{failed || error ? (
							<p className={styles.failed} role="status">
								{error ?? t("saveFailed")}
							</p>
						) : null}
						<button type="button" className={styles.discard} disabled={discardDisabled} onClick={onDiscard}>
							{t("discard")}
						</button>
						<button type="button" className={styles.save} disabled={saveDisabled} onClick={() => void onSave()}>
							{t(saving ? "saving" : "save")}
						</button>
					</div>
				</div>
			) : null}
		</li>
	);
}

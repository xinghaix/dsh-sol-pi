declare module "@deepseek-ai/dsh-client-ui-primitives" {
	import type { CSSProperties, ReactNode } from "react";

	export type TagTone = "neutral" | "brand" | "success" | "warn" | "error";

	export function Tag(props: {
		tone?: TagTone;
		className?: string;
		style?: CSSProperties;
		children?: ReactNode;
	}): ReactNode;

	export function Switch(props: {
		checked: boolean;
		label: string;
		disabled?: boolean;
		onChange: (checked: boolean) => void;
		className?: string;
	}): ReactNode;

	export function IconChevronDownOutline14(props: {
		className?: string;
		style?: CSSProperties;
	}): ReactNode;
}

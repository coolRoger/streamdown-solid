import type { JSX } from "solid-js";
import { createSignal, onCleanup, splitProps, useContext } from "solid-js";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { useCodeBlockContext } from "./context";

export type CodeBlockCopyButtonProps =
    JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
        onCopy?: () => void;
        onError?: (error: Error) => void;
        timeout?: number;
        class?: string;
    };

export const CodeBlockCopyButton = (
    props: CodeBlockCopyButtonProps & { code?: string },
) => {
    const [localProps, restProps] = splitProps(props, [
        "onCopy",
        "onError",
        "timeout",
        "children",
        "class",
        "code",
    ]);
    const cn = useCn();
    const [isCopied, setIsCopied] = createSignal(false);
    let timeoutRef = 0;
    const { code: contextCode } = useCodeBlockContext();
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();
    const code = localProps.code ?? contextCode;

    const copyToClipboard = async () => {
        if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
            localProps.onError?.(new Error("Clipboard API not available"));
            return;
        }

        try {
            if (!isCopied()) {
                await navigator.clipboard.writeText(code);
                setIsCopied(true);
                localProps.onCopy?.();
                timeoutRef = window.setTimeout(
                    () => setIsCopied(false),
                    localProps.timeout ?? 2000,
                );
            }
        } catch (error) {
            localProps.onError?.(error as Error);
        }
    };

    onCleanup(() => {
        window.clearTimeout(timeoutRef);
    });

    const icons = useIcons();

    return (
        <button
            class={cn("sd-icon-button", localProps.class)}
            data-streamdown="code-block-copy-button"
            disabled={isAnimating}
            onClick={copyToClipboard}
            title={t.copyCode}
            type="button"
            {...restProps}
        >
            {localProps.children ??
                (isCopied() ? (
                    <icons.CheckIcon size={14} />
                ) : (
                    <icons.CopyIcon size={14} />
                ))}
        </button>
    );
};

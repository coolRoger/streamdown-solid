import { createSignal, onCleanup, useContext } from "solid-js";
import type { JSX } from "solid-js";
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
        className?: string;
    };

export const CodeBlockCopyButton = ({
    onCopy,
    onError,
    timeout = 2000,
    children,
    className,
    code: propCode,
    ...props
}: CodeBlockCopyButtonProps & { code?: string }) => {
    const cn = useCn();
    const [isCopied, setIsCopied] = createSignal(false);
    let timeoutRef = 0;
    const { code: contextCode } = useCodeBlockContext();
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();
    const code = propCode ?? contextCode;

    const copyToClipboard = async () => {
        if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
            onError?.(new Error("Clipboard API not available"));
            return;
        }

        try {
            if (!isCopied()) {
                await navigator.clipboard.writeText(code);
                setIsCopied(true);
                onCopy?.();
                timeoutRef = window.setTimeout(
                    () => setIsCopied(false),
                    timeout,
                );
            }
        } catch (error) {
            onError?.(error as Error);
        }
    };

    onCleanup(() => {
        window.clearTimeout(timeoutRef);
    });

    const icons = useIcons();

    return (
        <button
            class={cn("sd-icon-button", className)}
            data-streamdown="code-block-copy-button"
            disabled={isAnimating}
            onClick={copyToClipboard}
            title={t.copyCode}
            type="button"
            {...props}
        >
            {children ??
                (isCopied() ? (
                    <icons.CheckIcon size={14} />
                ) : (
                    <icons.CopyIcon size={14} />
                ))}
        </button>
    );
};

import { createEffect, createSignal, onCleanup, splitProps } from "solid-js";
import { useIcons } from "./icon-context";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";
import "./streamdown-ui.css";
import { useTranslations } from "./translations-context";

interface LinkSafetyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    url: string;
}

export const LinkSafetyModal = (props: LinkSafetyModalProps) => {
    const [localProps] = splitProps(props, [
        "url",
        "isOpen",
        "onClose",
        "onConfirm",
    ]);
    const { CheckIcon, CopyIcon, ExternalLinkIcon, XIcon } = useIcons();
    const [copied, setCopied] = createSignal(false);
    const t = useTranslations();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(localProps.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available
        }
    };

    const handleConfirm = () => {
        localProps.onConfirm();
        localProps.onClose();
    };

    createEffect(() => {
        if (localProps.isOpen) {
            if (typeof document === "undefined") {
                return;
            }
            lockBodyScroll();

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    localProps.onClose();
                }
            };

            document.addEventListener("keydown", handleEsc);
            onCleanup(() => {
                document.removeEventListener("keydown", handleEsc);
                unlockBodyScroll();
            });
        }
    });

    if (!localProps.isOpen) {
        return null;
    }

    return (
        // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay"
        <div
            class="sd-link-modal-backdrop"
            data-streamdown="link-safety-modal"
            onClick={localProps.onClose}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    localProps.onClose();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div
                class="sd-link-modal-panel"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
            >
                <button
                    class="sd-link-modal-close"
                    onClick={localProps.onClose}
                    title={t.close}
                    type="button"
                >
                    <XIcon size={16} />
                </button>

                <div class="sd-link-modal-header">
                    <div class="sd-link-modal-title">
                        <ExternalLinkIcon size={20} />
                        <span>{t.openExternalLink}</span>
                    </div>
                    <p class="sd-link-modal-description">
                        {t.externalLinkWarning}
                    </p>
                </div>

                <div
                    class="sd-link-modal-url"
                    data-scrollable={localProps.url.length > 100}
                >
                    {localProps.url}
                </div>

                <div class="sd-link-modal-actions">
                    <button
                        class="sd-link-modal-copy"
                        onClick={handleCopy}
                        type="button"
                    >
                        {copied() ? (
                            <>
                                <CheckIcon size={14} />
                                <span>{t.copied}</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon size={14} />
                                <span>{t.copyLink}</span>
                            </>
                        )}
                    </button>
                    <button
                        class="sd-link-modal-confirm"
                        onClick={handleConfirm}
                        type="button"
                    >
                        <ExternalLinkIcon size={14} />
                        <span>{t.openLink}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

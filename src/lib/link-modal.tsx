import { createEffect, createSignal, onCleanup } from "solid-js";
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

export const LinkSafetyModal = ({
    url,
    isOpen,
    onClose,
    onConfirm,
}: LinkSafetyModalProps) => {
    const { CheckIcon, CopyIcon, ExternalLinkIcon, XIcon } = useIcons();
    const [copied, setCopied] = createSignal(false);
    const t = useTranslations();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    createEffect(() => {
        if (isOpen) {
            lockBodyScroll();

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    onClose();
                }
            };

            document.addEventListener("keydown", handleEsc);
            onCleanup(() => {
                document.removeEventListener("keydown", handleEsc);
                unlockBodyScroll();
            });
        }
    });

    if (!isOpen) {
        return null;
    }

    return (
        // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay"
        <div
            class="sd-link-modal-backdrop"
            data-streamdown="link-safety-modal"
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    onClose();
                }
            }}
            role="button"
            tabIndex={0}
        >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
            <div
                class="sd-link-modal-panel"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
            >
                <button
                    class="sd-link-modal-close"
                    onClick={onClose}
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
                    data-scrollable={url.length > 100}
                >
                    {url}
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

import type { JSX } from "solid-js";
import {
    createEffect,
    createSignal,
    onCleanup,
    splitProps,
    useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import "../streamdown-ui.css";
import { useTranslations } from "../translations-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";

interface TableFullscreenButtonProps {
    children: JSX.Element;
    class?: string;
    showCopy?: boolean;
    showDownload?: boolean;
}

export const TableFullscreenButton = (props: TableFullscreenButtonProps) => {
    const [localProps] = splitProps(props, [
        "children",
        "class",
        "showCopy",
        "showDownload",
    ]);
    const { Maximize2Icon, XIcon } = useIcons();
    const cn = useCn();
    const [isFullscreen, setIsFullscreen] = createSignal(false);
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();
    const getPortalMount = () =>
        typeof document === "undefined" ? undefined : document.body;

    const handleOpen = () => {
        setIsFullscreen(true);
    };

    const handleClose = () => {
        setIsFullscreen(false);
    };

    createEffect(() => {
        if (isFullscreen()) {
            if (typeof document === "undefined") {
                return;
            }
            lockBodyScroll();

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setIsFullscreen(false);
                }
            };

            document.addEventListener("keydown", handleEsc);
            onCleanup(() => {
                document.removeEventListener("keydown", handleEsc);
                unlockBodyScroll();
            });
        }
    });

    return (
        <>
            <button
                class={cn("sd-icon-button", localProps.class)}
                disabled={isAnimating}
                onClick={handleOpen}
                title={t.viewFullscreen}
                type="button"
            >
                <Maximize2Icon size={14} />
            </button>

            {isFullscreen() ? (
                <Portal mount={getPortalMount()}>
                    <div
                        aria-label={t.viewFullscreen}
                        aria-modal="true"
                        class={cn("sd-table-fullscreen-overlay")}
                        data-streamdown="table-fullscreen"
                        onClick={handleClose}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                handleClose();
                            }
                        }}
                        role="dialog"
                    >
                        <div
                            class={cn("sd-table-fullscreen-content")}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                        >
                            <div class={cn("sd-table-fullscreen-toolbar")}>
                                {localProps.showCopy !== false ? (
                                    <TableCopyDropdown />
                                ) : null}
                                {localProps.showDownload !== false ? (
                                    <TableDownloadDropdown />
                                ) : null}
                                <button
                                    class={cn("sd-table-icon-button")}
                                    onClick={handleClose}
                                    title={t.exitFullscreen}
                                    type="button"
                                >
                                    <XIcon size={20} />
                                </button>
                            </div>
                            <div class={cn("sd-table-fullscreen-scroll")}>
                                <table
                                    class={cn("sd-table-fullscreen-element")}
                                    data-streamdown="table"
                                >
                                    {localProps.children}
                                </table>
                            </div>
                        </div>
                    </div>
                </Portal>
            ) : null}
        </>
    );
};

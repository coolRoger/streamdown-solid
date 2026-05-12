import type { MermaidConfig } from "mermaid";
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
import { Mermaid } from ".";

type MermaidFullscreenButtonProps =
    JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
        class?: string;
        chart: string;
        config?: MermaidConfig;
        onFullscreen?: () => void;
        onExit?: () => void;
    };

export const MermaidFullscreenButton = (
    props: MermaidFullscreenButtonProps,
) => {
    const [localProps, restProps] = splitProps(props, [
        "chart",
        "config",
        "onFullscreen",
        "onExit",
        "class",
    ]);
    const { Maximize2Icon, XIcon } = useIcons();
    const cn = useCn();
    const [isFullscreen, setIsFullscreen] = createSignal(false);
    const { isAnimating, controls: controlsConfig } =
        useContext(StreamdownContext);
    const t = useTranslations();
    const getPortalMount = () =>
        typeof document === "undefined" ? undefined : document.body;
    const showPanZoomControls = (() => {
        if (typeof controlsConfig === "boolean") {
            return controlsConfig;
        }
        const mermaidCtl = controlsConfig.mermaid;
        if (mermaidCtl === false) {
            return false;
        }
        if (mermaidCtl === true || mermaidCtl === undefined) {
            return true;
        }
        return mermaidCtl.panZoom !== false;
    })();

    const handleToggle = () => {
        setIsFullscreen(!isFullscreen());
    };

    // Manage scroll lock and keyboard events
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

    // Handle callbacks separately to avoid scroll lock flickering
    createEffect(() => {
        if (isFullscreen()) {
            localProps.onFullscreen?.();
        } else if (localProps.onExit) {
            localProps.onExit();
        }
    });

    return (
        <>
            <button
                class={cn("sd-icon-button", localProps.class)}
                disabled={isAnimating}
                onClick={handleToggle}
                title={t.viewFullscreen}
                type="button"
                {...restProps}
            >
                <Maximize2Icon size={14} />
            </button>

            {isFullscreen() ? (
                <Portal mount={getPortalMount()}>
                    {/* biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay, not a button" */}
                    <div
                        class={cn("sd-mermaid-fullscreen-overlay")}
                        onClick={handleToggle}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                handleToggle();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <button
                            class={cn("sd-mermaid-fullscreen-close")}
                            onClick={handleToggle}
                            title={t.exitFullscreen}
                            type="button"
                        >
                            <XIcon size={20} />
                        </button>
                        <div
                            class={cn("sd-mermaid-fullscreen-content")}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                        >
                            <Mermaid
                                chart={localProps.chart}
                                class={cn("sd-mermaid-fullscreen-canvas")}
                                config={localProps.config}
                                fullscreen={true}
                                showControls={showPanZoomControls}
                            />
                        </div>
                    </div>
                </Portal>
            ) : null}
        </>
    );
};

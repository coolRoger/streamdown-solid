import type { JSX } from "solid-js";
import {
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    splitProps,
} from "solid-js";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

interface PanZoomProps {
    children: JSX.Element;
    class?: string;
    fullscreen?: boolean;
    initialZoom?: number;
    maxZoom?: number;
    minZoom?: number;
    showControls?: boolean;
    zoomStep?: number;
}

export const PanZoom = (props: PanZoomProps) => {
    const [localProps] = splitProps(props, [
        "children",
        "class",
        "minZoom",
        "maxZoom",
        "zoomStep",
        "showControls",
        "initialZoom",
        "fullscreen",
    ]);
    const { RotateCcwIcon, ZoomInIcon, ZoomOutIcon } = useIcons();
    const cn = useCn();
    let containerRef: HTMLDivElement | undefined;
    let contentRef: HTMLDivElement | undefined;
    const [zoom, setZoom] = createSignal(localProps.initialZoom ?? 1);
    const [pan, setPan] = createSignal({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = createSignal(false);
    const [panStart, setPanStart] = createSignal({ x: 0, y: 0 });
    const [panStartPosition, setPanStartPosition] = createSignal({
        x: 0,
        y: 0,
    });

    const handleZoom = (delta: number) => {
        setZoom((prevZoom) => {
            const newZoom = Math.max(
                localProps.minZoom ?? 0.5,
                Math.min(localProps.maxZoom ?? 3, prevZoom + delta),
            );
            return newZoom;
        });
    };

    const handleZoomIn = () => {
        handleZoom(localProps.zoomStep ?? 0.1);
    };

    const handleZoomOut = () => {
        handleZoom(-(localProps.zoomStep ?? 0.1));
    };

    const handleReset = () => {
        setZoom(localProps.initialZoom ?? 1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const step = localProps.zoomStep ?? 0.1;
        const delta = e.deltaY > 0 ? -step : step;
        handleZoom(delta);
    };

    const handlePointerDown: JSX.EventHandlerUnion<
        HTMLDivElement,
        PointerEvent
    > = (e) => {
        // Only handle primary pointer (left mouse button, first touch, etc.)
        if (e.button !== 0 || e.isPrimary === false) {
            return;
        }
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setPanStartPosition(pan());
        // Capture the pointer to track it even outside the element
        const target = e.currentTarget;
        if (target instanceof HTMLElement) {
            target.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        /* v8 ignore next */
        if (!isPanning()) {
            return;
        }
        e.preventDefault();
        const deltaX = e.clientX - panStart().x;
        const deltaY = e.clientY - panStart().y;
        setPan({
            x: panStartPosition().x + deltaX,
            y: panStartPosition().y + deltaY,
        });
    };

    const handlePointerUp = (e: PointerEvent) => {
        setIsPanning(false);
        // Release pointer capture
        const target = e.currentTarget;
        if (target instanceof HTMLElement) {
            target.releasePointerCapture(e.pointerId);
        }
    };

    onMount(() => {
        const container = containerRef;
        /* v8 ignore next */
        if (!container) {
            return;
        }

        container.addEventListener("wheel", handleWheel, { passive: false });

        onCleanup(() => {
            container.removeEventListener("wheel", handleWheel);
        });
    });

    const syncPanListeners = () => {
        if (typeof document === "undefined") {
            return;
        }
        const content = contentRef;
        if (!content) {
            return;
        }
        if (isPanning()) {
            document.body.style.userSelect = "none";
            content.addEventListener("pointermove", handlePointerMove, {
                passive: false,
            });
            content.addEventListener("pointerup", handlePointerUp);
            content.addEventListener("pointercancel", handlePointerUp);
            return;
        }
        document.body.style.userSelect = "";
        content.removeEventListener("pointermove", handlePointerMove);
        content.removeEventListener("pointerup", handlePointerUp);
        content.removeEventListener("pointercancel", handlePointerUp);
    };

    createEffect(() => {
        isPanning();
        syncPanListeners();
    });

    onMount(() => {
        onCleanup(() => {
            syncPanListeners();
            if (typeof document !== "undefined") {
                document.body.style.userSelect = "";
            }
        });
    });

    return (
        <div
            class={cn(
                "sd-panzoom-root",
                localProps.fullscreen
                    ? "sd-panzoom-root--fullscreen"
                    : "sd-panzoom-root--normal",
                localProps.class,
            )}
            ref={containerRef}
            style={{ cursor: isPanning() ? "grabbing" : "grab" }}
        >
            {(localProps.showControls ?? true) ? (
                <div
                    class={cn(
                        "sd-panzoom-controls",
                        localProps.fullscreen
                            ? "sd-panzoom-controls--fullscreen"
                            : "sd-panzoom-controls--normal",
                    )}
                >
                    <button
                        class={cn("sd-panzoom-button")}
                        disabled={zoom() >= (localProps.maxZoom ?? 3)}
                        onClick={handleZoomIn}
                        title="Zoom in"
                        type="button"
                    >
                        <ZoomInIcon size={16} />
                    </button>
                    <button
                        class={cn("sd-panzoom-button")}
                        disabled={zoom() <= (localProps.minZoom ?? 0.5)}
                        onClick={handleZoomOut}
                        title="Zoom out"
                        type="button"
                    >
                        <ZoomOutIcon size={16} />
                    </button>
                    <button
                        class={cn("sd-panzoom-button")}
                        onClick={handleReset}
                        title="Reset zoom and pan"
                        type="button"
                    >
                        <RotateCcwIcon size={16} />
                    </button>
                </div>
            ) : null}
            <div
                class={cn(
                    "sd-panzoom-content",
                    localProps.fullscreen
                        ? "sd-panzoom-content--fullscreen"
                        : "sd-panzoom-content--normal",
                )}
                onPointerDown={handlePointerDown}
                ref={contentRef}
                role="application"
                style={{
                    transform: `translate(${pan().x}px, ${pan().y}px) scale(${zoom()})`,
                    "transform-origin": "center center",
                    "touch-action": "none",
                    "will-change": "transform",
                }}
            >
                {localProps.children}
            </div>
        </div>
    );
};

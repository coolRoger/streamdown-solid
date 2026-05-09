import type { MermaidConfig } from "mermaid";
import { createEffect, createSignal, useContext } from "solid-js";
import { useDeferredRender } from "../../hooks/use-deferred-render";
import { StreamdownContext } from "../../index";
import { useMermaidPlugin } from "../plugin-context";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";
import { PanZoom } from "./pan-zoom";

interface MermaidProps {
    chart: string;
    className?: string;
    config?: MermaidConfig;
    fullscreen?: boolean;
    showControls?: boolean;
}

export const Mermaid = ({
    chart,
    className,
    config,
    fullscreen = false,
    showControls = true,
}: MermaidProps) => {
    const cn = useCn();
    const [error, setError] = createSignal<string | null>(null);
    const [isLoading, setIsLoading] = createSignal(false);
    const [svgContent, setSvgContent] = createSignal("");
    const [lastValidSvg, setLastValidSvg] = createSignal("");
    const [retryCount, setRetryCount] = createSignal(0);
    const { mermaid: mermaidContext } = useContext(StreamdownContext);
    const mermaidPlugin = useMermaidPlugin();
    const ErrorComponent = mermaidContext?.errorComponent;

    // Use deferred render hook for optimal performance
    const { shouldRender, containerRef } = useDeferredRender({
        immediate: fullscreen,
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: "Required for Mermaid"
    createEffect(() => {
        retryCount();
        // Only render when shouldRender is true
        if (!shouldRender()) {
            return;
        }

        // If no mermaid plugin, show error
        if (!mermaidPlugin) {
            setError(
                "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering.",
            );
            return;
        }

        const renderChart = async () => {
            try {
                setError(null);
                setIsLoading(true);

                // Get mermaid instance from plugin
                const mermaid = mermaidPlugin.getMermaid(config);

                // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
                const chartHash = chart.split("").reduce((acc, char) => {
                    // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
                    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
                }, 0);
                const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                const { svg } = await mermaid.render(uniqueId, chart);

                // Update both current and last valid SVG
                setSvgContent(svg);
                setLastValidSvg(svg);
            } catch (err) {
                // Silently fail and keep the last valid SVG
                // Don't update svgContent here - just keep what we have

                // Only set error if we don't have any valid SVG
                if (!(lastValidSvg() || svgContent())) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to render Mermaid chart";
                    setError(errorMessage);
                }
            } finally {
                setIsLoading(false);
            }
        };

        renderChart();
    });

    // Show placeholder when not scheduled to render
    if (!(shouldRender() || svgContent() || lastValidSvg())) {
        return (
            <div
                class={cn("sd-mermaid-placeholder", className)}
                ref={containerRef}
            />
        );
    }

    if (isLoading() && !svgContent() && !lastValidSvg()) {
        return (
            <div
                class={cn("sd-mermaid-loading-wrap", className)}
                ref={containerRef}
            >
                <div class={cn("sd-mermaid-loading")}>
                    <div class={cn("sd-mermaid-loading-spinner")} />
                    <span class={cn("sd-mermaid-loading-text")}>
                        Loading diagram...
                    </span>
                </div>
            </div>
        );
    }

    // Only show error if we have no valid SVG to display
    if (error() && !svgContent() && !lastValidSvg()) {
        const retry = () => setRetryCount((count) => count + 1);

        // Use custom error component if provided
        if (ErrorComponent) {
            return (
                <div ref={containerRef}>
                    <ErrorComponent
                        chart={chart}
                        error={error() ?? ""}
                        retry={retry}
                    />
                </div>
            );
        }

        // Default error display
        return (
            <div
                class={cn("sd-mermaid-error", className)}
                ref={containerRef}
            >
                <p class={cn("sd-mermaid-error-text")}>
                    Mermaid Error: {error()}
                </p>
                <details class={cn("sd-mermaid-error-details")}>
                    <summary class={cn("sd-mermaid-error-summary")}>
                        Show Code
                    </summary>
                    <pre class={cn("sd-mermaid-error-code")}>{chart}</pre>
                </details>
            </div>
        );
    }

    // Always render the SVG if we have content (either current or last valid)
    const displaySvg = svgContent() || lastValidSvg();

    return (
        <div
            class={cn("sd-mermaid-root", className)}
            data-streamdown="mermaid"
            ref={containerRef}
        >
            <PanZoom
                class={cn(
                    fullscreen
                        ? "sd-mermaid-panzoom sd-mermaid-panzoom--fullscreen"
                        : "sd-mermaid-panzoom",
                    className,
                )}
                fullscreen={fullscreen}
                maxZoom={3}
                minZoom={0.5}
                showControls={showControls}
                zoomStep={0.1}
            >
                <div
                    aria-label="Mermaid chart"
                    class={cn(
                        "sd-mermaid-svg-wrap",
                        fullscreen ? "sd-mermaid-svg-wrap--fullscreen" : null,
                    )}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for Mermaid"
                    dangerouslySetInnerHTML={{ __html: displaySvg }}
                    role="img"
                />
            </PanZoom>
        </div>
    );
};

import type { MermaidConfig } from "mermaid";
import { createSignal, onCleanup, onMount, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useMermaidPlugin } from "../plugin-context";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";
import { useTranslations } from "../translations-context";
import { save } from "../utils";
import { svgToPngBlob } from "./utils";

interface MermaidDownloadDropdownProps {
    chart: string;
    children?: JSX.Element;
    className?: string;
    config?: MermaidConfig;
    onDownload?: (format: "mmd" | "png" | "svg") => void;
    onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = ({
    chart,
    children,
    className,
    onDownload,
    config,
    onError,
}: MermaidDownloadDropdownProps) => {
    const cn = useCn();
    const [isOpen, setIsOpen] = createSignal(false);
    let dropdownRef: HTMLDivElement | undefined;
    const { isAnimating } = useContext(StreamdownContext);
    const icons = useIcons();
    const mermaidPlugin = useMermaidPlugin();
    const t = useTranslations();

    const downloadMermaid = async (format: "mmd" | "png" | "svg") => {
        try {
            if (format === "mmd") {
                // Download as Mermaid source code
                const filename = "diagram.mmd";
                const mimeType = "text/plain";
                save(filename, chart, mimeType);
                setIsOpen(false);
                onDownload?.(format);
                return;
            }

            if (!mermaidPlugin) {
                onError?.(new Error("Mermaid plugin not available"));
                return;
            }

            const mermaid = mermaidPlugin.getMermaid(config);

            // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
            const chartHash = chart.split("").reduce((acc, char) => {
                // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
                return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
            }, 0);
            const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const { svg } = await mermaid.render(uniqueId, chart);
            // For SVG and PNG, we need to extract the rendered SVG

            if (!svg) {
                onError?.(
                    new Error(
                        "SVG not found. Please wait for the diagram to render.",
                    ),
                );
                return;
            }

            if (format === "svg") {
                const filename = "diagram.svg";
                const mimeType = "image/svg+xml";
                save(filename, svg, mimeType);
                setIsOpen(false);
                onDownload?.(format);
                return;
            }

            if (format === "png") {
                const blob = await svgToPngBlob(svg);
                save("diagram.png", blob, "image/png");
                onDownload?.(format);
                setIsOpen(false);
                return;
            }
        } catch (error) {
            onError?.(error as Error);
        }
    };

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const path = event.composedPath();
            if (dropdownRef && !path.includes(dropdownRef)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    });

    return (
        <div
            class={cn("sd-dropdown-root")}
            ref={dropdownRef}
        >
            <button
                class={cn("sd-icon-button", className)}
                disabled={isAnimating}
                onClick={() => setIsOpen(!isOpen())}
                title={t.downloadDiagram}
                type="button"
            >
                {children ?? <icons.DownloadIcon size={14} />}
            </button>
            {isOpen() ? (
                <div class={cn("sd-dropdown-menu")}>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => downloadMermaid("svg")}
                        title={t.downloadDiagramAsSvg}
                        type="button"
                    >
                        {t.mermaidFormatSvg}
                    </button>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => downloadMermaid("png")}
                        title={t.downloadDiagramAsPng}
                        type="button"
                    >
                        {t.mermaidFormatPng}
                    </button>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => downloadMermaid("mmd")}
                        title={t.downloadDiagramAsMmd}
                        type="button"
                    >
                        {t.mermaidFormatMmd}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

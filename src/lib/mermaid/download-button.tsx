import type { MermaidConfig } from "mermaid";
import type { JSX } from "solid-js";
import {
    createSignal,
    onCleanup,
    onMount,
    splitProps,
    useContext,
} from "solid-js";
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
    class?: string;
    config?: MermaidConfig;
    onDownload?: (format: "mmd" | "png" | "svg") => void;
    onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = (
    props: MermaidDownloadDropdownProps,
) => {
    const [localProps] = splitProps(props, [
        "chart",
        "children",
        "class",
        "onDownload",
        "config",
        "onError",
    ]);
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
                save(filename, localProps.chart, mimeType);
                setIsOpen(false);
                localProps.onDownload?.(format);
                return;
            }

            if (!mermaidPlugin) {
                localProps.onError?.(new Error("Mermaid plugin not available"));
                return;
            }

            const mermaid = mermaidPlugin.getMermaid(localProps.config);

            // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
            const chartHash = localProps.chart.split("").reduce((acc, char) => {
                return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
            }, 0);
            const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const { svg } = await mermaid.render(uniqueId, localProps.chart);
            // For SVG and PNG, we need to extract the rendered SVG

            if (!svg) {
                localProps.onError?.(
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
                localProps.onDownload?.(format);
                return;
            }

            if (format === "png") {
                const blob = await svgToPngBlob(svg);
                save("diagram.png", blob, "image/png");
                localProps.onDownload?.(format);
                setIsOpen(false);
                return;
            }
        } catch (error) {
            localProps.onError?.(error as Error);
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
                class={cn("sd-icon-button", localProps.class)}
                disabled={isAnimating}
                onClick={() => setIsOpen(!isOpen())}
                title={t.downloadDiagram}
                type="button"
            >
                {localProps.children ?? <icons.DownloadIcon size={14} />}
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

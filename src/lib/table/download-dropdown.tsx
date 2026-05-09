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
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";
import { useTranslations } from "../translations-context";
import { save } from "../utils";
import {
    extractTableDataFromElement,
    tableDataToCSV,
    tableDataToMarkdown,
} from "./utils";

export interface TableDownloadButtonProps {
    children?: JSX.Element;
    class?: string;
    filename?: string;
    format?: "csv" | "markdown";
    onDownload?: () => void;
    onError?: (error: Error) => void;
}

export const TableDownloadButton = (props: TableDownloadButtonProps) => {
    const [localProps] = splitProps(props, [
        "children",
        "class",
        "onDownload",
        "onError",
        "format",
        "filename",
    ]);
    const cn = useCn();
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();
    const icons = useIcons();

    const downloadTableData: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (
        event,
    ) => {
        try {
            // Find the closest table element
            const button = event.currentTarget;
            const tableWrapper = button.closest(
                '[data-streamdown="table-wrapper"]',
            );
            const tableElement = tableWrapper?.querySelector(
                "table",
            ) as HTMLTableElement;

            if (!tableElement) {
                localProps.onError?.(new Error("Table not found"));
                return;
            }

            const tableData = extractTableDataFromElement(tableElement);
            let content = "";
            let mimeType = "";
            let extension = "";

            switch (localProps.format ?? "csv") {
                case "csv":
                    content = tableDataToCSV(tableData);
                    mimeType = "text/csv";
                    extension = "csv";
                    break;
                case "markdown":
                    content = tableDataToMarkdown(tableData);
                    mimeType = "text/markdown";
                    extension = "md";
                    break;
                default:
                    content = tableDataToCSV(tableData);
                    mimeType = "text/csv";
                    extension = "csv";
            }

            save(
                `${localProps.filename || "table"}.${extension}`,
                content,
                mimeType,
            );

            localProps.onDownload?.();
        } catch (error) {
            localProps.onError?.(error as Error);
        }
    };

    return (
        <button
            class={cn("sd-icon-button", localProps.class)}
            disabled={isAnimating}
            onClick={downloadTableData}
            title={
                (localProps.format ?? "csv") === "csv"
                    ? t.downloadTableAsCsv
                    : t.downloadTableAsMarkdown
            }
            type="button"
        >
            {localProps.children ?? <icons.DownloadIcon size={14} />}
        </button>
    );
};

export interface TableDownloadDropdownProps {
    children?: JSX.Element;
    class?: string;
    onDownload?: (format: "csv" | "markdown") => void;
    onError?: (error: Error) => void;
}

export const TableDownloadDropdown = (props: TableDownloadDropdownProps) => {
    const [localProps] = splitProps(props, [
        "children",
        "class",
        "onDownload",
        "onError",
    ]);
    const cn = useCn();
    const [isOpen, setIsOpen] = createSignal(false);
    let dropdownRef: HTMLDivElement | undefined;
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();
    const icons = useIcons();

    const downloadTableData = (format: "csv" | "markdown") => {
        try {
            const tableWrapper = dropdownRef?.closest(
                '[data-streamdown="table-wrapper"]',
            );
            const tableElement = tableWrapper?.querySelector(
                "table",
            ) as HTMLTableElement;

            if (!tableElement) {
                localProps.onError?.(new Error("Table not found"));
                return;
            }

            const tableData = extractTableDataFromElement(tableElement);
            const content =
                format === "csv"
                    ? tableDataToCSV(tableData)
                    : tableDataToMarkdown(tableData);
            const extension = format === "csv" ? "csv" : "md";
            const filename = `table.${extension}`;
            const mimeType = format === "csv" ? "text/csv" : "text/markdown";

            save(filename, content, mimeType);
            setIsOpen(false);
            localProps.onDownload?.(format);
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
                title={t.downloadTable}
                type="button"
            >
                {localProps.children ?? <icons.DownloadIcon size={14} />}
            </button>
            {isOpen() ? (
                <div class={cn("sd-dropdown-menu")}>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => downloadTableData("csv")}
                        title={t.downloadTableAsCsv}
                        type="button"
                    >
                        {t.tableFormatCsv}
                    </button>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => downloadTableData("markdown")}
                        title={t.downloadTableAsMarkdown}
                        type="button"
                    >
                        {t.tableFormatMarkdown}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

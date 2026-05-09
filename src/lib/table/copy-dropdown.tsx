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
import {
    extractTableDataFromElement,
    tableDataToCSV,
    tableDataToMarkdown,
    tableDataToTSV,
} from "./utils";

export interface TableCopyDropdownProps {
    children?: JSX.Element;
    class?: string;
    onCopy?: (format: "csv" | "tsv" | "md") => void;
    onError?: (error: Error) => void;
    timeout?: number;
}

export const TableCopyDropdown = (props: TableCopyDropdownProps) => {
    const [localProps] = splitProps(props, [
        "children",
        "class",
        "onCopy",
        "onError",
        "timeout",
    ]);
    const cn = useCn();
    const [isOpen, setIsOpen] = createSignal(false);
    const [isCopied, setIsCopied] = createSignal(false);
    let dropdownRef: HTMLDivElement | undefined;
    let timeoutRef = 0;
    const { isAnimating } = useContext(StreamdownContext);
    const t = useTranslations();

    const copyTableData = async (format: "csv" | "tsv" | "md") => {
        if (typeof window === "undefined" || !navigator?.clipboard?.write) {
            localProps.onError?.(new Error("Clipboard API not available"));
            return;
        }

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

            const formatters = {
                csv: tableDataToCSV,
                tsv: tableDataToTSV,
                md: tableDataToMarkdown,
            };
            const formatter = formatters[format] || tableDataToMarkdown;
            const content = formatter(tableData);

            const clipboardItemData = new ClipboardItem({
                "text/plain": new Blob([content], { type: "text/plain" }),
                "text/html": new Blob([tableElement.outerHTML], {
                    type: "text/html",
                }),
            });

            await navigator.clipboard.write([clipboardItemData]);
            setIsCopied(true);
            setIsOpen(false);
            localProps.onCopy?.(format);
            timeoutRef = window.setTimeout(
                () => setIsCopied(false),
                localProps.timeout ?? 2000,
            );
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
            window.clearTimeout(timeoutRef);
        });
    });

    const icons = useIcons();

    return (
        <div
            class={cn("sd-dropdown-root")}
            ref={dropdownRef}
        >
            <button
                class={cn("sd-icon-button", localProps.class)}
                disabled={isAnimating}
                onClick={() => setIsOpen(!isOpen())}
                title={t.copyTable}
                type="button"
            >
                {localProps.children ??
                    (isCopied() ? (
                        <icons.CheckIcon
                            height={14}
                            width={14}
                        />
                    ) : (
                        <icons.CopyIcon
                            height={14}
                            width={14}
                        />
                    ))}
            </button>
            {isOpen() ? (
                <div class={cn("sd-dropdown-menu")}>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => copyTableData("md")}
                        title={t.copyTableAsMarkdown}
                        type="button"
                    >
                        {t.tableFormatMarkdown}
                    </button>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => copyTableData("csv")}
                        title={t.copyTableAsCsv}
                        type="button"
                    >
                        {t.tableFormatCsv}
                    </button>
                    <button
                        class={cn("sd-dropdown-item")}
                        onClick={() => copyTableData("tsv")}
                        title={t.copyTableAsTsv}
                        type="button"
                    >
                        {t.tableFormatTsv}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

import type { JSX } from "solid-js";
import "../streamdown-ui.css";
import { useCn } from "../prefix-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

type TableProps = JSX.TableHTMLAttributes<HTMLTableElement> & {
    className?: string;
    showControls?: boolean;
    showCopy?: boolean;
    showDownload?: boolean;
    showFullscreen?: boolean;
};

export const Table = ({
    children,
    className,
    showControls,
    showCopy = true,
    showDownload = true,
    showFullscreen = true,
    ...props
}: TableProps) => {
    const cn = useCn();
    const hasCopy = showControls && showCopy;
    const hasDownload = showControls && showDownload;
    const hasFullscreen = showControls && showFullscreen;
    const hasAnyControl = hasCopy || hasDownload || hasFullscreen;

    return (
        <div
            class={cn("sd-table-wrapper")}
            data-streamdown="table-wrapper"
        >
            {hasAnyControl ? (
                <div class={cn("sd-table-toolbar")}>
                    {hasCopy ? <TableCopyDropdown /> : null}
                    {hasDownload ? <TableDownloadDropdown /> : null}
                    {hasFullscreen ? (
                        <TableFullscreenButton
                            showCopy={hasCopy}
                            showDownload={hasDownload}
                        >
                            {children}
                        </TableFullscreenButton>
                    ) : null}
                </div>
            ) : null}
            <div class={cn("sd-table-scroller")}>
                <table
                    class={cn("sd-table-element", className)}
                    data-streamdown="table"
                    {...props}
                >
                    {children}
                </table>
            </div>
        </div>
    );
};

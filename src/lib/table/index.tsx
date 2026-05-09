import { type JSX, splitProps } from "solid-js";
import "../streamdown-ui.css";
import { useCn } from "../prefix-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

type TableProps = JSX.HTMLAttributes<HTMLTableElement> & {
    class?: string;
    showControls?: boolean;
    showCopy?: boolean;
    showDownload?: boolean;
    showFullscreen?: boolean;
};

export const Table = (props: TableProps) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "showControls",
        "showCopy",
        "showDownload",
        "showFullscreen",
    ]);
    const cn = useCn();
    const hasCopy = localProps.showControls && localProps.showCopy !== false;
    const hasDownload =
        localProps.showControls && localProps.showDownload !== false;
    const hasFullscreen =
        localProps.showControls && localProps.showFullscreen !== false;
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
                            {localProps.children}
                        </TableFullscreenButton>
                    ) : null}
                </div>
            ) : null}
            <div class={cn("sd-table-scroller")}>
                <table
                    class={cn("sd-table-element", localProps.class)}
                    data-streamdown="table"
                    {...restProps}
                >
                    {localProps.children}
                </table>
            </div>
        </div>
    );
};

import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

export const CodeBlockSkeleton = () => {
    const { Loader2Icon } = useIcons();
    const cn = useCn();
    return (
        <div class={cn("sd-codeblock-skeleton")}>
            <div class={cn("sd-codeblock-skeleton-header")} />
            <div class={cn("sd-codeblock-skeleton-body")}>
                <Loader2Icon class={cn("sd-codeblock-skeleton-spinner")} />
            </div>
        </div>
    );
};

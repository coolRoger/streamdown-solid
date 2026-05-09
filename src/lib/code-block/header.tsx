import { splitProps } from "solid-js";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

interface CodeBlockHeaderProps {
    language: string;
}

export const CodeBlockHeader = (props: CodeBlockHeaderProps) => {
    const [localProps] = splitProps(props, ["language"]);
    const cn = useCn();
    return (
        <div
            class={cn("sd-codeblock-header")}
            data-language={localProps.language}
            data-streamdown="code-block-header"
        >
            <span class={cn("sd-codeblock-language")}>
                {localProps.language}
            </span>
        </div>
    );
};

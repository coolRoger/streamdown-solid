import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

interface CodeBlockHeaderProps {
    language: string;
}

export const CodeBlockHeader = ({ language }: CodeBlockHeaderProps) => {
    const cn = useCn();
    return (
        <div
            class={cn("sd-codeblock-header")}
            data-language={language}
            data-streamdown="code-block-header"
        >
            <span class={cn("sd-codeblock-language")}>{language}</span>
        </div>
    );
};

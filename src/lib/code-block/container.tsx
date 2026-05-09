import type { JSX } from "solid-js";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

type CodeBlockContainerProps = JSX.HTMLAttributes<HTMLDivElement> & {
    className?: string;
    language: string;
    /** Whether the code block is still being streamed (incomplete) */
    isIncomplete?: boolean;
};

export const CodeBlockContainer = ({
    className,
    language,
    style,
    isIncomplete,
    ...props
}: CodeBlockContainerProps) => {
    const cn = useCn();
    return (
        <div
            class={cn("sd-codeblock-container", className)}
            data-incomplete={isIncomplete || undefined}
            data-language={language}
            data-streamdown="code-block"
            style={{
                // Use content-visibility to skip rendering off-screen blocks
                // This can significantly improve performance for large documents
                contentVisibility: "auto",
                // Provide a hint for layout to prevent layout shifts
                containIntrinsicSize: "auto 200px",
                ...style,
            }}
            {...props}
        />
    );
};

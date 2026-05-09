import { type JSX, splitProps } from "solid-js";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

type CodeBlockContainerProps = JSX.HTMLAttributes<HTMLDivElement> & {
    class?: string;
    language: string;
    /** Whether the code block is still being streamed (incomplete) */
    isIncomplete?: boolean;
};

export const CodeBlockContainer = (props: CodeBlockContainerProps) => {
    const [localProps, restProps] = splitProps(props, [
        "class",
        "language",
        "isIncomplete",
    ]);
    const cn = useCn();
    return (
        <div
            class={cn("sd-codeblock-container", localProps.class)}
            data-incomplete={localProps.isIncomplete || undefined}
            data-language={localProps.language}
            data-streamdown="code-block"
            style={{
                // Use content-visibility to skip rendering off-screen blocks
                // This can significantly improve performance for large documents
                "content-visibility": "auto",
                // Provide a hint for layout to prevent layout shifts
                "contain-intrinsic-size": "auto 200px",
                ...(typeof restProps.style !== "string" ? restProps.style : {}),
            }}
            {...restProps}
        />
    );
};

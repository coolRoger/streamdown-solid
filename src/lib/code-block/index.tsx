import type { JSX } from "solid-js";
import { createMemo, lazy, Suspense, splitProps } from "solid-js";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";

const trimTrailingNewlines = (str: string): string => {
    let end = str.length;
    while (end > 0 && str[end - 1] === "\n") {
        end--;
    }
    return str.slice(0, end);
};

type CodeBlockProps = JSX.HTMLAttributes<HTMLDivElement> & {
    class?: string;
    code: string;
    language: string;
    /** Whether the code block is still being streamed (incomplete) */
    isIncomplete?: boolean;
    /** Custom starting line number for line numbering (default: 1) */
    startLine?: number;
    /** Show line numbers in code blocks. @default true */
    lineNumbers?: boolean;
};

const HighlightedCodeBlockBody = lazy(() =>
    import("./highlighted-body").then((mod) => ({
        default: mod.HighlightedCodeBlockBody,
    })),
);

export const CodeBlock = (props: CodeBlockProps) => {
    const [localProps, restProps] = splitProps(props, [
        "code",
        "language",
        "class",
        "children",
        "isIncomplete",
        "startLine",
        "lineNumbers",
    ]);
    const cn = useCn();
    // Remove trailing newlines to prevent empty line at end of code blocks
    const trimmedCode = createMemo(() => trimTrailingNewlines(localProps.code));

    // Memoize the raw fallback tokens to avoid recomputing on every render
    const raw = createMemo<HighlightResult>(() => ({
        bg: "transparent",
        fg: "inherit",
        tokens: trimmedCode()
            .split("\n")
            .map((line) => [
                {
                    content: line,
                    color: "inherit",
                    bgColor: "transparent",
                    htmlStyle: {},
                    offset: 0,
                },
            ]),
    }));

    return (
        <CodeBlockContext.Provider value={{ code: localProps.code }}>
            <CodeBlockContainer
                isIncomplete={localProps.isIncomplete ?? false}
                language={localProps.language}
            >
                <CodeBlockHeader language={localProps.language} />
                {localProps.children ? (
                    <div class={cn("sd-codeblock-actions-wrap")}>
                        <div
                            class={cn("sd-codeblock-actions")}
                            data-streamdown="code-block-actions"
                        >
                            {localProps.children}
                        </div>
                    </div>
                ) : null}
                <Suspense
                    fallback={
                        <CodeBlockBody
                            class={localProps.class}
                            language={localProps.language}
                            lineNumbers={localProps.lineNumbers}
                            result={raw()}
                            startLine={localProps.startLine}
                            {...restProps}
                        />
                    }
                >
                    <HighlightedCodeBlockBody
                        class={localProps.class}
                        code={trimmedCode()}
                        language={localProps.language}
                        lineNumbers={localProps.lineNumbers}
                        raw={raw()}
                        startLine={localProps.startLine}
                        {...restProps}
                    />
                </Suspense>
            </CodeBlockContainer>
        </CodeBlockContext.Provider>
    );
};

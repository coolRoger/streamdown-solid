import { createMemo, lazy, Suspense } from "solid-js";
import type { JSX } from "solid-js";
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
    className?: string;
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

export const CodeBlock = ({
    code,
    language,
    className,
    children,
    isIncomplete = false,
    startLine,
    lineNumbers,
    ...rest
}: CodeBlockProps) => {
    const cn = useCn();
    // Remove trailing newlines to prevent empty line at end of code blocks
    const trimmedCode = createMemo(() => trimTrailingNewlines(code));

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
        <CodeBlockContext.Provider value={{ code }}>
            <CodeBlockContainer
                isIncomplete={isIncomplete}
                language={language}
            >
                <CodeBlockHeader language={language} />
                {children ? (
                    <div class={cn("sd-codeblock-actions-wrap")}>
                        <div
                            class={cn("sd-codeblock-actions")}
                            data-streamdown="code-block-actions"
                        >
                            {children}
                        </div>
                    </div>
                ) : null}
                <Suspense
                    fallback={
                        <CodeBlockBody
                            class={className}
                            language={language}
                            lineNumbers={lineNumbers}
                            result={raw()}
                            startLine={startLine}
                            {...rest}
                        />
                    }
                >
                    <HighlightedCodeBlockBody
                        class={className}
                        code={trimmedCode()}
                        language={language}
                        lineNumbers={lineNumbers}
                        raw={raw()}
                        startLine={startLine}
                        {...rest}
                    />
                </Suspense>
            </CodeBlockContainer>
        </CodeBlockContext.Provider>
    );
};

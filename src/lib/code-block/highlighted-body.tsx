import { createEffect, createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import type { BundledLanguage } from "shiki";
import { StreamdownContext } from "../../index";
import { useCodePlugin } from "../plugin-context";
import type { HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";

type HighlightedCodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
    className?: string;
    code: string;
    language: string;
    raw: HighlightResult;
    startLine?: number;
    lineNumbers?: boolean;
};

export const HighlightedCodeBlockBody = ({
    code,
    language,
    raw,
    className,
    startLine,
    lineNumbers,
    ...rest
}: HighlightedCodeBlockBodyProps) => {
    const { shikiTheme } = useContext(StreamdownContext);
    const codePlugin = useCodePlugin();
    const [result, setResult] = createSignal<HighlightResult>(raw);

    createEffect(() => {
        if (!codePlugin) {
            setResult(raw);
            return;
        }

        const cachedResult = codePlugin.highlight(
            {
                code,
                language: language as BundledLanguage,
                themes: shikiTheme,
            },
            (highlightedResult) => {
                setResult(highlightedResult);
            },
        );

        if (cachedResult) {
            setResult(cachedResult);
        }
    }, [code, language, shikiTheme, codePlugin, raw]);

    return (
        <CodeBlockBody
            class={className}
            language={language}
            lineNumbers={lineNumbers}
            result={result()}
            startLine={startLine}
            {...rest}
        />
    );
};

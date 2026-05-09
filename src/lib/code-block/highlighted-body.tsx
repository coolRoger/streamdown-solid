import type { BundledLanguage } from "shiki";
import type { JSX } from "solid-js";
import { createEffect, createSignal, splitProps, useContext } from "solid-js";
import { StreamdownContext } from "../../index";
import { useCodePlugin } from "../plugin-context";
import type { HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";

type HighlightedCodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
    class?: string;
    code: string;
    language: string;
    raw: HighlightResult;
    startLine?: number;
    lineNumbers?: boolean;
};

export const HighlightedCodeBlockBody = (
    props: HighlightedCodeBlockBodyProps,
) => {
    const [localProps, restProps] = splitProps(props, [
        "code",
        "language",
        "raw",
        "class",
        "startLine",
        "lineNumbers",
    ]);
    const { shikiTheme } = useContext(StreamdownContext);
    const codePlugin = useCodePlugin();
    const [result, setResult] = createSignal<HighlightResult>(localProps.raw);

    createEffect(() => {
        if (!codePlugin) {
            setResult(localProps.raw);
            return;
        }

        const cachedResult = codePlugin.highlight(
            {
                code: localProps.code,
                language: localProps.language as BundledLanguage,
                themes: shikiTheme,
            },
            (highlightedResult) => {
                setResult(highlightedResult);
            },
        );

        if (cachedResult) {
            setResult(cachedResult);
        }
    }, [
        localProps.code,
        localProps.language,
        shikiTheme,
        codePlugin,
        localProps.raw,
    ]);

    return (
        <CodeBlockBody
            class={localProps.class}
            language={localProps.language}
            lineNumbers={localProps.lineNumbers}
            result={result()}
            startLine={localProps.startLine}
            {...restProps}
        />
    );
};

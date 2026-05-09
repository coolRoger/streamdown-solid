import { createMemo, For, type JSX, Match, Switch, splitProps } from "solid-js";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

type CodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
    class?: string;
    result: HighlightResult;
    language: string;
    startLine?: number;
    /** Show line numbers in code blocks. @default true */
    lineNumbers?: boolean;
};

/**
 * Parse a CSS declarations string (e.g. Shiki's rootStyle) into a style object.
 * This extracts CSS custom properties like --shiki-dark-bg from Shiki's dual theme output.
 */
const parseRootStyle = (rootStyle: string): Record<string, string> => {
    const style: Record<string, string> = {};
    for (const decl of rootStyle.split(";")) {
        const idx = decl.indexOf(":");
        if (idx > 0) {
            const prop = decl.slice(0, idx).trim();
            const val = decl.slice(idx + 1).trim();
            if (prop && val) {
                style[prop] = val;
            }
        }
    }
    return style;
};

export const CodeBlockBody = (props: CodeBlockBodyProps) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "result",
        "language",
        "class",
        "startLine",
        "lineNumbers",
    ]);
    const cn = useCn();

    // Use CSS custom properties instead of direct inline styles so that
    // dark-mode Tailwind classes can override without !important.
    // This is necessary because !important syntax differs between Tailwind v3 and v4.
    const preStyle = createMemo<JSX.CSSProperties>(() => {
        const style: Record<string, string> = {};

        if (localProps.result.bg) {
            style["--sdm-bg"] = localProps.result.bg;
        }
        if (localProps.result.fg) {
            style["--sdm-fg"] = localProps.result.fg;
        }

        // Parse rootStyle for Shiki dark theme CSS variables (--shiki-dark-bg, etc.)
        if (localProps.result.rootStyle) {
            Object.assign(style, parseRootStyle(localProps.result.rootStyle));
        }

        return style;
    });

    return (
        <div
            class={cn(localProps.class, "sd-codeblock-body")}
            data-language={localProps.language}
            data-streamdown="code-block-body"
            {...restProps}
        >
            <pre
                class={cn(localProps.class, "sd-codeblock-pre")}
                style={preStyle()}
            >
                <code
                    class={
                        (localProps.lineNumbers ?? true)
                            ? cn("sd-code-lines")
                            : undefined
                    }
                    style={
                        (localProps.lineNumbers ?? true) &&
                        localProps.startLine &&
                        localProps.startLine > 1
                            ? {
                                  "counter-reset": `line ${localProps.startLine - 1}`,
                              }
                            : undefined
                    }
                >
                    <For each={localProps.result.tokens}>
                        {(row) => (
                            <span
                                class={
                                    (localProps.lineNumbers ?? true)
                                        ? cn("sd-code-line")
                                        : undefined
                                }
                            >
                                <Switch>
                                    <Match
                                        when={
                                            row.length === 0 ||
                                            (row.length === 1 &&
                                                row[0]?.content === "")
                                        }
                                    >
                                        {"\n"}
                                    </Match>

                                    <Match when={true}>
                                        <For each={row}>
                                            {(token) => {
                                                const tokenStyle: Record<
                                                    string,
                                                    string
                                                > = {};

                                                let hasBg = Boolean(
                                                    token.bgColor,
                                                );

                                                if (token.color) {
                                                    tokenStyle["--sdm-c"] =
                                                        token.color;
                                                }

                                                if (token.bgColor) {
                                                    tokenStyle["--sdm-tbg"] =
                                                        token.bgColor;
                                                }

                                                if (token.htmlStyle) {
                                                    for (const [
                                                        key,
                                                        value,
                                                    ] of Object.entries(
                                                        token.htmlStyle,
                                                    )) {
                                                        if (key === "color") {
                                                            tokenStyle[
                                                                "--sdm-c"
                                                            ] = value;
                                                        } else if (
                                                            key ===
                                                            "background-color"
                                                        ) {
                                                            tokenStyle[
                                                                "--sdm-tbg"
                                                            ] = value;
                                                            hasBg = true;
                                                        } else {
                                                            tokenStyle[key] =
                                                                value;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <span
                                                        class={cn(
                                                            "sd-code-token",
                                                            hasBg &&
                                                                "sd-code-token--bg",
                                                        )}
                                                        style={
                                                            tokenStyle as JSX.CSSProperties
                                                        }
                                                        {...token.htmlAttrs}
                                                    >
                                                        {token.content}
                                                    </span>
                                                );
                                            }}
                                        </For>
                                    </Match>
                                </Switch>
                            </span>
                        )}
                    </For>
                </code>
            </pre>
        </div>
    );
};

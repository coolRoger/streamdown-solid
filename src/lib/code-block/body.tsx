import type { JSX } from "solid-js";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import "../streamdown-ui.css";

type CodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
    className?: string;
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

export const CodeBlockBody = ({
    children,
    result,
    language,
    className,
    startLine,
    lineNumbers = true,
    ...rest
}: CodeBlockBodyProps) => {
    const cn = useCn();

    // Use CSS custom properties instead of direct inline styles so that
    // dark-mode Tailwind classes can override without !important.
    // This is necessary because !important syntax differs between Tailwind v3 and v4.
    const preStyle = createMemo<JSX.CSSProperties>(() => {
        const style: Record<string, string> = {};

        if (result.bg) {
            style["--sdm-bg"] = result.bg;
        }
        if (result.fg) {
            style["--sdm-fg"] = result.fg;
        }

        // Parse rootStyle for Shiki dark theme CSS variables (--shiki-dark-bg, etc.)
        if (result.rootStyle) {
            Object.assign(style, parseRootStyle(result.rootStyle));
        }

        return style;
    });

    return (
        <div
            class={cn(className, "sd-codeblock-body")}
            data-language={language}
            data-streamdown="code-block-body"
            {...rest}
        >
            <pre
                class={cn(className, "sd-codeblock-pre")}
                style={preStyle()}
            >
                <code
                    class={lineNumbers ? cn("sd-code-lines") : undefined}
                    style={
                        lineNumbers && startLine && startLine > 1
                            ? { counterReset: `line ${startLine - 1}` }
                            : undefined
                    }
                >
                    {result.tokens.map((row, index) => (
                        <span
                            class={lineNumbers ? cn("sd-code-line") : undefined}
                            // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                            key={index}
                        >
                            {row.length === 0 ||
                            (row.length === 1 && row[0].content === "")
                                ? // Empty line: insert newline to preserve copy behavior
                                  "\n"
                                : // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: dual-theme token style mapping
                                  row.map((token, tokenIndex) => {
                                      // Shiki dual-theme tokens put direct CSS properties (color,
                                      // background-color) into htmlStyle alongside CSS custom
                                      // properties (--shiki-dark, etc). Direct properties as inline
                                      // styles override the Tailwind class-based dark mode approach,
                                      // so we redirect them to CSS custom properties instead.
                                      const tokenStyle: Record<string, string> =
                                          {};
                                      let hasBg = Boolean(token.bgColor);

                                      if (token.color) {
                                          tokenStyle["--sdm-c"] = token.color;
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
                                                  tokenStyle["--sdm-c"] = value;
                                              } else if (
                                                  key === "background-color"
                                              ) {
                                                  tokenStyle["--sdm-tbg"] =
                                                      value;
                                                  hasBg = true;
                                              } else {
                                                  tokenStyle[key] = value;
                                              }
                                          }
                                      }

                                      return (
                                          <span
                                              class={cn(
                                                  "sd-code-token",
                                                  hasBg && "sd-code-token--bg",
                                              )}
                                              // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                                              key={tokenIndex}
                                              style={
                                                  tokenStyle as JSX.CSSProperties
                                              }
                                              {...token.htmlAttrs}
                                          >
                                              {token.content}
                                          </span>
                                      );
                                  })}
                        </span>
                    ))}
                </code>
            </pre>
        </div>
    );
};

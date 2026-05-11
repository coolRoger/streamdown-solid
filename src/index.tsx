"use client";

import type { MermaidConfig } from "mermaid";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import {
    For,
    Match,
    Switch,
    type Component,
    createComponent,
    createContext,
    createEffect,
    createMemo,
    createSignal,
    type JSX,
    splitProps,
    useTransition,
} from "solid-js";
import type { Pluggable } from "unified";
import {
    type AnimateOptions,
    type AnimatePlugin,
    createAnimatePlugin,
} from "./lib/animate";
import { BlockIncompleteContext } from "./lib/block-incomplete-context";
import { components as defaultComponents } from "./lib/components";
import { detectTextDirection } from "./lib/detect-direction";
import { type IconMap, IconProvider } from "./lib/icon-context";
import { hasIncompleteCodeFence, hasTable } from "./lib/incomplete-code-utils";
import { type ExtraProps, Markdown, type Options } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { PluginContext } from "./lib/plugin-context";
import type { PluginConfig, ThemeInput } from "./lib/plugin-types";
import { PrefixContext } from "./lib/prefix-context";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags";
import { preprocessLiteralTagContent } from "./lib/preprocess-literal-tag-content";
import { rehypeLiteralTagContent } from "./lib/rehype/literal-tag-content";
import { remarkCodeMeta } from "./lib/remark/code-meta";
import {
    defaultTranslations,
    type StreamdownTranslations,
    TranslationsContext,
} from "./lib/translations-context";
import { type ClassValue, type CnFunction, cn } from "./lib/utils";
import "./styles.css";

export type {
    BundledLanguage,
    BundledTheme,
    ThemeRegistrationAny,
} from "shiki";
export type { AnimateOptions } from "./lib/animate";
export { createAnimatePlugin } from "./lib/animate";
export { useIsCodeFenceIncomplete } from "./lib/block-incomplete-context";
export { CodeBlock } from "./lib/code-block";
export { CodeBlockContainer } from "./lib/code-block/container";
export { CodeBlockCopyButton } from "./lib/code-block/copy-button";
export { CodeBlockDownloadButton } from "./lib/code-block/download-button";
export { CodeBlockHeader } from "./lib/code-block/header";
export { CodeBlockSkeleton } from "./lib/code-block/skeleton";
export { detectTextDirection } from "./lib/detect-direction";
export type { IconMap } from "./lib/icon-context";

export type {
    AllowElement,
    Components,
    ExtraProps,
    UrlTransform,
} from "./lib/markdown";
export { defaultUrlTransform } from "./lib/markdown";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export type {
    CjkPlugin,
    CodeHighlighterPlugin,
    CustomRenderer,
    CustomRendererProps,
    DiagramPlugin,
    HighlightOptions,
    MathPlugin,
    PluginConfig,
    ThemeInput,
} from "./lib/plugin-types";
export {
    TableCopyDropdown,
    type TableCopyDropdownProps,
} from "./lib/table/copy-dropdown";
export {
    TableDownloadButton,
    type TableDownloadButtonProps,
    TableDownloadDropdown,
    type TableDownloadDropdownProps,
} from "./lib/table/download-dropdown";
export {
    escapeMarkdownTableCell,
    extractTableDataFromElement,
    type TableData,
    tableDataToCSV,
    tableDataToMarkdown,
    tableDataToTSV,
} from "./lib/table/utils";
export type { StreamdownTranslations } from "./lib/translations-context";
export { defaultTranslations } from "./lib/translations-context";

import remend, { type RemendOptions } from "./plugins/remend";

// Patterns for HTML indentation normalization
// Matches if content starts with an HTML tag (possibly with leading whitespace)
const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
// Matches 4+ spaces/tabs before HTML tags at line starts
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

/**
 * Normalizes indentation in HTML blocks to prevent Markdown parsers from
 * treating indented HTML tags as code blocks (4+ spaces = code in Markdown).
 *
 * Useful when rendering AI-generated HTML content with nested tags that
 * are indented for readability.
 *
 * @param content - The raw HTML/Markdown string to normalize
 * @returns The normalized string with reduced indentation before HTML tags
 */
export const normalizeHtmlIndentation = (content: string): string => {
    if (typeof content !== "string" || content.length === 0) {
        return content;
    }
    // Only process if content starts with an HTML-like tag (possibly indented)
    if (!HTML_BLOCK_START_PATTERN.test(content)) {
        return content;
    }
    // Remove 4+ spaces/tabs before HTML tags at line starts
    return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

export type ControlsConfig =
    | boolean
    | {
          table?:
              | boolean
              | {
                    copy?: boolean;
                    download?: boolean;
                    fullscreen?: boolean;
                };
          code?:
              | boolean
              | {
                    copy?: boolean;
                    download?: boolean;
                };
          mermaid?:
              | boolean
              | {
                    download?: boolean;
                    copy?: boolean;
                    fullscreen?: boolean;
                    panZoom?: boolean;
                };
      };

export interface LinkSafetyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    url: string;
}

export interface LinkSafetyConfig {
    enabled: boolean;
    onLinkCheck?: (url: string) => Promise<boolean> | boolean;
    renderModal?: (props: LinkSafetyModalProps) => JSX.Element;
}

export interface MermaidErrorComponentProps {
    chart: string;
    error: string;
    retry: () => void;
}

export interface MermaidOptions {
    config?: MermaidConfig;
    errorComponent?: Component<MermaidErrorComponentProps>;
}

export type AllowedTags = Record<string, string[]>;

export type StreamdownProps = Options & {
    mode?: "static" | "streaming";
    /** Text direction for blocks. "auto" detects per-block using first strong character algorithm. */
    dir?: "auto" | "ltr" | "rtl";
    BlockComponent?: Component<BlockProps>;
    parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
    parseIncompleteMarkdown?: boolean;
    /** Normalize HTML block indentation to prevent 4+ spaces being treated as code blocks. @default false */
    normalizeHtmlIndentation?: boolean;
    class?: string;
    shikiTheme?: [ThemeInput, ThemeInput];
    mermaid?: MermaidOptions;
    controls?: ControlsConfig;
    isAnimating?: boolean;
    animated?: boolean | AnimateOptions;
    caret?: keyof typeof carets;
    plugins?: PluginConfig;
    remend?: RemendOptions;
    linkSafety?: LinkSafetyConfig;
    /** Custom tags to allow through sanitization with their permitted attributes */
    allowedTags?: AllowedTags;
    /**
     * Tags whose children should be treated as plain text (no markdown parsing).
     * Useful for mention/entity tags in AI UIs where child content is a data
     * label rather than prose. Requires the tag to also be listed in `allowedTags`.
     *
     * @example
     * ```tsx
     * <Streamdown
     *   allowedTags={{ mention: ['user_id'] }}
     *   literalTagContent={['mention']}
     * >
     *   {`<mention user_id="123">@_some_username_</mention>`}
     * </Streamdown>
     * ```
     */
    literalTagContent?: string[];
    /** Override UI strings for i18n / custom labels */
    translations?: Partial<StreamdownTranslations>;
    /** Custom icons to override the default icons used in controls */
    icons?: Partial<IconMap>;
    /** Prefix to prepend to library class names (including user-provided class values). */
    prefix?: string;
    /** Show line numbers in code blocks. @default true */
    lineNumbers?: boolean;
    /** Called when isAnimating transitions from false to true. Suppressed in mode="static". */
    onAnimationStart?: () => void;
    /** Called when isAnimating transitions from true to false. Suppressed in mode="static". */
    onAnimationEnd?: () => void;
};

const prefixClassValue = (value: ClassValue, prefix?: string): ClassValue => {
    if (!prefix || !value) {
        return value;
    }
    if (typeof value === "string") {
        return value
            .split(/\s+/)
            .filter(Boolean)
            .map((cls) => `${prefix}:${cls}`)
            .join(" ");
    }
    if (Array.isArray(value)) {
        return value.map((entry) => prefixClassValue(entry, prefix));
    }
    if (typeof value === "object") {
        const result: Record<string, boolean> = {};
        for (const [key, enabled] of Object.entries(value)) {
            result[`${prefix}:${key}`] = enabled;
        }
        return result;
    }
    return value;
};

const createCn =
    (prefix?: string): CnFunction =>
    (...inputs) =>
        cn(...inputs.map((value) => prefixClassValue(value, prefix)));

const defaultSanitizeSchema = {
    ...defaultSchema,
    protocols: {
        ...defaultSchema.protocols,
        href: [...(defaultSchema.protocols?.href ?? []), "tel"],
    },
    attributes: {
        ...defaultSchema.attributes,
        code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
    },
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
    raw: rehypeRaw,
    sanitize: [rehypeSanitize, defaultSanitizeSchema],
    harden: [
        harden,
        {
            allowedImagePrefixes: ["*"],
            allowedLinkPrefixes: ["*"],
            allowedProtocols: ["*"],
            defaultOrigin: undefined,
            allowDataImages: true,
        },
    ],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
    gfm: [remarkGfm, {}],
    codeMeta: remarkCodeMeta,
} as const;

// Stable plugin arrays for cache efficiency - created once at module level
const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

const carets = {
    block: " ▋",
    circle: " ●",
};

// Combined context for simpler provider wiring
export interface StreamdownContextType {
    controls: ControlsConfig;
    isAnimating: boolean;
    /** Show line numbers in code blocks. @default true */
    lineNumbers: boolean;
    linkSafety?: LinkSafetyConfig;
    mermaid?: MermaidOptions;
    mode: "static" | "streaming";
    shikiTheme: [ThemeInput, ThemeInput];
}

const defaultShikiTheme: [ThemeInput, ThemeInput] = [
    "github-light",
    "github-dark",
];

const defaultLinkSafetyConfig: LinkSafetyConfig = {
    enabled: true,
};

const defaultStreamdownContext: StreamdownContextType = {
    shikiTheme: defaultShikiTheme,
    controls: true,
    isAnimating: false,
    lineNumbers: true,
    mode: "streaming",
    mermaid: undefined,
    linkSafety: defaultLinkSafetyConfig,
};

export const StreamdownContext = createContext<StreamdownContextType>(
    defaultStreamdownContext,
);

export type BlockProps = Options & {
    content: string;
    shouldParseIncompleteMarkdown: boolean;
    shouldNormalizeHtmlIndentation: boolean;
    index: number;
    /** Whether this block is incomplete (still being streamed) */
    isIncomplete: boolean;
    /** Resolved text direction for this block */
    dir?: "ltr" | "rtl";
    /** Animate plugin instance for tracking previous content length */
    animatePlugin?: AnimatePlugin | null;
};

export const Block = (props: BlockProps) => {
    const [localProps, restProps] = splitProps(props, [
        "content",
        "shouldParseIncompleteMarkdown",
        "shouldNormalizeHtmlIndentation",
        "index",
        "isIncomplete",
        "dir",
        "animatePlugin",
    ]);
    // Tell the animate plugin how many HAST characters were already rendered
    // so it can skip their animation (duration=0ms) on this render pass.
    //
    // getLastRenderCharCount() returns the char count from the PREVIOUS
    // rehype run then resets to 0. Renders depth-first: this Block's
    // body runs, then its child Markdown calls processor.runSync (which
    // runs rehypeAnimate synchronously). So the value here is from the
    // previous render — exactly what we need as prevContentLength.
    if (localProps.animatePlugin) {
        const prevCount = localProps.animatePlugin.getLastRenderCharCount();
        localProps.animatePlugin.setPrevContentLength(prevCount);
    }

    // Note: remend is already applied to the entire markdown before parsing into blocks
    // in the Streamdown component, so we don't need to apply it again here
    const normalizedContent =
        typeof localProps.content === "string" &&
        localProps.shouldNormalizeHtmlIndentation
            ? normalizeHtmlIndentation(localProps.content)
            : localProps.content;

    const inner = <Markdown {...restProps}>{normalizedContent}</Markdown>;

    return (
        <BlockIncompleteContext.Provider value={localProps.isIncomplete}>
            <Switch fallback={inner}>
                <Match when={localProps.dir}>
                    <div
                        dir={localProps.dir}
                        style={{ display: "contents" }}
                    >
                        {inner}
                    </div>
                </Match>
            </Switch>
        </BlockIncompleteContext.Provider>
    );
};

export const StreamdownSolid = (props: StreamdownProps) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "mode",
        "dir",
        "parseIncompleteMarkdown",
        "normalizeHtmlIndentation",
        "components",
        "rehypePlugins",
        "remarkPlugins",
        "class",
        "shikiTheme",
        "mermaid",
        "controls",
        "isAnimating",
        "animated",
        "BlockComponent",
        "parseMarkdownIntoBlocksFn",
        "caret",
        "plugins",
        "remend",
        "linkSafety",
        "lineNumbers",
        "allowedTags",
        "literalTagContent",
        "translations",
        "icons",
        "prefix",
        "onAnimationStart",
        "onAnimationEnd",
    ]);
    const mode = localProps.mode ?? "streaming";
    const shouldParseIncompleteMarkdown =
        localProps.parseIncompleteMarkdown ?? true;
    const shouldNormalizeHtmlIndentation =
        localProps.normalizeHtmlIndentation ?? false;
    const rehypePlugins = localProps.rehypePlugins ?? defaultRehypePluginsArray;
    const remarkPlugins = localProps.remarkPlugins ?? defaultRemarkPluginsArray;
    const shikiTheme = localProps.shikiTheme ?? defaultShikiTheme;
    const controls = localProps.controls ?? true;
    const isAnimating = localProps.isAnimating ?? false;
    const BlockComponent = localProps.BlockComponent ?? Block;
    const parseMarkdownIntoBlocksFn =
        localProps.parseMarkdownIntoBlocksFn ?? parseMarkdownIntoBlocks;
    const linkSafety = localProps.linkSafety ?? defaultLinkSafetyConfig;
    const lineNumbers = localProps.lineNumbers ?? true;
    const iconOverrides = localProps.icons;

    // All hooks must be called before any conditional returns
    const [_isPending, startTransition] = useTransition();

    const prefixedCn = createMemo(() => createCn(localProps.prefix));

    // null means "first render" — distinguishes from false so we can fire
    // onAnimationStart on mount when isAnimating={true} without firing
    // onAnimationEnd on mount when isAnimating={false}.
    let prevIsAnimating: boolean | null = null;
    createEffect(() => {
        if (mode === "static") {
            return;
        }

        const prev = prevIsAnimating;
        prevIsAnimating = isAnimating;

        // First render: only fire start (never end, since there's no prior state to end)
        if (prev === null) {
            if (isAnimating) {
                localProps.onAnimationStart?.();
            }
            return;
        }

        if (isAnimating && !prev) {
            localProps.onAnimationStart?.();
        } else if (!isAnimating && prev) {
            localProps.onAnimationEnd?.();
        }
    });

    const allowedTagNames = createMemo(() =>
        localProps.allowedTags ? Object.keys(localProps.allowedTags) : [],
    );

    // Apply remend to fix incomplete markdown BEFORE parsing into blocks
    // This prevents partial list items from being interpreted as setext headings
    const processedChildren = createMemo(() => {
        if (typeof localProps.children !== "string") {
            return "";
        }
        let result =
            mode === "streaming" && shouldParseIncompleteMarkdown
                ? remend(localProps.children, localProps.remend)
                : localProps.children;

        // Escape markdown metacharacters inside literal-tag-content tags so that
        // children are rendered as plain text rather than parsed as markdown.
        // This must run BEFORE preprocessCustomTags so that the HTML comments
        // (<!---->) inserted to preserve blank lines are not themselves escaped.
        if (
            localProps.literalTagContent &&
            localProps.literalTagContent.length > 0
        ) {
            result = preprocessLiteralTagContent(
                result,
                localProps.literalTagContent,
            );
        }

        // Preprocess custom tags to prevent blank lines from splitting HTML blocks.
        // Runs after preprocessLiteralTagContent so that the inserted <!---->
        // markers are not corrupted by markdown metacharacter escaping.
        if (allowedTagNames().length > 0) {
            result = preprocessCustomTags(result, allowedTagNames());
        }

        return result;
    });

    const blocks = createMemo(() =>
        parseMarkdownIntoBlocksFn(processedChildren()),
    );

    // Initialize displayBlocks with blocks to avoid hydration mismatch
    // Previously initialized as [] which caused content to flicker on hydration
    const [displayBlocks, setDisplayBlocks] = createSignal<string[]>(blocks());

    // Use transition for block updates in streaming mode to avoid blocking UI
    createEffect(() => {
        const nextBlocks = blocks();
        // Avoid referencing `animatePlugin` before it is initialized.
        // A truthy `animated` prop always results in an animate plugin.
        if (mode === "streaming" && !localProps.animated) {
            startTransition(() => {
                setDisplayBlocks(nextBlocks);
            });
        } else {
            setDisplayBlocks(nextBlocks);
        }
    });

    // Use displayBlocks for rendering to leverage useTransition
    const blocksToRender = createMemo(() =>
        mode === "streaming" ? displayBlocks() : blocks(),
    );

    // Pre-compute per-block text directions when dir="auto" so detection
    // runs once per block change rather than on every render pass.
    const blockDirections = createMemo(() =>
        localProps.dir === "auto"
            ? blocksToRender().map(detectTextDirection)
            : undefined,
    );

    // Generate stable keys based on index only
    // Don't use content hash - that causes unmount/remount when content changes
    // Stable key derived from animated option values. This prevents the
    // plugin from being recreated when the user passes an inline object
    // literal (e.g. animated={{ animation: 'fadeIn' }}) whose reference
    // changes on every parent render.
    const animatedKey = createMemo(() => {
        if (localProps.animated === true) {
            return "true";
        }
        if (localProps.animated) {
            return JSON.stringify(localProps.animated);
        }
        return "";
    });

    const animatePlugin = createMemo(() => {
        if (!animatedKey()) {
            return null;
        }
        if (animatedKey() === "true") {
            return createAnimatePlugin();
        }
        return createAnimatePlugin(localProps.animated as AnimateOptions);
    });

    const contextValue = createMemo<StreamdownContextType>(() => ({
        shikiTheme: localProps.plugins?.code?.getThemes() ?? shikiTheme,
        controls,
        isAnimating,
        lineNumbers,
        mode,
        mermaid: localProps.mermaid,
        linkSafety,
    }));

    // Stable key derived from translations values so inline objects don't
    // defeat memoization (same pattern used for `animated` above).
    const translationsValue = createMemo(() => ({
        ...defaultTranslations,
        ...localProps.translations,
    }));

    // Memoize merged components to avoid recreating on every render
    const mergedComponents = createMemo(() => {
        const { inlineCode, ...userComponents } = localProps.components ?? {};

        const merged = {
            ...defaultComponents,
            ...userComponents,
        };

        if (inlineCode) {
            const BlockCode = merged.code;
            merged.code = (
                codeProps: JSX.IntrinsicElements["code"] & ExtraProps,
            ) => {
                const isInline = !("data-block" in codeProps);
                if (isInline) {
                    return createComponent(inlineCode, codeProps);
                }
                return BlockCode
                    ? createComponent(BlockCode as Component<any>, codeProps)
                    : null;
            };
        }

        return merged;
    });

    // Merge plugin remark plugins (math, cjk)
    // Order: CJK before -> default (remarkGfm) -> CJK after -> math
    const mergedRemarkPlugins = createMemo(() => {
        let result: Pluggable[] = [];
        // CJK plugins that must run BEFORE remarkGfm (e.g., remark-cjk-friendly)
        if (localProps.plugins?.cjk) {
            result = [...result, ...localProps.plugins.cjk.remarkPluginsBefore];
        }
        // Default plugins (includes remarkGfm)
        result = [...result, ...remarkPlugins];
        // CJK plugins that must run AFTER remarkGfm (e.g., autolink boundary)
        if (localProps.plugins?.cjk) {
            result = [...result, ...localProps.plugins.cjk.remarkPluginsAfter];
        }
        // Math plugins
        if (localProps.plugins?.math) {
            result = [...result, localProps.plugins.math.remarkPlugin];
        }
        return result;
    });

    const mergedRehypePlugins = createMemo(() => {
        let result = rehypePlugins;

        // extend sanitization schema with allowedTags. only works with default plugins. if user provides a custom sanitize plugin, they can pass in the custom allowed tags via the plugins object.
        if (
            localProps.allowedTags &&
            Object.keys(localProps.allowedTags).length > 0 &&
            rehypePlugins === defaultRehypePluginsArray
        ) {
            const extendedSchema = {
                ...defaultSanitizeSchema,
                tagNames: [
                    ...(defaultSanitizeSchema.tagNames ?? []),
                    ...Object.keys(localProps.allowedTags),
                ],
                attributes: {
                    ...defaultSanitizeSchema.attributes,
                    ...localProps.allowedTags,
                },
            };

            result = [
                defaultRehypePlugins.raw!,
                [rehypeSanitize, extendedSchema],
                defaultRehypePlugins.harden!,
            ];
        }

        if (
            localProps.literalTagContent &&
            localProps.literalTagContent.length > 0
        ) {
            result = [
                ...result,
                [rehypeLiteralTagContent, localProps.literalTagContent],
            ];
        }

        if (localProps.plugins?.math) {
            result = [...result, localProps.plugins.math.rehypePlugin];
        }

        if (animatePlugin() && isAnimating) {
            result = [...result, animatePlugin()!.rehypePlugin];
        }

        return result;
    });

    const shouldHideCaret = createMemo(() => {
        if (!isAnimating || blocksToRender().length === 0) {
            return false;
        }
        const lastBlock = blocksToRender().at(-1) as string;
        return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
    });

    const style = createMemo(() =>
        localProps.caret && isAnimating && !shouldHideCaret()
            ? ({
                  "--streamdown-caret": `"${carets[localProps.caret]}"`,
              } as JSX.CSSProperties)
            : undefined,
    );

    return (
        <TranslationsContext.Provider value={translationsValue()}>
            <PluginContext.Provider value={localProps.plugins ?? null}>
                <StreamdownContext.Provider value={contextValue()}>
                    <IconProvider icons={iconOverrides}>
                        <PrefixContext.Provider value={prefixedCn()}>
                            <Switch>
                                <Match when={mode === "static"}>
                                    <div
                                        class={prefixedCn()(
                                            "sd-streamdown-root",
                                            localProps.class,
                                        )}
                                        dir={
                                            localProps.dir === "auto"
                                                ? detectTextDirection(
                                                      processedChildren(),
                                                  )
                                                : localProps.dir
                                        }
                                    >
                                        <Markdown
                                            components={mergedComponents()}
                                            rehypePlugins={mergedRehypePlugins()}
                                            remarkPlugins={mergedRemarkPlugins()}
                                            {...restProps}
                                        >
                                            {processedChildren()}
                                        </Markdown>
                                    </div>
                                </Match>
                                <Match when={mode === "streaming"}>
                                    <div
                                        class={prefixedCn()(
                                            "sd-streamdown-root",
                                            localProps.caret && !shouldHideCaret()
                                                ? "sd-streamdown-root--with-caret"
                                                : null,
                                            localProps.class,
                                        )}
                                        style={style()}
                                    >
                                        <Switch>
                                            <Match
                                                when={
                                                    blocksToRender().length === 0 &&
                                                    localProps.caret &&
                                                    isAnimating
                                                }
                                            >
                                                <span />
                                            </Match>
                                        </Switch>
                                        <For each={blocksToRender()}>
                                            {(block, index) => {
                                                const isLastBlock =
                                                    index() ===
                                                    blocksToRender().length - 1;
                                                const isIncomplete =
                                                    isAnimating &&
                                                    isLastBlock &&
                                                    hasIncompleteCodeFence(block);
                                                return (
                                                    <BlockComponent
                                                        animatePlugin={animatePlugin()}
                                                        components={mergedComponents()}
                                                        content={block}
                                                        dir={
                                                            blockDirections()?.[
                                                                index()
                                                            ] ??
                                                            (localProps.dir !==
                                                            "auto"
                                                                ? localProps.dir
                                                                : undefined)
                                                        }
                                                        index={index()}
                                                        isIncomplete={isIncomplete}
                                                        rehypePlugins={mergedRehypePlugins()}
                                                        remarkPlugins={mergedRemarkPlugins()}
                                                        shouldNormalizeHtmlIndentation={
                                                            shouldNormalizeHtmlIndentation
                                                        }
                                                        shouldParseIncompleteMarkdown={
                                                            shouldParseIncompleteMarkdown
                                                        }
                                                        {...restProps}
                                                    />
                                                );
                                            }}
                                        </For>
                                    </div>
                                </Match>
                            </Switch>
                        </PrefixContext.Provider>
                    </IconProvider>
                </StreamdownContext.Provider>
            </PluginContext.Provider>
        </TranslationsContext.Provider>
    );
};

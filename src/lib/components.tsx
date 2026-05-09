import { createSignal, lazy, Suspense, useContext, type JSX } from "solid-js";
// BundledLanguage type removed - we now support any language string
import { type ControlsConfig, StreamdownContext } from "../index";
import "./streamdown-ui.css";
import { useIsCodeFenceIncomplete } from "./block-incomplete-context";
import { CodeBlock } from "./code-block";
import { CodeBlockCopyButton } from "./code-block/copy-button";
import { CodeBlockDownloadButton } from "./code-block/download-button";
import { CodeBlockSkeleton } from "./code-block/skeleton";
import { ImageComponent } from "./image";
import { LinkSafetyModal } from "./link-modal";
import type { ExtraProps, Options } from "./markdown";
import { MermaidDownloadDropdown } from "./mermaid/download-button";
import { MermaidFullscreenButton } from "./mermaid/fullscreen-button";
import { useCustomRenderer, useMermaidPlugin } from "./plugin-context";
import { useCn } from "./prefix-context";
import { Table } from "./table";

const START_LINE_PATTERN = /startLine=(\d+)/;
const NO_LINE_NUMBERS_PATTERN = /\bnoLineNumbers\b/;

// Lazy load heavy components
const Mermaid = lazy(() =>
    import("./mermaid").then((mod) => ({ default: mod.Mermaid })),
);

const LANGUAGE_REGEX = /language-([^\s]+)/;

interface MarkdownPoint {
    column?: number;
    line?: number;
}
interface MarkdownPosition {
    end?: MarkdownPoint;
    start?: MarkdownPoint;
}
interface MarkdownNode {
    position?: MarkdownPosition;
    properties?: { className?: string; metastring?: string };
}

type WithNode<T> = T & {
    node?: MarkdownNode;
    children?: JSX.Element;
    className?: string;
};

const isValidElement = (
    value: unknown,
): value is { props: Record<string, unknown>; type?: unknown } =>
    typeof value === "object" && value !== null && "props" in value;

const cloneElement = (
    element: { props: Record<string, unknown>; type?: unknown },
    nextProps: Record<string, unknown>,
) => ({
    ...element,
    props: {
        ...element.props,
        ...nextProps,
    },
});

const memo = <T,>(
    component: (props: T) => JSX.Element,
    _compare?: (prev: T, next: T) => boolean,
) => component;

function sameNodePosition(prev?: MarkdownNode, next?: MarkdownNode): boolean {
    if (!(prev?.position || next?.position)) {
        return true;
    }
    if (!(prev?.position && next?.position)) {
        return false;
    }

    const prevStart = prev.position.start;
    const nextStart = next.position.start;
    const prevEnd = prev.position.end;
    const nextEnd = next.position.end;

    return (
        prevStart?.line === nextStart?.line &&
        prevStart?.column === nextStart?.column &&
        prevEnd?.line === nextEnd?.line &&
        prevEnd?.column === nextEnd?.column
    );
}

// Shared comparators
function sameClassAndNode(
    prev: { className?: string; node?: MarkdownNode },
    next: { className?: string; node?: MarkdownNode },
) {
    return (
        prev.className === next.className &&
        sameNodePosition(prev.node, next.node)
    );
}

const shouldShowControls = (
    config: ControlsConfig,
    type: "table" | "code" | "mermaid",
) => {
    if (typeof config === "boolean") {
        return config;
    }

    return config[type] !== false;
};

const shouldShowTableControl = (
    config: ControlsConfig,
    controlType: "copy" | "download" | "fullscreen",
): boolean => {
    if (typeof config === "boolean") {
        return config;
    }

    const tableConfig = config.table;

    if (tableConfig === false) {
        return false;
    }

    if (tableConfig === true || tableConfig === undefined) {
        return true;
    }

    return tableConfig[controlType] !== false;
};

const shouldShowCodeControl = (
    config: ControlsConfig,
    controlType: "copy" | "download",
): boolean => {
    if (typeof config === "boolean") {
        return config;
    }

    const codeConfig = config.code;

    if (codeConfig === false) {
        return false;
    }

    if (codeConfig === true || codeConfig === undefined) {
        return true;
    }

    return codeConfig[controlType] !== false;
};

const shouldShowMermaidControl = (
    config: ControlsConfig,
    controlType: "download" | "copy" | "fullscreen" | "panZoom",
): boolean => {
    if (typeof config === "boolean") {
        return config;
    }

    const mermaidConfig = config.mermaid;

    if (mermaidConfig === false) {
        return false;
    }

    if (mermaidConfig === true || mermaidConfig === undefined) {
        return true;
    }

    return mermaidConfig[controlType] !== false;
};

type OlProps = WithNode<JSX.IntrinsicElements["ol"]>;
const MemoOl = memo<OlProps>(
    ({ children, className, node, ...props }: OlProps) => {
        const cn = useCn();
        return (
            <ol
                class={cn("sd-md-ol", className)}
                data-streamdown="ordered-list"
                {...props}
            >
                {children}
            </ol>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoOl.displayName = "MarkdownOl";

type LiProps = WithNode<JSX.IntrinsicElements["li"]>;

const MemoLi = memo<LiProps>(
    ({ children, className, node, ...props }: LiProps) => {
        const cn = useCn();
        return (
            <li
                class={cn("sd-md-li", className)}
                data-streamdown="list-item"
                {...props}
            >
                {children}
            </li>
        );
    },
    (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoLi.displayName = "MarkdownLi";

type UlProps = WithNode<JSX.IntrinsicElements["ul"]>;
const MemoUl = memo<UlProps>(
    ({ children, className, node, ...props }: UlProps) => {
        const cn = useCn();
        return (
            <ul
                class={cn("sd-md-ul", className)}
                data-streamdown="unordered-list"
                {...props}
            >
                {children}
            </ul>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoUl.displayName = "MarkdownUl";

type HrProps = WithNode<JSX.IntrinsicElements["hr"]>;
const MemoHr = memo<HrProps>(
    ({ className, node, ...props }: HrProps) => {
        const cn = useCn();
        return (
            <hr
                class={cn("sd-md-hr", className)}
                data-streamdown="horizontal-rule"
                {...props}
            />
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoHr.displayName = "MarkdownHr";

type StrongProps = WithNode<JSX.IntrinsicElements["span"]>;
const MemoStrong = memo<StrongProps>(
    ({ children, className, node, ...props }: StrongProps) => {
        const cn = useCn();
        return (
            <span
                class={cn("sd-md-strong", className)}
                data-streamdown="strong"
                {...props}
            >
                {children}
            </span>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoStrong.displayName = "MarkdownStrong";

type AProps = WithNode<JSX.IntrinsicElements["a"]> & { href?: string };

const LinkComponent = ({
    children,
    className,
    href,
    node,
    ...props
}: AProps) => {
    const cn = useCn();
    const { linkSafety } = useContext(StreamdownContext);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const isIncomplete = href === "streamdown:incomplete-link";

    const handleClick = async (e: MouseEvent) => {
        if (!(linkSafety?.enabled && href) || isIncomplete) {
            return;
        }

        e.preventDefault();

        if (linkSafety.onLinkCheck) {
            const isAllowed = await linkSafety.onLinkCheck(href);
            if (isAllowed) {
                window.open(href, "_blank", "noreferrer");
                return;
            }
        }

        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        if (href) {
            window.open(href, "_blank", "noreferrer");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const modalProps = {
        url: href ?? "",
        isOpen: isModalOpen(),
        onClose: handleCloseModal,
        onConfirm: handleConfirm,
    };

    if (linkSafety?.enabled && href) {
        return (
            // return here
            <>
                <button
                    class={cn("sd-md-link-button", className)}
                    data-incomplete={isIncomplete}
                    data-streamdown="link"
                    onClick={handleClick}
                    type="button"
                >
                    {children}
                </button>
                {linkSafety.renderModal ? (
                    linkSafety.renderModal(modalProps)
                ) : (
                    <LinkSafetyModal {...modalProps} />
                )}
            </>
        );
    }

    return (
        <a
            class={cn("sd-md-link", className)}
            data-incomplete={isIncomplete}
            data-streamdown="link"
            href={href}
            rel="noreferrer"
            target="_blank"
            {...props}
        >
            {children}
        </a>
    );
};

const MemoA = memo<AProps>(
    LinkComponent,
    (p, n) => sameClassAndNode(p, n) && p.href === n.href,
);
MemoA.displayName = "MarkdownA";

type HeadingProps<TTag extends keyof JSX.IntrinsicElements> = WithNode<
    JSX.IntrinsicElements[TTag]
>;

const MemoH1 = memo<HeadingProps<"h1">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h1
                class={cn("sd-md-h1", className)}
                data-streamdown="heading-1"
                {...props}
            >
                {children}
            </h1>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH1.displayName = "MarkdownH1";

const MemoH2 = memo<HeadingProps<"h2">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h2
                class={cn("sd-md-h2", className)}
                data-streamdown="heading-2"
                {...props}
            >
                {children}
            </h2>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH2.displayName = "MarkdownH2";

const MemoH3 = memo<HeadingProps<"h3">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h3
                class={cn("sd-md-h3", className)}
                data-streamdown="heading-3"
                {...props}
            >
                {children}
            </h3>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH3.displayName = "MarkdownH3";

const MemoH4 = memo<HeadingProps<"h4">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h4
                class={cn("sd-md-h4", className)}
                data-streamdown="heading-4"
                {...props}
            >
                {children}
            </h4>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH4.displayName = "MarkdownH4";

const MemoH5 = memo<HeadingProps<"h5">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h5
                class={cn("sd-md-h5", className)}
                data-streamdown="heading-5"
                {...props}
            >
                {children}
            </h5>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH5.displayName = "MarkdownH5";

const MemoH6 = memo<HeadingProps<"h6">>(
    ({ children, className, node, ...props }) => {
        const cn = useCn();
        return (
            <h6
                class={cn("sd-md-h6", className)}
                data-streamdown="heading-6"
                {...props}
            >
                {children}
            </h6>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoH6.displayName = "MarkdownH6";

type TableComponentProps = WithNode<JSX.IntrinsicElements["table"]>;
const MemoTable = memo<TableComponentProps>(
    ({ children, className, node, ...props }: TableComponentProps) => {
        const { controls: controlsConfig } = useContext(StreamdownContext);
        const showTableControls = shouldShowControls(controlsConfig, "table");
        const showCopy = shouldShowTableControl(controlsConfig, "copy");
        const showDownload = shouldShowTableControl(controlsConfig, "download");
        const showFullscreen = shouldShowTableControl(
            controlsConfig,
            "fullscreen",
        );

        return (
            <Table
                class={className}
                showControls={showTableControls}
                showCopy={showCopy}
                showDownload={showDownload}
                showFullscreen={showFullscreen}
                {...props}
            >
                {children}
            </Table>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoTable.displayName = "MarkdownTable";

type TheadProps = WithNode<JSX.IntrinsicElements["thead"]>;
const MemoThead = memo<TheadProps>(
    ({ children, className, node, ...props }: TheadProps) => {
        const cn = useCn();
        return (
            <thead
                class={cn("sd-md-thead", className)}
                data-streamdown="table-header"
                {...props}
            >
                {children}
            </thead>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoThead.displayName = "MarkdownThead";

type TbodyProps = WithNode<JSX.IntrinsicElements["tbody"]>;
const MemoTbody = memo<TbodyProps>(
    ({ children, className, node, ...props }: TbodyProps) => {
        const cn = useCn();
        return (
            <tbody
                class={cn("sd-md-tbody", className)}
                data-streamdown="table-body"
                {...props}
            >
                {children}
            </tbody>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoTbody.displayName = "MarkdownTbody";

type TrProps = WithNode<JSX.IntrinsicElements["tr"]>;
const MemoTr = memo<TrProps>(
    ({ children, className, node, ...props }: TrProps) => {
        const cn = useCn();
        return (
            <tr
                class={cn("sd-md-tr", className)}
                data-streamdown="table-row"
                {...props}
            >
                {children}
            </tr>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoTr.displayName = "MarkdownTr";

type ThProps = WithNode<JSX.IntrinsicElements["th"]>;
const MemoTh = memo<ThProps>(
    ({ children, className, node, ...props }: ThProps) => {
        const cn = useCn();
        return (
            <th
                class={cn("sd-md-th", className)}
                data-streamdown="table-header-cell"
                {...props}
            >
                {children}
            </th>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoTh.displayName = "MarkdownTh";

type TdProps = WithNode<JSX.IntrinsicElements["td"]>;
const MemoTd = memo<TdProps>(
    ({ children, className, node, ...props }: TdProps) => {
        const cn = useCn();
        return (
            <td
                class={cn("sd-md-td", className)}
                data-streamdown="table-cell"
                {...props}
            >
                {children}
            </td>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoTd.displayName = "MarkdownTd";

type BlockquoteProps = WithNode<JSX.IntrinsicElements["blockquote"]>;
const MemoBlockquote = memo<BlockquoteProps>(
    ({ children, className, node, ...props }: BlockquoteProps) => {
        const cn = useCn();
        return (
            <blockquote
                class={cn("sd-md-blockquote", className)}
                data-streamdown="blockquote"
                {...props}
            >
                {children}
            </blockquote>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoBlockquote.displayName = "MarkdownBlockquote";

type SupProps = WithNode<JSX.IntrinsicElements["sup"]>;
const MemoSup = memo<SupProps>(
    ({ children, className, node, ...props }: SupProps) => {
        const cn = useCn();
        return (
            <sup
                class={cn("sd-md-sup", className)}
                data-streamdown="superscript"
                {...props}
            >
                {children}
            </sup>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoSup.displayName = "MarkdownSup";

type SubProps = WithNode<JSX.IntrinsicElements["sub"]>;
const MemoSub = memo<SubProps>(
    ({ children, className, node, ...props }: SubProps) => {
        const cn = useCn();
        return (
            <sub
                class={cn("sd-md-sub", className)}
                data-streamdown="subscript"
                {...props}
            >
                {children}
            </sub>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoSub.displayName = "MarkdownSub";

type SectionProps = WithNode<JSX.IntrinsicElements["section"]>;
const MemoSection = memo<SectionProps>(
    ({ children, className, node, ...props }: SectionProps) => {
        // Check if this is a footnotes section
        const isFootnotesSection = "data-footnotes" in props;

        if (isFootnotesSection) {
            // Filter out empty footnote list items (those with only the backref link)
            // This happens during streaming when footnote definitions haven't fully arrived

            // Helper to check if a node is empty (only contains backref)
            // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex footnote validation logic with multiple edge cases"
            const isEmptyFootnote = (listItem: JSX.Element): boolean => {
                if (!isValidElement(listItem)) {
                    return false;
                }

                const itemChildren = Array.isArray(listItem.props.children)
                    ? listItem.props.children
                    : [listItem.props.children];

                // Check if all children are either whitespace or backref links
                let hasContent = false;
                let hasBackref = false;

                for (const itemChild of itemChildren) {
                    if (!itemChild) {
                        continue;
                    }

                    if (typeof itemChild === "string") {
                        // If there's non-whitespace text, it has content
                        if (itemChild.trim() !== "") {
                            hasContent = true;
                        }
                    } else if (isValidElement(itemChild)) {
                        // Check if it's a backref link
                        if (
                            itemChild.props?.["data-footnote-backref"] !==
                            undefined
                        ) {
                            hasBackref = true;
                        } else {
                            // It's some other element (like <p>), which means it has content
                            // But we need to check if the <p> has actual content
                            const grandChildren = Array.isArray(
                                itemChild.props.children,
                            )
                                ? itemChild.props.children
                                : [itemChild.props.children];

                            for (const grandChild of grandChildren) {
                                if (
                                    typeof grandChild === "string" &&
                                    grandChild.trim() !== ""
                                ) {
                                    hasContent = true;
                                    break;
                                }
                                if (
                                    isValidElement(grandChild) &&
                                    grandChild.props?.[
                                        "data-footnote-backref"
                                    ] === undefined
                                ) {
                                    // If it's not a backref link, it's content
                                    hasContent = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // It's empty if it only has a backref and no other content
                return hasBackref && !hasContent;
            };

            // Process children to filter out empty footnotes
            const processedChildren = Array.isArray(children)
                ? children.map((child) => {
                      if (!isValidElement(child)) {
                          return child;
                      }

                      // If this is an <ol> containing footnote list items
                      if (child.type === MemoOl) {
                          const listChildren = Array.isArray(
                              child.props.children,
                          )
                              ? child.props.children
                              : [child.props.children];

                          const filteredListChildren = listChildren.filter(
                              (listItem: JSX.Element) =>
                                  !isEmptyFootnote(listItem),
                          );

                          // If all footnotes are empty, return null
                          if (filteredListChildren.length === 0) {
                              return null;
                          }

                          // Clone the <ol> with filtered children
                          return {
                              ...child,
                              props: {
                                  ...child.props,
                                  children: filteredListChildren,
                              },
                          };
                      }

                      return child;
                  })
                : children;

            // Check if we filtered out all content
            const hasAnyContent = Array.isArray(processedChildren)
                ? processedChildren.some((child) => child !== null)
                : processedChildren !== null;

            if (!hasAnyContent) {
                return null;
            }

            return (
                <section
                    class={className}
                    {...props}
                >
                    {processedChildren}
                </section>
            );
        }

        // For non-footnotes sections, render normally
        return (
            <section
                class={className}
                {...props}
            >
                {children}
            </section>
        );
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoSection.displayName = "MarkdownSection";

const CodeComponent = ({
    node,
    className,
    children,
    ...props
}: JSX.HTMLAttributes<HTMLElement> &
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Code component handles multiple rendering paths for inline code, code blocks, and mermaid diagrams"
    ExtraProps & { "data-block"?: string }) => {
    const cn = useCn();
    // A code element is block-level when it was inside a <pre> element.
    // The custom pre component marks its children with data-block.
    const inline = !("data-block" in props);
    const {
        mermaid: mermaidContext,
        controls: controlsConfig,
        lineNumbers: contextLineNumbers,
    } = useContext(StreamdownContext);
    const mermaidPlugin = useMermaidPlugin();
    const isBlockIncomplete = useIsCodeFenceIncomplete();

    const match = className?.match(LANGUAGE_REGEX);
    const language = match?.at(1) ?? "";
    const customRenderer = useCustomRenderer(language);

    if (inline) {
        return (
            <code
                class={cn("sd-md-inline-code", className)}
                data-streamdown="inline-code"
                {...props}
            >
                {children}
            </code>
        );
    }

    // Parse startLine from the code fence meta string (e.g. ```js startLine=10)
    const metastring = node?.properties?.metastring;
    const startLineMatch = metastring?.match(START_LINE_PATTERN);
    const parsedStartLine = startLineMatch
        ? Number.parseInt(startLineMatch[1], 10)
        : undefined;
    const startLine =
        parsedStartLine !== undefined && parsedStartLine >= 1
            ? parsedStartLine
            : undefined;

    // Parse noLineNumbers from meta string and derive effective lineNumbers
    const metaNoLineNumbers = metastring
        ? NO_LINE_NUMBERS_PATTERN.test(metastring)
        : false;
    const showLineNumbers = !metaNoLineNumbers && contextLineNumbers !== false;

    // Extract code content from children safely
    let code = "";
    if (
        isValidElement(children) &&
        children.props &&
        typeof children.props === "object" &&
        "children" in children.props &&
        typeof children.props.children === "string"
    ) {
        code = children.props.children;
    } else if (typeof children === "string") {
        code = children;
    }

    if (customRenderer) {
        const CustomComponent = customRenderer.component;
        return (
            <Suspense fallback={<CodeBlockSkeleton />}>
                <CustomComponent
                    code={code}
                    isIncomplete={isBlockIncomplete}
                    language={language}
                    meta={metastring}
                />
            </Suspense>
        );
    }

    if (language === "mermaid" && mermaidPlugin) {
        const showMermaidControls = shouldShowControls(
            controlsConfig,
            "mermaid",
        );
        const showDownload = shouldShowMermaidControl(
            controlsConfig,
            "download",
        );
        const showCopy = shouldShowMermaidControl(controlsConfig, "copy");
        const showFullscreen = shouldShowMermaidControl(
            controlsConfig,
            "fullscreen",
        );
        const showPanZoomControls = shouldShowMermaidControl(
            controlsConfig,
            "panZoom",
        );

        const shouldShowMermaidControls =
            showMermaidControls && (showDownload || showCopy || showFullscreen);

        return (
            <Suspense fallback={<CodeBlockSkeleton />}>
                <div
                    class={cn("sd-mermaid-block", className)}
                    data-streamdown="mermaid-block"
                >
                    <div class={cn("sd-mermaid-block-header")}>
                        <span class={cn("sd-mermaid-block-label")}>
                            mermaid
                        </span>
                    </div>
                    {shouldShowMermaidControls ? (
                        <div class={cn("sd-mermaid-controls-wrap")}>
                            <div
                                class={cn("sd-mermaid-controls")}
                                data-streamdown="mermaid-block-actions"
                            >
                                {showDownload ? (
                                    <MermaidDownloadDropdown
                                        chart={code}
                                        config={mermaidContext?.config}
                                    />
                                ) : null}
                                {showCopy ? (
                                    <CodeBlockCopyButton code={code} />
                                ) : null}
                                {showFullscreen ? (
                                    <MermaidFullscreenButton
                                        chart={code}
                                        config={mermaidContext?.config}
                                    />
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                    <div class={cn("sd-mermaid-content")}>
                        <Mermaid
                            chart={code}
                            config={mermaidContext?.config}
                            showControls={showPanZoomControls}
                        />
                    </div>
                </div>
            </Suspense>
        );
    }

    const showCodeControls = shouldShowControls(controlsConfig, "code");
    const showDownload = shouldShowCodeControl(controlsConfig, "download");
    const showCopy = shouldShowCodeControl(controlsConfig, "copy");

    return (
        <CodeBlock
            class={className}
            code={code}
            isIncomplete={isBlockIncomplete}
            language={language}
            lineNumbers={showLineNumbers}
            startLine={startLine}
        >
            {showCodeControls ? (
                <>
                    {showDownload ? (
                        <CodeBlockDownloadButton
                            code={code}
                            language={language}
                        />
                    ) : null}
                    {showCopy ? <CodeBlockCopyButton /> : null}
                </>
            ) : null}
        </CodeBlock>
    );
};

const MemoCode = memo<JSX.HTMLAttributes<HTMLElement> & ExtraProps>(
    CodeComponent,
    (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoCode.displayName = "MarkdownCode";

const MemoImg = memo<JSX.ImgHTMLAttributes<HTMLImageElement> & ExtraProps>(
    ImageComponent,
    (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);

MemoImg.displayName = "MarkdownImg";

type ParagraphProps = WithNode<JSX.IntrinsicElements["p"]>;
const MemoParagraph = memo<ParagraphProps>(
    ({ children, node, ...props }: ParagraphProps) => {
        // Check if the paragraph contains only an image element
        // If so, render the image directly without the <p> wrapper to avoid hydration errors
        // (since our ImageComponent returns a <div>, which cannot be nested inside <p>)

        // Handle both array and single child cases
        const childArray = Array.isArray(children) ? children : [children];

        // Filter out null/undefined/empty values
        const validChildren = childArray.filter(
            (child) => child !== null && child !== undefined && child !== "",
        );

        // Check if there's exactly one child and it's a block-level element
        // (image or block code) to avoid wrapping in <p> which causes hydration errors
        if (validChildren.length === 1 && isValidElement(validChildren[0])) {
            const node = (validChildren[0].props as { node?: MarkdownNode })
                .node;
            const tagName = node?.tagName;

            // Image: renders as <div>, cannot be nested in <p>
            if (tagName === "img") {
                return <>{children}</>;
            }

            // Block code: renders as <div>, cannot be nested in <p>
            // Check if it's block code via the data-block marker set by the pre component
            if (tagName === "code") {
                const childProps = validChildren[0].props as Record<
                    string,
                    unknown
                >;
                if ("data-block" in childProps) {
                    return <>{children}</>;
                }
            }
        }

        return <p {...props}>{children}</p>;
    },
    (p, n) => sameClassAndNode(p, n),
);
MemoParagraph.displayName = "MarkdownParagraph";

export const components: Options["components"] = {
    ol: MemoOl,
    li: MemoLi,
    ul: MemoUl,
    hr: MemoHr,
    strong: MemoStrong,
    a: MemoA,
    h1: MemoH1,
    h2: MemoH2,
    h3: MemoH3,
    h4: MemoH4,
    h5: MemoH5,
    h6: MemoH6,
    table: MemoTable,
    thead: MemoThead,
    tbody: MemoTbody,
    tr: MemoTr,
    th: MemoTh,
    td: MemoTd,
    blockquote: MemoBlockquote,
    code: MemoCode,
    img: MemoImg,
    pre: ({ children }) => {
        if (isValidElement(children)) {
            return cloneElement(children, { "data-block": "true" });
        }
        return children;
    },
    sup: MemoSup,
    sub: MemoSub,
    p: MemoParagraph,
    section: MemoSection,
};

import {
    createMemo,
    createSignal,
    type JSX,
    lazy,
    Suspense,
    splitProps,
    useContext,
} from "solid-js";
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
const LANGUAGE_REGEX = /language-([^\s]+)/;

const Mermaid = lazy(() =>
    import("./mermaid").then((mod) => ({ default: mod.Mermaid })),
);

interface MarkdownPoint {
    column?: number;
    line?: number;
}

interface MarkdownPosition {
    end?: MarkdownPoint;
    start?: MarkdownPoint;
}

interface MarkdownNode {
    tagName?: string;
    position?: MarkdownPosition;
    properties?: {
        class?: string | string[];
        metastring?: string;
        [key: string]: unknown;
    };
}

type WithNode<T> = T & {
    node?: MarkdownNode;
    children?: JSX.Element;
    class?: string;
};

type SolidLikeElement = {
    props: Record<string, unknown>;
    type?: unknown;
};

const isValidElement = (value: unknown): value is SolidLikeElement =>
    typeof value === "object" && value !== null && "props" in value;

const toArray = (children: JSX.Element): JSX.Element[] =>
    Array.isArray(children) ? children : [children];

const hasRenderableValue = (child: JSX.Element): boolean =>
    child !== null && child !== undefined && child !== "" && child !== false;

const getChildNode = (child: JSX.Element): MarkdownNode | undefined => {
    if (!isValidElement(child)) {
        return undefined;
    }

    return (child.props as { node?: MarkdownNode }).node;
};

const Ol = (props: WithNode<JSX.IntrinsicElements["ol"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <ol
            class={cn("sd-md-ol", localProps.class)}
            data-streamdown="ordered-list"
            {...restProps}
        >
            {localProps.children}
        </ol>
    );
};

const Li = (props: WithNode<JSX.IntrinsicElements["li"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <li
            class={cn("sd-md-li", localProps.class)}
            data-streamdown="list-item"
            {...restProps}
        >
            {localProps.children}
        </li>
    );
};

const Ul = (props: WithNode<JSX.IntrinsicElements["ul"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <ul
            class={cn("sd-md-ul", localProps.class)}
            data-streamdown="unordered-list"
            {...restProps}
        >
            {localProps.children}
        </ul>
    );
};

const Hr = (props: WithNode<JSX.IntrinsicElements["hr"]>) => {
    const [localProps, restProps] = splitProps(props, ["class", "node"]);
    const cn = useCn();
    return (
        <hr
            class={cn("sd-md-hr", localProps.class)}
            data-streamdown="horizontal-rule"
            {...restProps}
        />
    );
};

const Strong = (props: WithNode<JSX.IntrinsicElements["span"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <span
            class={cn("sd-md-strong", localProps.class)}
            data-streamdown="strong"
            {...restProps}
        >
            {localProps.children}
        </span>
    );
};

const H1 = (props: WithNode<JSX.IntrinsicElements["h1"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h1
            class={cn("sd-md-h1", localProps.class)}
            data-streamdown="heading-1"
            {...restProps}
        >
            {localProps.children}
        </h1>
    );
};

const H2 = (props: WithNode<JSX.IntrinsicElements["h2"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h2
            class={cn("sd-md-h2", localProps.class)}
            data-streamdown="heading-2"
            {...restProps}
        >
            {localProps.children}
        </h2>
    );
};

const H3 = (props: WithNode<JSX.IntrinsicElements["h3"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h3
            class={cn("sd-md-h3", localProps.class)}
            data-streamdown="heading-3"
            {...restProps}
        >
            {localProps.children}
        </h3>
    );
};

const H4 = (props: WithNode<JSX.IntrinsicElements["h4"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h4
            class={cn("sd-md-h4", localProps.class)}
            data-streamdown="heading-4"
            {...restProps}
        >
            {localProps.children}
        </h4>
    );
};

const H5 = (props: WithNode<JSX.IntrinsicElements["h5"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h5
            class={cn("sd-md-h5", localProps.class)}
            data-streamdown="heading-5"
            {...restProps}
        >
            {localProps.children}
        </h5>
    );
};

const H6 = (props: WithNode<JSX.IntrinsicElements["h6"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <h6
            class={cn("sd-md-h6", localProps.class)}
            data-streamdown="heading-6"
            {...restProps}
        >
            {localProps.children}
        </h6>
    );
};

const Thead = (props: WithNode<JSX.IntrinsicElements["thead"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <thead
            class={cn("sd-md-thead", localProps.class)}
            data-streamdown="table-header"
            {...restProps}
        >
            {localProps.children}
        </thead>
    );
};

const Tbody = (props: WithNode<JSX.IntrinsicElements["tbody"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <tbody
            class={cn("sd-md-tbody", localProps.class)}
            data-streamdown="table-body"
            {...restProps}
        >
            {localProps.children}
        </tbody>
    );
};

const Tr = (props: WithNode<JSX.IntrinsicElements["tr"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <tr
            class={cn("sd-md-tr", localProps.class)}
            data-streamdown="table-row"
            {...restProps}
        >
            {localProps.children}
        </tr>
    );
};

const Th = (props: WithNode<JSX.IntrinsicElements["th"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <th
            class={cn("sd-md-th", localProps.class)}
            data-streamdown="table-header-cell"
            {...restProps}
        >
            {localProps.children}
        </th>
    );
};

const Td = (props: WithNode<JSX.IntrinsicElements["td"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <td
            class={cn("sd-md-td", localProps.class)}
            data-streamdown="table-cell"
            {...restProps}
        >
            {localProps.children}
        </td>
    );
};

const Blockquote = (props: WithNode<JSX.IntrinsicElements["blockquote"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <blockquote
            class={cn("sd-md-blockquote", localProps.class)}
            data-streamdown="blockquote"
            {...restProps}
        >
            {localProps.children}
        </blockquote>
    );
};

const Sup = (props: WithNode<JSX.IntrinsicElements["sup"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <sup
            class={cn("sd-md-sup", localProps.class)}
            data-streamdown="superscript"
            {...restProps}
        >
            {localProps.children}
        </sup>
    );
};

const Sub = (props: WithNode<JSX.IntrinsicElements["sub"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const cn = useCn();
    return (
        <sub
            class={cn("sd-md-sub", localProps.class)}
            data-streamdown="subscript"
            {...restProps}
        >
            {localProps.children}
        </sub>
    );
};

const shouldShowControls = (
    config: ControlsConfig,
    type: "table" | "code" | "mermaid",
): boolean => {
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

type AProps = WithNode<JSX.IntrinsicElements["a"]> & { href?: string };

const LinkComponent = (props: AProps) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "href",
        "node",
    ]);
    const cn = useCn();
    const { linkSafety } = useContext(StreamdownContext);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const isIncomplete = () => localProps.href === "streamdown:incomplete-link";

    const handleClick = async (e: MouseEvent) => {
        if (!(linkSafety?.enabled && localProps.href) || isIncomplete()) {
            return;
        }

        e.preventDefault();

        if (linkSafety.onLinkCheck) {
            const isAllowed = await linkSafety.onLinkCheck(localProps.href);
            if (isAllowed) {
                window.open(localProps.href, "_blank", "noreferrer");
                return;
            }
        }

        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        if (localProps.href) {
            window.open(localProps.href, "_blank", "noreferrer");
        }
    };

    const modalProps = createMemo(() => ({
        url: localProps.href ?? "",
        isOpen: isModalOpen(),
        onClose: () => setIsModalOpen(false),
        onConfirm: handleConfirm,
    }));

    if (linkSafety?.enabled && localProps.href) {
        return (
            <>
                <button
                    class={cn("sd-md-link-button", localProps.class)}
                    data-incomplete={isIncomplete()}
                    data-streamdown="link"
                    onClick={handleClick}
                    type="button"
                >
                    {localProps.children}
                </button>
                {linkSafety.renderModal ? (
                    linkSafety.renderModal(modalProps())
                ) : (
                    <LinkSafetyModal {...modalProps()} />
                )}
            </>
        );
    }

    return (
        <a
            class={cn("sd-md-link", localProps.class)}
            data-incomplete={isIncomplete()}
            data-streamdown="link"
            href={localProps.href}
            rel="noreferrer"
            target="_blank"
            {...restProps}
        >
            {localProps.children}
        </a>
    );
};

const TableComponent = (props: WithNode<JSX.IntrinsicElements["table"]>) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);
    const { controls: controlsConfig } = useContext(StreamdownContext);

    return (
        <Table
            class={localProps.class}
            showControls={shouldShowControls(controlsConfig, "table")}
            showCopy={shouldShowTableControl(controlsConfig, "copy")}
            showDownload={shouldShowTableControl(controlsConfig, "download")}
            showFullscreen={shouldShowTableControl(
                controlsConfig,
                "fullscreen",
            )}
            {...restProps}
        >
            {localProps.children}
        </Table>
    );
};

const SectionComponent = (
    props: WithNode<JSX.IntrinsicElements["section"]>,
) => {
    const [localProps, restProps] = splitProps(props, [
        "children",
        "class",
        "node",
    ]);

    const isFootnotesSection = "data-footnotes" in restProps;

    if (!isFootnotesSection) {
        return (
            <section
                class={localProps.class}
                {...restProps}
            >
                {localProps.children}
            </section>
        );
    }

    const isEmptyFootnote = (listItem: JSX.Element): boolean => {
        if (!isValidElement(listItem)) {
            return false;
        }

        const itemChildren = toArray(listItem.props.children as JSX.Element);
        let hasContent = false;
        let hasBackref = false;

        for (const itemChild of itemChildren) {
            if (!hasRenderableValue(itemChild)) {
                continue;
            }

            if (typeof itemChild === "string") {
                if (itemChild.trim() !== "") {
                    hasContent = true;
                }
                continue;
            }

            if (!isValidElement(itemChild)) {
                hasContent = true;
                continue;
            }

            if (itemChild.props?.["data-footnote-backref"] !== undefined) {
                hasBackref = true;
                continue;
            }

            const grandChildren = toArray(
                itemChild.props.children as JSX.Element,
            );

            for (const grandChild of grandChildren) {
                if (!hasRenderableValue(grandChild)) {
                    continue;
                }

                if (typeof grandChild === "string") {
                    if (grandChild.trim() !== "") {
                        hasContent = true;
                        break;
                    }
                    continue;
                }

                if (
                    isValidElement(grandChild) &&
                    grandChild.props?.["data-footnote-backref"] !== undefined
                ) {
                    hasBackref = true;
                    continue;
                }

                hasContent = true;
                break;
            }
        }

        return hasBackref && !hasContent;
    };

    const processedChildren = createMemo(() => {
        return toArray(localProps.children).map((child) => {
            if (!isValidElement(child)) {
                return child;
            }

            const childNode = getChildNode(child);
            const tagName = childNode?.tagName;

            if (tagName !== "ol") {
                return child;
            }

            const listChildren = toArray(child.props.children as JSX.Element);
            const filteredListChildren = listChildren.filter(
                (listItem) => !isEmptyFootnote(listItem),
            );

            if (filteredListChildren.length === 0) {
                return null;
            }

            return (
                <Ol {...(child.props as WithNode<JSX.IntrinsicElements["ol"]>)}>
                    {filteredListChildren}
                </Ol>
            );
        });
    });

    const hasAnyContent = createMemo(() =>
        processedChildren().some((child) => child !== null),
    );

    if (!hasAnyContent()) {
        return null;
    }

    return (
        <section
            class={localProps.class}
            {...restProps}
        >
            {processedChildren()}
        </section>
    );
};

const extractCodeText = (children: JSX.Element): string => {
    if (
        isValidElement(children) &&
        typeof children.props === "object" &&
        typeof children.props.children === "string"
    ) {
        return children.props.children;
    }

    if (typeof children === "string") {
        return children;
    }

    return "";
};

const CodeComponent = (
    props: JSX.HTMLAttributes<HTMLElement> &
        ExtraProps & {
            "data-block"?: string;
        },
) => {
    const [localProps, restProps] = splitProps(props, [
        "node",
        "class",
        "children",
    ]);
    const cn = useCn();
    const inline = !("data-block" in restProps);
    const {
        mermaid: mermaidContext,
        controls: controlsConfig,
        lineNumbers: contextLineNumbers,
    } = useContext(StreamdownContext);
    const mermaidPlugin = useMermaidPlugin();
    const isBlockIncomplete = useIsCodeFenceIncomplete();

    const language = createMemo(() => {
        const match = localProps.class?.match(LANGUAGE_REGEX);
        return match?.at(1) ?? "";
    });

    const customRenderer = createMemo(() => useCustomRenderer(language()));

    if (inline) {
        return (
            <code
                class={cn("sd-md-inline-code", localProps.class)}
                data-streamdown="inline-code"
                {...restProps}
            >
                {localProps.children}
            </code>
        );
    }

    const metastring = createMemo(() => {
        const value = localProps.node?.properties?.metastring;
        return typeof value === "string" ? value : undefined;
    });

    const startLine = createMemo(() => {
        const value = metastring();
        const startLineMatch = value?.match(START_LINE_PATTERN);
        const startLineValue = startLineMatch?.[1];

        if (!startLineValue) {
            return undefined;
        }

        const parsedStartLine = Number.parseInt(startLineValue, 10);

        return parsedStartLine >= 1 ? parsedStartLine : undefined;
    });

    const showLineNumbers = createMemo(() => {
        const metaNoLineNumbers = metastring()
            ? NO_LINE_NUMBERS_PATTERN.test(metastring() ?? "")
            : false;

        return !metaNoLineNumbers && contextLineNumbers !== false;
    });

    const code = createMemo(() => extractCodeText(localProps.children));

    if (customRenderer()) {
        const CustomComponent = customRenderer()?.component;

        return (
            <Suspense fallback={<CodeBlockSkeleton />}>
                {CustomComponent ? (
                    <CustomComponent
                        code={code()}
                        isIncomplete={isBlockIncomplete}
                        language={language()}
                        meta={metastring()}
                    />
                ) : null}
            </Suspense>
        );
    }

    if (language() === "mermaid" && mermaidPlugin) {
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
                    class={cn("sd-mermaid-block", localProps.class)}
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
                                        chart={code()}
                                        config={mermaidContext?.config}
                                    />
                                ) : null}
                                {showCopy ? (
                                    <CodeBlockCopyButton code={code()} />
                                ) : null}
                                {showFullscreen ? (
                                    <MermaidFullscreenButton
                                        chart={code()}
                                        config={mermaidContext?.config}
                                    />
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                    <div class={cn("sd-mermaid-content")}>
                        <Mermaid
                            chart={code()}
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
            class={localProps.class}
            code={code()}
            isIncomplete={isBlockIncomplete}
            language={language()}
            lineNumbers={showLineNumbers()}
            startLine={startLine()}
        >
            {showCodeControls ? (
                <>
                    {showDownload ? (
                        <CodeBlockDownloadButton
                            code={code()}
                            language={language()}
                        />
                    ) : null}
                    {showCopy ? <CodeBlockCopyButton code={code()} /> : null}
                </>
            ) : null}
        </CodeBlock>
    );
};

const ParagraphComponent = (props: WithNode<JSX.IntrinsicElements["p"]>) => {
    const [localProps, restProps] = splitProps(props, ["children", "node"]);

    const validChildren = createMemo(() =>
        toArray(localProps.children).filter(hasRenderableValue),
    );

    if (validChildren().length === 1) {
        const onlyChild = validChildren()[0];
        const node = getChildNode(onlyChild);

        if (node?.tagName === "img") {
            return <>{localProps.children}</>;
        }

        if (node?.tagName === "code" && isValidElement(onlyChild)) {
            const childProps = onlyChild.props as Record<string, unknown>;
            if ("data-block" in childProps) {
                return <>{localProps.children}</>;
            }
        }
    }

    return <p {...restProps}>{localProps.children}</p>;
};

const PreComponent = (props: WithNode<JSX.IntrinsicElements["pre"]>) => {
    const [localProps] = splitProps(props, ["children"]);
    const children = localProps.children;

    if (!isValidElement(children)) {
        return <>{children}</>;
    }

    const childProps = children.props as JSX.HTMLAttributes<HTMLElement> &
        ExtraProps;

    return (
        <CodeComponent
            {...childProps}
            data-block="true"
        />
    );
};

export const components: Options["components"] = {
    ol: Ol,
    li: Li,
    ul: Ul,
    hr: Hr,
    strong: Strong,
    a: LinkComponent,
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    table: TableComponent,
    thead: Thead,
    tbody: Tbody,
    tr: Tr,
    th: Th,
    td: Td,
    blockquote: Blockquote,
    code: CodeComponent,
    img: ImageComponent,
    pre: PreComponent,
    sup: Sup,
    sub: Sub,
    p: ParagraphComponent,
    section: SectionComponent,
};

import type { JSX } from "solid-js";
import { createSignal, onMount } from "solid-js";
import { useIcons } from "./icon-context";
import type { ExtraProps } from "./markdown";
import "./streamdown-ui.css";
import { useTranslations } from "./translations-context";
import { cn, save } from "./utils";

const fileExtensionPattern = /\.[^/.]+$/;

type ImageComponentProps = JSX.ImgHTMLAttributes<HTMLImageElement> &
    ExtraProps & {
        className?: string;
    };

export const ImageComponent = ({
    node,
    className,
    src,
    alt,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...props
}: ImageComponentProps) => {
    const { DownloadIcon } = useIcons();
    let imgRef: HTMLImageElement | undefined;
    const [imageLoaded, setImageLoaded] = createSignal(false);
    const [imageError, setImageError] = createSignal(false);
    const t = useTranslations();

    const hasExplicitDimensions = props.width != null || props.height != null;
    const showDownload = () =>
        (imageLoaded() || hasExplicitDimensions) && !imageError();
    const showFallback = () => imageError() && !hasExplicitDimensions;

    // Handle images already complete before React attaches event handlers (e.g. cached or SSR hydration)
    onMount(() => {
        const img = imgRef;
        if (img?.complete) {
            const loaded = img.naturalWidth > 0;
            setImageLoaded(loaded);
            setImageError(!loaded);
        }
    });

    const handleLoad: JSX.EventHandler<HTMLImageElement, Event> = (event) => {
        setImageLoaded(true);
        setImageError(false);
        onLoadProp?.(event);
    };

    const handleError: JSX.EventHandler<HTMLImageElement, Event> = (event) => {
        setImageLoaded(false);
        setImageError(true);
        onErrorProp?.(event);
    };

    const downloadImage = async () => {
        /* v8 ignore next */
        if (!src) {
            return;
        }

        try {
            const response = await fetch(src);
            const blob = await response.blob();

            // Extract filename from URL or use alt text with proper extension
            const urlPath = new URL(src, window.location.origin).pathname;
            const originalFilename = urlPath.split("/").pop() || "";
            const extension = originalFilename.split(".").pop();
            const hasExtension =
                originalFilename.includes(".") &&
                extension !== undefined &&
                extension.length <= 4;

            let filename = "";

            if (hasExtension) {
                filename = originalFilename;
            } else {
                // Determine extension from blob type
                const mimeType = blob.type;
                let fileExtension = "png"; // default

                if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
                    fileExtension = "jpg";
                } else if (mimeType.includes("png")) {
                    fileExtension = "png";
                } else if (mimeType.includes("svg")) {
                    fileExtension = "svg";
                } else if (mimeType.includes("gif")) {
                    fileExtension = "gif";
                } else if (mimeType.includes("webp")) {
                    fileExtension = "webp";
                }

                const baseName = alt || originalFilename || "image";
                filename = `${baseName.replace(fileExtensionPattern, "")}.${fileExtension}`;
            }

            save(filename, blob, blob.type);
        } catch {
            // CORS fallback: open image in new tab for manual save
            window.open(src, "_blank");
        }
    };

    if (!src) {
        return null;
    }

    return (
        <div
            class="sd-image-wrapper"
            data-streamdown="image-wrapper"
        >
            <img
                alt={alt}
                class={cn(
                    "sd-image",
                    showFallback() && "sd-image--hidden",
                    className,
                )}
                data-streamdown="image"
                onError={handleError}
                onLoad={handleLoad}
                ref={imgRef}
                src={src}
                {...props}
            />
            {showFallback() && (
                <span
                    class="sd-image-fallback"
                    data-streamdown="image-fallback"
                >
                    {t.imageNotAvailable}
                </span>
            )}
            <div class="sd-image-overlay" />
            {showDownload() && (
                <button
                    class="sd-image-download"
                    onClick={downloadImage}
                    title={t.downloadImage}
                    type="button"
                >
                    <DownloadIcon size={14} />
                </button>
            )}
        </div>
    );
};

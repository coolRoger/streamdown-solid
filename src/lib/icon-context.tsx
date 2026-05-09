"use client";

import {
    type Component,
    createContext,
    createMemo,
    type JSX,
    type ParentProps,
    useContext,
} from "solid-js";
import {
    CheckIcon,
    CopyIcon,
    DownloadIcon,
    ExternalLinkIcon,
    Loader2Icon,
    Maximize2Icon,
    RotateCcwIcon,
    XIcon,
    ZoomInIcon,
    ZoomOutIcon,
} from "./icons";

export type IconComponent = Component<
    JSX.SvgSVGAttributes<SVGSVGElement> & { size?: number }
>;

export interface IconMap {
    CheckIcon: IconComponent;
    CopyIcon: IconComponent;
    DownloadIcon: IconComponent;
    ExternalLinkIcon: IconComponent;
    Loader2Icon: IconComponent;
    Maximize2Icon: IconComponent;
    RotateCcwIcon: IconComponent;
    XIcon: IconComponent;
    ZoomInIcon: IconComponent;
    ZoomOutIcon: IconComponent;
}

export const defaultIcons: IconMap = {
    CheckIcon,
    CopyIcon,
    DownloadIcon,
    ExternalLinkIcon,
    Loader2Icon,
    Maximize2Icon,
    RotateCcwIcon,
    XIcon,
    ZoomInIcon,
    ZoomOutIcon,
};

export const IconContext = createContext<IconMap>(defaultIcons);

export const IconProvider = (
    props: ParentProps<{ icons?: Partial<IconMap> }>,
) => {
    const value = createMemo<IconMap>(() => {
        const icons = props.icons;
        return icons ? { ...defaultIcons, ...icons } : defaultIcons;
    });

    return (
        <IconContext.Provider value={value()}>
            {props.children}
        </IconContext.Provider>
    );
};

export const useIcons = () => useContext(IconContext);

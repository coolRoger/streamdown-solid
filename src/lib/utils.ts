export type ClassValue =
    | string
    | false
    | null
    | undefined
    | Record<string, boolean>
    | ClassValue[];

export type CnFunction = (...inputs: ClassValue[]) => string;

const normalizeClassValue = (value: ClassValue): string[] => {
    if (!value) {
        return [];
    }
    if (typeof value === "string") {
        return value.split(/\s+/).filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.flatMap(normalizeClassValue);
    }
    return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);
};

export const cn: CnFunction = (...inputs) =>
    inputs.flatMap(normalizeClassValue).join(" ");

export const save = (
    filename: string,
    content: string | Blob,
    mimeType: string,
) => {
    // Prepend UTF-8 BOM for CSV so Excel on Windows correctly detects the encoding.
    // Without it, Excel falls back to the system ANSI codepage and corrupts non-ASCII text.
    const bom =
        typeof content === "string" && mimeType.startsWith("text/csv")
            ? "\uFEFF"
            : "";
    const blob =
        typeof content === "string"
            ? new Blob([bom + content], { type: mimeType })
            : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

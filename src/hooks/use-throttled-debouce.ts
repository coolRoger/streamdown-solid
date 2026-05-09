import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

export const useThrottledDebounce = <T>(
    value: Accessor<T>,
    throttleMs = 200,
    debounceMs = 50,
): Accessor<T> => {
    const [processedValue, setProcessedValue] = createSignal(value());
    let lastRunTime = 0;
    let timeoutRef: ReturnType<typeof setTimeout> | null = null;

    createEffect(() => {
        const nextValue = value();
        const now = Date.now();
        const timeSinceLastRun = now - lastRunTime;

        // Clear any pending debounce
        if (timeoutRef !== null) {
            clearTimeout(timeoutRef);
            timeoutRef = null;
        }

        // If enough time has passed, run immediately (throttle)
        if (timeSinceLastRun >= throttleMs) {
            setProcessedValue(() => nextValue);
            lastRunTime = now;
        } else {
            // Otherwise, debounce it
            timeoutRef = setTimeout(() => {
                setProcessedValue(() => nextValue);
                lastRunTime = Date.now();
                timeoutRef = null;
            }, debounceMs);
        }
    });

    onCleanup(() => {
        if (timeoutRef !== null) {
            clearTimeout(timeoutRef);
        }
    });

    return processedValue;
};

import { createEffect, createSignal, onCleanup } from "solid-js";

/**
 * Default debounce delay in milliseconds before checking if element is still in view
 */
export const DEFERRED_RENDER_DEBOUNCE_DELAY = 300;

/**
 * Default root margin for Intersection Observer
 * Starts rendering when element is 200px away from viewport
 */
export const DEFERRED_RENDER_ROOT_MARGIN = "300px";

/**
 * Default timeout for requestIdleCallback in milliseconds
 */
export const DEFERRED_RENDER_IDLE_TIMEOUT = 500;

export interface UseDeferredRenderOptions {
    /**
     * Debounce delay in milliseconds before checking if still in view
     * @default DEFERRED_RENDER_DEBOUNCE_DELAY
     */
    debounceDelay?: number;
    /**
     * Timeout for requestIdleCallback in milliseconds
     * @default DEFERRED_RENDER_IDLE_TIMEOUT
     */
    idleTimeout?: number;
    /**
     * If true, render immediately without waiting for intersection
     * @default false
     */
    immediate?: boolean;
    /**
     * Root margin for Intersection Observer (e.g., '200px' to start rendering 200px before entering viewport)
     * @default DEFERRED_RENDER_ROOT_MARGIN
     */
    rootMargin?: string;
}

/**
 * Hook for deferred rendering components when they enter the viewport.
 * Uses Intersection Observer + debounce + requestIdleCallback for optimal performance.
 *
 * @param options Configuration options
 * @returns Object containing `shouldRender` accessor and `containerRef` callback to attach to the element
 *
 * @example
 * ```tsx
 * const { shouldRender, containerRef } = useDeferredRender({ immediate: false })
 *
 * return (
 *   <div ref={containerRef}>
 *     {shouldRender() && <ExpensiveComponent />}
 *   </div>
 * )
 * ```
 */
export function useDeferredRender(options: UseDeferredRenderOptions = {}) {
    const {
        immediate = false,
        debounceDelay = DEFERRED_RENDER_DEBOUNCE_DELAY,
        rootMargin = DEFERRED_RENDER_ROOT_MARGIN,
        idleTimeout = DEFERRED_RENDER_IDLE_TIMEOUT,
    } = options;

    const [shouldRender, setShouldRender] = createSignal(false);
    const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
    let renderTimeoutRef: number | null = null;
    let idleCallbackRef: number | null = null;

    const requestIdleCallbackPolyfill = (
        callback: IdleRequestCallback,
    ): number => {
        const start = Date.now();
        return window.setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
            });
        }, 1);
    };

    const requestIdleCallbackWrapper = (
        callback: IdleRequestCallback,
        idleOptions?: IdleRequestOptions,
    ): number => {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, idleOptions);
        }
        return requestIdleCallbackPolyfill(callback);
    };

    const cancelIdleCallbackWrapper = (id: number): void => {
        if (window.cancelIdleCallback) {
            window.cancelIdleCallback(id);
            return;
        }
        window.clearTimeout(id);
    };

    createEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        // If immediate, render right away
        if (immediate) {
            setShouldRender(true);
            return;
        }

        const container = containerRef();
        /* v8 ignore next */
        if (!container) {
            return;
        }

        const clearPendingRenders = () => {
            if (renderTimeoutRef !== null) {
                window.clearTimeout(renderTimeoutRef);
                renderTimeoutRef = null;
            }
            if (idleCallbackRef !== null) {
                cancelIdleCallbackWrapper(idleCallbackRef);
                idleCallbackRef = null;
            }
        };

        const scheduleRender = (obs: IntersectionObserver) => {
            idleCallbackRef = requestIdleCallbackWrapper(
                (deadline) => {
                    // If we have time remaining or it's urgent, render
                    if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                        setShouldRender(true);
                        obs.disconnect();
                    } else {
                        // Otherwise, schedule again with shorter timeout
                        idleCallbackRef = requestIdleCallbackWrapper(
                            () => {
                                setShouldRender(true);
                                obs.disconnect();
                            },
                            { timeout: idleTimeout / 2 },
                        );
                    }
                },
                { timeout: idleTimeout },
            );
        };

        const handleIntersecting = (obs: IntersectionObserver) => {
            clearPendingRenders();

            // Debounce rendering: wait for debounceDelay, then check if still in view
            renderTimeoutRef = window.setTimeout(() => {
                // Re-check if element is still in viewport using observer records
                const records = obs.takeRecords();
                // If no records, element hasn't changed state (still intersecting)
                // If records exist, check the latest intersection state
                const isStillInView =
                    records.length === 0 ||
                    (records.at(-1)?.isIntersecting ?? false);

                if (isStillInView) {
                    scheduleRender(obs);
                }
            }, debounceDelay);
        };

        const handleIntersection = (
            entry: IntersectionObserverEntry,
            obs: IntersectionObserver,
        ) => {
            if (entry.isIntersecting) {
                handleIntersecting(obs);
            } else {
                clearPendingRenders();
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    handleIntersection(entry, observer);
                }
            },
            {
                rootMargin,
                threshold: 0,
            },
        );

        observer.observe(container);

        onCleanup(() => {
            clearPendingRenders();
            observer.disconnect();
        });
    });

    return {
        shouldRender,
        containerRef: setContainerRef,
    };
}

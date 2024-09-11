import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// MediaQueryList Event based useEventListener interface
function useEventListener<K extends keyof MediaQueryListEventMap>(
	eventName: K,
	handler: (event: MediaQueryListEventMap[K]) => void,
	element: RefObject<MediaQueryList>,
	options?: boolean | AddEventListenerOptions,
): void

// Window Event based useEventListener interface
function useEventListener<K extends keyof WindowEventMap>(
	eventName: K,
	handler: (event: WindowEventMap[K]) => void,
	element?: undefined,
	options?: boolean | AddEventListenerOptions,
): void

// Element Event based useEventListener interface
function useEventListener<
	K extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
	T extends Element = K extends keyof HTMLElementEventMap
		? HTMLDivElement
		: SVGElement,
>(
	eventName: K,
	handler:
		| ((event: HTMLElementEventMap[K]) => void)
		| ((event: SVGElementEventMap[K]) => void),
	element: RefObject<T>,
	options?: boolean | AddEventListenerOptions,
): void

// Document Event based useEventListener interface
function useEventListener<K extends keyof DocumentEventMap>(
	eventName: K,
	handler: (event: DocumentEventMap[K]) => void,
	element: RefObject<Document>,
	options?: boolean | AddEventListenerOptions,
): void

function useEventListener<
	KW extends keyof WindowEventMap,
	KH extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
	KM extends keyof MediaQueryListEventMap,
	T extends HTMLElement | SVGAElement | MediaQueryList = HTMLElement,
>(
	eventName: KW | KH | KM,
	handler: (
		event:
		| WindowEventMap[KW]
		| HTMLElementEventMap[KH]
		| SVGElementEventMap[KH]
		| MediaQueryListEventMap[KM]
		| Event,
	) => void,
	element?: RefObject<T>,
	options?: boolean | AddEventListenerOptions,
) {
	// Create a ref that stores handler
	const savedHandler = useRef(handler)

	useEffect(() => {
		savedHandler.current = handler
	}, [handler])

	useEffect(() => {
		// Define the listening target
		const targetElement: T | Window = element?.current ?? window

		if (!(targetElement && targetElement.addEventListener)) return

		// Create event listener that calls handler function stored in ref
		const listener: typeof handler = event => {
		savedHandler.current(event)
		}

		targetElement.addEventListener(eventName, listener, options)

		// Remove event listener on cleanup
		return () => {
		targetElement.removeEventListener(eventName, listener, options)
		}
	}, [eventName, element, options])
}
interface UseAnimationFrameOptions {
	/**
	 * Whether the animation frame should start immediately.
	 * @default true
	 */
	startImmediately?: boolean;
}

export { useEventListener };

export
function useAnimationFrame(
	callback: (deltaTime: number) => void,
	options: UseAnimationFrameOptions = { startImmediately: true },
): (() => void) {
	const requestRef = useRef<number>();
	const previousTimeRef = useRef<number>(performance.now());
	const callbackRef = useRef(callback);
	const isRunningRef = useRef<boolean>(false);
	
	// Update the callback ref when the callback prop changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);
	
	const animate = useCallback((timestamp: number) => {
		if (!isRunningRef.current) return;
	
		const currentTime = timestamp;
		const deltaTime = currentTime - previousTimeRef.current;
		previousTimeRef.current = currentTime;
	
		callbackRef.current(deltaTime);
	
		requestRef.current = requestAnimationFrame(animate);
	}, []);
	
	const toggleAnimation = useCallback(() => {
		if (isRunningRef.current) {
			cancelAnimationFrame(requestRef.current as number);
			isRunningRef.current = false;
		} else {
			previousTimeRef.current = performance.now();
			isRunningRef.current = true;
			requestRef.current = requestAnimationFrame(animate);
		}
	}, [animate]);
	
	useEffect(() => {
		if (options.startImmediately) {
		toggleAnimation();
		}
	
		return () => {
			if (isRunningRef.current) {
				cancelAnimationFrame(requestRef.current as number);
			}
		};
	}, [toggleAnimation, options.startImmediately]);
	
	return toggleAnimation;
}

export
function useInterval(callback: () => void, delay: number | null) {
	const savedCallback = useRef(callback)

	// Remember the latest callback if it changes.
	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the interval.
	useEffect(() => {
		// Don't schedule if no delay is specified.
		// Note: 0 is a valid value for delay.
		if (delay === null) {
			return
		}

		const id = setInterval(() => {
			savedCallback.current()
		}, delay)

		return () => {
			clearInterval(id)
		}
	}, [delay])
}
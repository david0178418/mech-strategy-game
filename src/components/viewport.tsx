import { useOnEntityAdded } from 'miniplex-react';
import { ECS } from '../state';
import { ReactNode, useRef, useState } from 'react';
import { useEventListener, useRequestAnimationFrame } from '../hooks';
import { MovingThingsQuery, SelectableQuery } from '../queries';
import { clamp } from '../utils';
import { MoveSystem } from '../systems';

const { world } = ECS;

interface Props {
	width: number;
	height: number;
	viewportWidth: number;
	viewportHeight: number;
	children: ReactNode;
	maxZoom: number;
	minZoom: number;
}

export
function Viewport(props: Props) {
	const {
		width,
		height,
		viewportWidth,
		viewportHeight,
		children,
		maxZoom,
		minZoom,
	} = props;
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const bodyRef = useRef(document.body);
	const [isDragging, setIsDragging] = useState(false);
	const [currentX, setCurrentX] = useState(-(width - viewportWidth)/2);
	const [currentY, setCurrentY] = useState(-(height - viewportHeight)/2);
	const [initialX, setInitialX] = useState(0);
	const [initialY, setInitialY] = useState(0);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const [mouseViewportX, setMouseViewportX] = useState(0);
	const [mouseViewportY, setMouseViewportY] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [zoomTarget, setZoomTarget] = useState(zoom);
	const zoomFactor = zoom/100;
	const maxX = (width * (zoomFactor - 1)) / 2;
	const minX = maxX + (viewportWidth - width * zoomFactor);
	const maxY = (height * (zoomFactor - 1)) / 2;
	const minY = maxY + (viewportHeight - height * zoomFactor);

	const X = clamp(currentX - offsetX, minX, maxX);
	const Y = clamp(currentY - offsetY, minY, maxY);

	useEventListener('mousedown', handleStartDragging, viewportRef);
	useEventListener('mousemove', handleMouseMove, viewportRef);
	useEventListener('mouseup', handleStopDragging, viewportRef);
	useEventListener('mouseout', handleMouseOut, bodyRef);
	useOnEntityAdded(MovingThingsQuery, MoveSystem);
	useEventListener('wheel', e => {
		e.preventDefault();
		setZoomTarget(
			clamp(
				zoom - (e.deltaY/10),
				minZoom,
				maxZoom,
			)
		);
	}, viewportRef);
	useRequestAnimationFrame((delta) => {
		const direction = (zoomTarget > zoom) ? 1 : -1;

		const newZoom = clamp(
			zoom + direction * Math.abs(zoom - zoomTarget) * delta,
			Math.max(minZoom, zoomTarget),
			Math.min(maxZoom, zoomTarget),
		);

		if(direction > 0) {
			setCurrentX(currentX + mouseViewportX * (1 - newZoom / zoom));
			setCurrentY(currentY + mouseViewportY * (1 - newZoom / zoom));
		}

		setZoom(newZoom);
	}, zoom !== zoomTarget);

	return (
		<div
			className="viewport"
			ref={viewportRef}
			style={{
				width: viewportWidth,
				height: viewportHeight,
			}}
		>
			<div
				className="stage"
				style={{
					width: width,
					height: height,
					translate: `${X}px ${Y}px`,
					scale: zoomFactor.toFixed(2),
					opacity: 1,
				}}
			>
				{children}
			</div>
		</div>
	);

	function handleMouseOut(ev: MouseEvent) {
		if(!isDragging) return;
		if(ev.currentTarget !== document.body) return;

		handleStopDragging(ev);
	}

	function handleStartDragging(ev: MouseEvent) {
		if(ev.button !== 0) return;

		setIsDragging(true);
		setInitialX(ev.clientX);
		setInitialY(ev.clientY);
	}

	function handleStopDragging(ev: MouseEvent) {
		if(ev.button === 2) {
			handleLeftClick(ev);
			return;
		}

		if(Math.abs(offsetX) < 10 && Math.abs(offsetY) < 10) {
			handleClick();
		} else {
			setCurrentX(
				clamp(currentX - offsetX, minX, maxX)
			);
			setCurrentY(
				clamp(currentY - offsetY, minY, maxY)
			);
		}

		setIsDragging(false);
		setInitialX(0);
		setInitialY(0);
		setOffsetX(0);
		setOffsetY(0);
	}

	function handleMouseMove(ev: MouseEvent) {
		if(!viewportRef.current) return;

		const rect = viewportRef.current.getBoundingClientRect();

		ev.preventDefault();

		setMouseViewportX(ev.clientX - rect.left - viewportWidth / 2);
		setMouseViewportY(ev.clientY - rect.top - viewportHeight / 2);

		if(!isDragging) return;

		const newX = initialX - ev.clientX;
		const newY = initialY - ev.clientY;

		setOffsetX(newX);
		setOffsetY(newY);

		setOffsetX(initialX - ev.clientX);
		setOffsetY(initialY - ev.clientY);
	}

	function handleLeftClick(ev: MouseEvent) {
		if(!(ev.target instanceof Element)) return;
	
		const rect = ev.target.getBoundingClientRect();
	
		SelectableQuery
			.entities
			.filter(e => e.selectable.selected)
			.map(e => {
				world.addComponent(e, 'movetarget', {
					x: (ev.clientX- rect.left) / zoomFactor,
					y: (ev.clientY - rect.top) / zoomFactor,
				})
			})
	}

	function handleClick() {
		SelectableQuery.entities.map(e => e.selectable.selected = false);
	}
}

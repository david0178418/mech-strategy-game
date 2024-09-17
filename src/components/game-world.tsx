import { useOnEntityAdded } from 'miniplex-react';
import { ECS } from '../state';
import { ReactNode, useRef, useState } from 'react';
import { useEventListener, useRequestAnimationFrame } from '../hooks';
import { MovingThingsQuery, RenderedQuery, SelectableQuery } from '../queries';
import { BasicEntity } from './basic-entity';
import { clamp } from '../utils';
import { MoveSystem } from '../systems';

const {
	Entities,
	world,
} = ECS;

interface Props {
	width: number;
	height: number;
	viewportWidth: number;
	viewportHeight: number;
}

export default
function GameWorld(props: Props) {
	const {
		width,
		height,
		viewportWidth,
		viewportHeight,
	} = props;

	return (
		<Viewport
			width={width}
			height={height}
			viewportHeight={viewportHeight}
			viewportWidth={viewportWidth}
		>
			<Entities in={RenderedQuery}>
				{e => <BasicEntity entity={e}/>}
			</Entities>
		</Viewport>
	);
}

interface StageProps {
	width: number;
	height: number;
	viewportWidth: number;
	viewportHeight: number;
	children: ReactNode;
}

function Viewport(props: StageProps) {
	const {
		width,
		height,
		viewportWidth,
		viewportHeight,
		children,
	} = props;
	const viewportRef = useRef(null);
	const bodyRef = useRef(document.body);
	const [isDragging, setIsDragging] = useState(false);
	const [currentX, setCurrentX] = useState(0);
	const [currentY, setCurrentY] = useState(0);
	const [initialX, setInitialX] = useState(0);
	const [initialY, setInitialY] = useState(0);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [zoomTarget, setZoomTarget] = useState(zoom);
	const X = clamp(currentX - offsetX, -(width - viewportWidth), 0);
	const Y = clamp(currentY - offsetY, -(height - viewportHeight), 0);

	useEventListener('mousedown', handleStartDragging, viewportRef);
	useEventListener('mousemove', handleDrag, viewportRef);
	useEventListener('mouseup', handleStopDragging, viewportRef);
	useEventListener('mouseout', handleMouseOut, bodyRef);
	useOnEntityAdded(MovingThingsQuery, MoveSystem);
	useEventListener('wheel', e => {
		setZoomTarget(
			clamp(
				zoom - (e.deltaY/10),
				50,
				200,
			)
		);
	}, bodyRef);
	useRequestAnimationFrame((delta) => {
		const direction = (zoomTarget > zoom) ? 1 : -1;

		setZoom(
			clamp(
				zoom + direction * Math.abs(zoom - zoomTarget) * delta,
				Math.max(50, zoomTarget),
				Math.min(200, zoomTarget),
			)
		);
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
					scale: (zoom/100).toFixed(2),
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
		if(ev.button !== 0) {
			return;
		}

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
				clamp(currentX - offsetX, -(width - viewportWidth), 0)
			);
			setCurrentY(
				clamp(currentY - offsetY, -(height - viewportHeight), 0)
			);
		}

		setIsDragging(false);
		setInitialX(0);
		setInitialY(0);
		setOffsetX(0);
		setOffsetY(0);
	}

	function handleDrag(ev: MouseEvent) {
		ev.preventDefault();

		if(!isDragging) {
			return;
		}

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
		const zoomFactor = zoom / 100; // Assuming zoom is stored as a percentage
	
		SelectableQuery
			.entities
			.filter(e => e.selectable.selected)
			.map(e => {
				world.addComponent(e, 'movetarget', {
					x: (ev.clientX- rect.left) / zoomFactor,
					y: ev.clientY - rect.top,
				})
			})
	}
}

function handleClick() {
	SelectableQuery.entities.map(e => e.selectable.selected = false);
}

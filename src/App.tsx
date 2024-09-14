import { useOnEntityAdded } from 'miniplex-react';
import { ECS } from './state';
import { proxy } from 'valtio';
import { ReactNode, useRef, useState } from 'react';
import { useEventListener } from './hooks';
import { MovingThingsQuery, RenderedQuery, SelectableQuery } from './queries';
import { BasicEntity } from './components/basic-entity';

const {
	Entities,
	world,
} = ECS;

world.add({
	movable: proxy({
		speed: 10,
	}),
	rotation: proxy({value: 0}),
	position: proxy({
		x: 800,
		y: 600,
	}),
	selectable: proxy({
		selected: false,
	}),
});

export default function Root() {
	return (
		<div>
			<GameWorld
				width={3200}
				height={2400}
				viewportWidth={1200}
				viewportHeight={900}
			/>
			<button onClick={() => {
				world.add({
					movable: proxy({
						speed: 10,
					}),
					rotation: proxy({value: 0}),
					position: proxy({
						x: randomInRange(200, 1000),
						y: randomInRange(100, 500),
					}),
					selectable: proxy({
						selected: false,
					})
				});
			}}>
				Spawn Entity
			</button>
		</div>
	);
}

interface Props {
	width: number;
	height: number;
	viewportWidth: number;
	viewportHeight: number;
}

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
	const X = clamp(currentX - offsetX, -(width - viewportWidth), 0);
	const Y = clamp(currentY - offsetY, -(height - viewportHeight), 0);

	useEventListener('mousedown', handleStartDragging, viewportRef);
	useEventListener('mousemove', handleDrag, viewportRef);
	useEventListener('mouseup', handleStopDragging, viewportRef);
	useEventListener('mouseout', handleMouseOut, bodyRef);
	useOnEntityAdded(MovingThingsQuery, MoveSystem);
	
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
				}}
			>
				{children}
			</div>
		</div>
	);

	function handleMouseOut(e: MouseEvent) {
		if(!isDragging) return;
		if(e.currentTarget !== document.body) return;

		handleStopDragging(e);
	}

	function handleStartDragging(e: MouseEvent) {
		if(e.button !== 0) {
			return;
		}

		setIsDragging(true);
		setInitialX(e.clientX);
		setInitialY(e.clientY);
	}

	function handleStopDragging(e: MouseEvent) {
		if(e.button === 2) {
			handleLeftClick(e, currentX, currentY);
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

	function handleDrag(e: MouseEvent) {
		e.preventDefault();

		if(!isDragging) {
			return;
		}

		const newX = initialX - e.clientX;
		const newY = initialY - e.clientY;

		setOffsetX(newX);
		setOffsetY(newY);

		setOffsetX(initialX - e.clientX);
		setOffsetY(initialY - e.clientY);
	}
}

function handleLeftClick(ev: MouseEvent, currentX: number, currentY: number) {
	SelectableQuery
		.entities
		.filter(e => e.selectable.selected)
		.map(e => {
			world.addComponent(e, 'movetarget', {
				x: ev.clientX - currentX,
				y: ev.clientY - currentY,
			})
		})
}

function handleClick() {
	SelectableQuery.entities.map(e => e.selectable.selected = false);
}

function MoveSystem() {
	for(const e of MovingThingsQuery) {
		e.position.x = e.movetarget.x;
		e.position.y = e.movetarget.y;
		e.rotation.value = !e.rotation.value ? 360 : 0
		world.removeComponent(e, 'movetarget');
	}
}

function clamp(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

function randomInRange(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

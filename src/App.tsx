'use client';
import { useOnEntityAdded } from 'miniplex-react';
import { ECS } from './state';
import { proxy, useSnapshot } from 'valtio';
import { ReactNode, useState } from 'react';
import { useEventListener } from './hooks';

const {
	Entities,
	Entity,
	useCurrentEntity,
	world,
} = ECS;

const Queries = {
	toMove: world.with('position', 'movable'),
	rendered: world.with('position'),
	movingThings: world.with('position', 'speed', 'movetarget', 'rotation'),
};

world.add({
	metadata: { name: 'Foo' },
	movable: true,
	speed: 10,
	rotation: proxy({value: 0}),
	position: proxy({
		x: 800,
		y: 600,
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
			<Entities in={Queries.rendered}>
				<EntityRender />
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
	const [isDragging, setIsDragging] = useState(false);
	const [currentX, setCurrentX] = useState(0);
	const [currentY, setCurrentY] = useState(0);
	const [initialX, setInitialX] = useState(0);
	const [initialY, setInitialY] = useState(0);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const X = clamp(currentX - offsetX, -(width - viewportWidth), 0);
	const Y = clamp(currentY - offsetY, -(height - viewportHeight), 0);
	
	useEventListener('mousedown', startDragging);
	useEventListener('mousemove', drag);
	useEventListener('mouseup', stopDragging);
	useOnEntityAdded(Queries.movingThings, MoveSystem);
	
	return (
		<>
			
			<div>
				viewportWidth: {viewportWidth}
			</div>
			<div>
				viewportHeight: {viewportHeight}
			</div>
			<div>
				Current: {currentX}, {currentY}
			</div>
			<div>
				Initial: {initialX}, {initialY}
			</div>
			<div>
				Offset: {offsetX}, {offsetY}
			</div>
			<div>
				X, Y: {X}, {Y}
			</div>
			<div
				className="viewport"
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
						translate: `${X}px ${Y}px 0`,
					}}
				>
					{children}
				</div>
			</div>
		</>
	);


	function startDragging(e: MouseEvent) {
		setIsDragging(true);
		setInitialX(e.clientX);
		setInitialY(e.clientY);
	}

	function stopDragging() {
		setCurrentX(
			clamp(currentX - offsetX, -(width - viewportWidth), 0)
		);
		setCurrentY(
			clamp(currentY - offsetY, -(height - viewportHeight), 0)
		);
		setIsDragging(false);
		setInitialX(0);
		setInitialY(0);
		setOffsetX(0);
		setOffsetY(0);
	}

	function drag(e: MouseEvent) {
		e.preventDefault();

		if(!isDragging) {
			return;
		}

		const newX = initialX - e.clientX;
		const newY = initialY - e.clientY;

		setOffsetX(newX);
		setOffsetY(newY);
	}
}

function EntityRender() {
	const entity = useCurrentEntity();
	// @ts-expect-error sadfa
	const position = useSnapshot<{x: number; y: number;}>(entity.position);
	// @ts-expect-error sadfa
	const rotation = useSnapshot<{value: number;}>(entity.rotation);

	return (
		<Entity entity={entity}>
			<div
				className="entity-container"
				style={{
				translate: `${position.x}px ${position.y}px 0`,
				rotate: `${rotation.value}deg`,
			}}>
				<div
					style={{
						backgroundColor: 'green',
						width: 25,
						height: 25,
					}}
				>
					{entity.metadata?.name}
				</div>
			</div>
		</Entity>
	);
}

function MoveSystem() {
	for(const e of Queries.movingThings) {
		e.position.x = e.movetarget.x;
		e.position.y = e.movetarget.y;
		e.rotation.value = !e.rotation.value ? 360 : 0
		world.removeComponent(e, 'movetarget');
	}
}

function clamp(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

// function randomInRange(min: number, max: number) {
// 	min = Math.ceil(min);
// 	max = Math.floor(max);
// 	return Math.floor(Math.random() * (max - min + 1)) + min;
// }

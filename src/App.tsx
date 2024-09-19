import { ECS } from './state';
import { proxy } from 'valtio';
import GameWorld from './components/game-world';

const { world } = ECS;

world.add({
	movable: proxy({
		speed: 10,
	}),
	rotation: proxy({value: 0}),
	position: proxy({
		x: 1600,
		y: 1200,
	}),
	selectable: proxy({
		selected: false,
	}),
});

export default function Root() {
	return (
		<div>
			<GameWorld
				width={4800}
				height={3600}
				viewportWidth={1200}
				viewportHeight={900}
			/>
		</div>
	);
}

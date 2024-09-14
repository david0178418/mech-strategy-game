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
		</div>
	);
}

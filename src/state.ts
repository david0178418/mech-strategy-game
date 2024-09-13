/* state.ts */
import { World } from 'miniplex';
import createReactAPI from 'miniplex-react';

export interface OrderedPair {
	x: number;
	y: number;
}

/* Our entity type */
export type Entity = Partial<{
	metadata: {
		name: 'string'
	};
	rotation: {value: number};
	position: OrderedPair;
	movetarget: OrderedPair;
	movable: {
		speed: number;
	};
	pausable: {
		paused: boolean;
	};
	selectable: {
		selected: boolean;
	};
}>;

/* Create a Miniplex world that holds our entities */
const world = new World<Entity>();

/* Create and export React bindings */
export const ECS = createReactAPI(world);

import { ECS } from './state';

const { world } = ECS;

export
const SelectableQuery = world.with('selectable');

export
const ToMoveQuery = world.with(
		'position',
		'movable',
	);

export
const RenderedQuery = world.with(
		'position',
		'selectable',
		'rotation',
	);

export
const MovingThingsQuery = world.with(
	'position',
	'movable',
	'movetarget',
	'rotation',
);

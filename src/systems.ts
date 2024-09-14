import { MovingThingsQuery } from "./queries";
import { ECS } from "./state";

export
function MoveSystem() {
	for(const e of MovingThingsQuery) {
		e.position.x = e.movetarget.x;
		e.position.y = e.movetarget.y;
		e.rotation.value = !e.rotation.value ? 360 : 0
		ECS.world.removeComponent(e, 'movetarget');
	}
}

export
function CameraSytem() {
	// foo
}

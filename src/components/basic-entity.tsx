import { ECS } from '../state';
import { useSnapshot } from 'valtio';
import { RenderedQuery } from '../queries';

const { Entity } = ECS;

interface Props {
	entity: typeof RenderedQuery.entities[0]
}

export
function BasicEntity(props: Props) {
	const { entity} = props;
	const position = useSnapshot(entity.position);
	const rotation = useSnapshot(entity.rotation);
	const selectable = useSnapshot(entity.selectable);

	return (
		<Entity entity={entity}>
			<div
				className="entity-container"
				style={{
					translate: `${position.x}px ${position.y}px 0`,
					rotate: `${rotation.value}deg`,
				}}
				onClick={() => entity.selectable.selected = true}
			>
				<div
					className={selectable.selected ? 'selected' : ''}
					style={{
						backgroundColor: 'green',
						width: 50,
						height: 50,
						cursor: 'pointer',
					}}
				/>
			</div>
		</Entity>
	);
}

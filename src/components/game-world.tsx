import { ECS } from '../state';
import { RenderedQuery } from '../queries';
import { BasicEntity } from './basic-entity';
import { Viewport } from './viewport';

const { Entities } = ECS;

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
			minZoom={50}
			maxZoom={200}
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

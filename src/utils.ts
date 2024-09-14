export
function clamp(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

export
function randomInRange(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

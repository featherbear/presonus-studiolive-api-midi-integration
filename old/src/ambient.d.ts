/**
 * These declarations tell TypeScript that we allow import of images, e.g.
 */
declare module "*.gif" {
	const value: string;
	export default value;
}

declare module "*.jpg" {
	const value: string;
	export default value;
}

declare module "*.jpeg" {
	const value: string;
	export default value;
}

declare module "*.png" {
	const value: string;
	export default value;
}

declare module "*.svg" {
	const value: string;
	export default value;
}

declare module "*.webp" {
	const value: string;
	export default value;
}


import type bunyan from 'bunyan'
declare global {
    var logger: bunyan
}

// Explicit import???
import '@types/webmidi'

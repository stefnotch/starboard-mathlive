import { Runtime, StarboardPlugin } from 'starboard-notebook/dist/src/types';

declare function registerMathlive(runtime: Runtime): void;
declare const plugin: StarboardPlugin;

export { plugin, registerMathlive };

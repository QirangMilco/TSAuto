import * as Definitions from '../types/definitions';
import { PluginType, type PluginMetadata, type GameDataInterface } from '../types/plugin';

export * from '../types/definitions';
export { PluginType };
export type { PluginMetadata, GameDataInterface };
export type { SetEffectContext, SetEffectFunction } from '../types/definitions';

// Runtime bridge exposed to plugins
export const TSAutoAPI = {
  ...Definitions,
  PluginType
};

// Make available to sandboxed loaders that rely on a global
if (typeof globalThis !== 'undefined' && !(globalThis as any).TSAutoAPI) {
  (globalThis as any).TSAutoAPI = TSAutoAPI;
}

export type TSAutoAPIType = typeof TSAutoAPI;

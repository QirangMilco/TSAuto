import * as Definitions from '../core/types/definitions';
import { PluginType, type PluginMetadata, type GameDataInterface } from '../core/types/plugin';

export * from '../core/types/definitions';
export { PluginType };
export type { PluginMetadata, GameDataInterface };

export type TSAutoAPIShape = typeof Definitions & {
  PluginType: typeof PluginType;
};

export const TSAutoAPI: TSAutoAPIShape;

declare global {
  const TSAutoAPI: TSAutoAPIShape;
}

declare module 'tsauto-api' {
  import * as Definitions from '../core/types/definitions';
  import { PluginType, type PluginMetadata, type GameDataInterface } from '../core/types/plugin';

  export * from '../core/types/definitions';
  export { PluginType };
  export type { PluginMetadata, GameDataInterface };

  export type TSAutoAPIShape = typeof Definitions & {
    PluginType: typeof PluginType;
  };

  export const TSAutoAPI: TSAutoAPIShape;
}

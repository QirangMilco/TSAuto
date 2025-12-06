import initSwc, { transformSync } from '@swc/wasm-web';
import { PluginType, type PluginMetadata } from '../../types/plugin';
import { TSAutoAPI } from '../../api/TSAutoAPI';

export interface RuntimePluginLoadResult {
  id: string;
  type: PluginType;
  content: any;
  metadata: PluginMetadata;
}

let swcInitPromise: Promise<void> | null = null;

const ensureSwcInitialized = async (): Promise<void> => {
  if (!swcInitPromise) {
    swcInitPromise = initSwc().catch((error) => {
      swcInitPromise = null;
      throw error;
    });
  }
  return swcInitPromise;
};

/**
 * Runtime loader that transpiles TS plugins with SWC and executes them inside a sandbox.
 */
export class RuntimePluginLoader {
  public async loadPluginFromSource(source: string, filename = 'runtime-plugin.ts'): Promise<RuntimePluginLoadResult> {
    await ensureSwcInitialized();

    const compiled = this.transformSource(source, filename);
    const module = { exports: {} as any };

    const sandboxRequire = (specifier: string): any => {
      if (specifier === 'tsauto-api') {
        return TSAutoAPI;
      }
      throw new Error(`Unsupported import: ${specifier}`);
    };

    try {
      const wrapped = new Function(
        'require',
        'module',
        'exports',
        'TSAutoAPI',
        `${compiled}\n//# sourceURL=${filename}`
      );
      wrapped(sandboxRequire, module, module.exports, TSAutoAPI);
    } catch (error) {
      throw new Error(`Executing runtime plugin failed: ${(error as Error).message}`);
    }

    const exported = module.exports;
    const content = exported?.default ?? exported;

    if (!content || typeof content !== 'object') {
      throw new Error('Runtime plugin did not export a valid object');
    }

    const id = content.id || this.extractIdFromFilename(filename);
    const type = this.determinePluginType(filename, exported?.metadata?.type);

    const metadata: PluginMetadata = {
      id,
      type,
      path: filename,
      version: exported?.metadata?.version || '1.0.0',
      author: exported?.metadata?.author || 'Unknown',
      loadTime: Date.now()
    };

    return { id, type, content, metadata };
  }

  private transformSource(source: string, filename: string): string {
    try {
      const { code } = transformSync(source, {
        filename,
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: filename.endsWith('.tsx'),
            decorators: false
          },
          target: 'es2022'
        },
        module: {
          type: 'commonjs'
        },
        sourceMaps: false
      });
      return code;
    } catch (error) {
      throw new Error(`SWC transform failed: ${(error as Error).message}`);
    }
  }

  private extractIdFromFilename(filename: string): string {
    const fileName = filename.split('/').pop() || 'runtime-plugin';
    return fileName.replace(/\.(ts|js|tsx|jsx)$/, '');
  }

  private determinePluginType(filename: string, declared?: PluginType): PluginType {
    if (declared && Object.values(PluginType).includes(declared)) {
      return declared;
    }
    if (filename.includes('/characters/') || filename.includes('character_')) return PluginType.CHARACTER;
    if (filename.includes('/skills/') || filename.includes('skill_')) return PluginType.SKILL;
    if (filename.includes('/equipment-sets/') || filename.includes('set_')) return PluginType.EQUIPMENT_SET;
    if (filename.includes('/equipment/') || filename.includes('equip_')) return PluginType.EQUIPMENT;
    if (filename.includes('/statuses/') || filename.includes('status_')) return PluginType.STATUS;
    return PluginType.UNKNOWN;
  }
}

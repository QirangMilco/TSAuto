import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginType } from '@/core/types/plugin';
import { TSAutoAPI } from '@/core/api/TSAutoAPI';

const mockInitSwc = vi.fn<[], Promise<void>>();
const mockTransformSync = vi.fn();

const importLoader = async () => {
  vi.resetModules();
  vi.doMock('@swc/wasm-web', () => ({
    __esModule: true,
    default: mockInitSwc,
    transformSync: mockTransformSync
  }));
  const { RuntimePluginLoader } = await import('@/core/plugin/runtime/RuntimePluginLoader');
  return RuntimePluginLoader;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockInitSwc.mockResolvedValue();
});

describe('RuntimePluginLoader', () => {
  it('transpiles and executes a plugin with SWC and exposes TSAutoAPI through require', async () => {
    const RuntimePluginLoader = await importLoader();
    const compiledCode = `
      const { PluginType } = require('tsauto-api');
      module.exports = {
        default: {
          id: 'runtime_skill',
          name: 'Runtime Skill',
          declaredType: PluginType.SKILL
        },
        metadata: {
          type: PluginType.SKILL,
          version: '0.2.0',
          author: 'Tester'
        }
      };
    `;
    mockTransformSync.mockReturnValue({ code: compiledCode });

    const loader = new RuntimePluginLoader();
    const result = await loader.loadPluginFromSource('export default {}', 'plugins/skills/runtime_skill.ts');

    expect(mockInitSwc).toHaveBeenCalledTimes(1);
    expect(mockTransformSync).toHaveBeenCalledWith(
      'export default {}',
      expect.objectContaining({ filename: 'plugins/skills/runtime_skill.ts' })
    );
    expect(result.id).toBe('runtime_skill');
    expect(result.type).toBe(PluginType.SKILL);
    expect(result.content).toMatchObject({ id: 'runtime_skill', name: 'Runtime Skill', declaredType: PluginType.SKILL });
    expect(result.metadata).toMatchObject({
      id: 'runtime_skill',
      type: PluginType.SKILL,
      path: 'plugins/skills/runtime_skill.ts',
      version: '0.2.0',
      author: 'Tester'
    });
    expect(typeof result.metadata.loadTime).toBe('number');
  });

  it('injects TSAutoAPI into the sandbox and falls back to filename/id and default metadata', async () => {
    const RuntimePluginLoader = await importLoader();
    const compiledCode = `
      module.exports = {
        default: {
          name: 'Character Without Id',
          resolvedType: TSAutoAPI.PluginType.CHARACTER
        }
      };
    `;
    mockTransformSync.mockReturnValue({ code: compiledCode });

    const loader = new RuntimePluginLoader();
    const result = await loader.loadPluginFromSource('export default {}', 'plugins/characters/character_custom.ts');

    expect(result.id).toBe('character_custom');
    expect(result.type).toBe(PluginType.CHARACTER);
    expect(result.content.resolvedType).toBe(TSAutoAPI.PluginType.CHARACTER);
    expect(result.metadata).toMatchObject({
      id: 'character_custom',
      type: PluginType.CHARACTER,
      path: 'plugins/characters/character_custom.ts',
      version: '1.0.0',
      author: 'Unknown'
    });
    expect(typeof result.metadata.loadTime).toBe('number');
  });

  it('blocks unsupported imports inside the sandbox', async () => {
    const RuntimePluginLoader = await importLoader();
    const compiledCode = `
      const fs = require('fs');
      module.exports = { default: { id: 'bad' } };
    `;
    mockTransformSync.mockReturnValue({ code: compiledCode });

    const loader = new RuntimePluginLoader();
    await expect(
      loader.loadPluginFromSource('export default {}', 'plugins/misc/bad.ts')
    ).rejects.toThrow(/Unsupported import: fs/);
  });
});

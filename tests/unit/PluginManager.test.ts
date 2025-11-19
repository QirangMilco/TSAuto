import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import { StatType, BattleEventType } from '../../src/core/types/definitions';
import { PluginType } from '../../src/core/types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition } from '../../src/core/types/definitions';
import type { PluginMetadata } from '../../src/core/types/plugin';

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  
  beforeEach(() => {
    pluginManager = new PluginManager();
  });
  
  it('should register character plugin successfully', () => {
    const characterDef: CharacterDefinition = {
      id: 'char1',
      name: 'Test Character',
      assets: {
        avatar: 'avatar.png',
        portrait: 'portrait.png'
      },
      growthValueBeforeAwake: {
        hp: 10,
        atk: 5,
        def: 2
      },
      baseValueBeforeAwake: {
        spd: 100,
        crit: 0.1,
        critDmg: 1.5
      },
      growthValueAfterAwake: {
        hp: 12,
        atk: 8,
        def: 4
      },
      baseValueAfterAwake: {
        spd: 120,
        crit: 0.15,
        critDmg: 1.5
      },
      skills: ['skill1', 'skill2', 'skill3']
    };
    
    pluginManager.registerPlugin(characterDef.id, PluginType.CHARACTER, characterDef);
    
    const result = pluginManager.getCharacter('char1');
    expect(result).toEqual(characterDef);
  });
  
  it('should register skill plugin successfully', () => {
    const skillDef: SkillDefinition = {
      id: 'skill1',
      name: 'Test Skill',
      cost: {
        type: "BATTLE_RESOURCE",
        amount: 25
      },
      activeEffects: [],
      passiveListeners: [
        {
          event: BattleEventType.ON_SKILL_USED,
          effects: []
        }
      ],
      description: 'Test skill description'
    };
    
    const plugin: PluginMetadata = {
      id: skillDef.id,
      type: PluginType.SKILL,
      definition: skillDef
    };
    
    pluginManager.registerPlugin(plugin);
    
    const result = pluginManager.getSkill('skill1');
    expect(result).toEqual(skillDef);
  });
  
  it('should register equipment plugin successfully', () => {
    const equipmentDef: EquipmentDefinition = {
      id: 'equip1',
      name: 'Test Equipment',
      type: 'weapon',
      baseStats: {
        [StatType.ATK]: 100,
        [StatType.CRIT]: 0.1
      },
      possibleSubStats: [StatType.ATK_P, StatType.CRIT_DMG]
    };
    
    const plugin: PluginMetadata = {
      type: PluginType.EQUIPMENT,
      definition: equipmentDef
    };
    
    pluginManager.registerPlugin(plugin);
    
    const result = pluginManager.getEquipment('equip1');
    expect(result).toEqual(equipmentDef);
  });
  
  it('should register status plugin successfully', () => {
    const statusDef: StatusDefinition = {
      id: 'status1',
      name: 'Test Status',
      effects: [],
      duration: 2,
      isStackable: false
    };
    
    const plugin: PluginMetadata = {
      type: PluginType.STATUS,
      definition: statusDef
    };
    
    pluginManager.registerPlugin(plugin);
    
    const result = pluginManager.getStatus('status1');
    expect(result).toEqual(statusDef);
  });
  
  it('should handle duplicate plugin registration correctly', () => {
    // 注册第一个插件
    const characterDef1: CharacterDefinition = {
      id: 'char1',
      name: 'Test Character 1',
      resourcePath: '/characters/char1',
      growth: {
        [StatType.ATK]: 10,
        [StatType.DEF]: 5,
        [StatType.HP]: 100,
        [StatType.SPD]: 2
      },
      skillIds: ['skill1']
    };
    
    const plugin1: PluginMetadata = {
      type: PluginType.CHARACTER,
      definition: characterDef1
    };
    
    pluginManager.registerPlugin(plugin1);
    
    // 注册相同ID的第二个插件（覆盖）
    const characterDef2: CharacterDefinition = {
      ...characterDef1,
      name: 'Test Character 2'
    };
    
    const plugin2: PluginMetadata = {
      type: PluginType.CHARACTER,
      definition: characterDef2
    };
    
    pluginManager.registerPlugin(plugin2);
    
    // 应该返回第二个插件的值
    const result = pluginManager.getCharacter('char1');
    expect(result?.name).toBe('Test Character 2');
  });
  
  it('should return undefined for non-existent plugins', () => {
    expect(pluginManager.getCharacter('non_existent')).toBeUndefined();
    expect(pluginManager.getSkill('non_existent')).toBeUndefined();
    expect(pluginManager.getEquipment('non_existent')).toBeUndefined();
    expect(pluginManager.getStatus('non_existent')).toBeUndefined();
  });
  
  it('should unload plugins correctly', () => {
    // 注册插件
    const characterDef: CharacterDefinition = {
      id: 'char1',
      name: 'Test Character',
      resourcePath: '/characters/char1',
      growth: {
        [StatType.ATK]: 10,
        [StatType.DEF]: 5,
        [StatType.HP]: 100,
        [StatType.SPD]: 2
      },
      skillIds: ['skill1']
    };
    
    const plugin: PluginMetadata = {
      type: PluginType.CHARACTER,
      definition: characterDef
    };
    
    pluginManager.registerPlugin(plugin);
    
    // 验证已注册
    expect(pluginManager.getCharacter('char1')).toBeDefined();
    
    // 卸载所有插件
    pluginManager.unloadAllPlugins();
    
    // 验证已卸载
    expect(pluginManager.getCharacter('char1')).toBeUndefined();
  });
  
  it('should get all plugins of specific type', () => {
    // 注册多个角色插件
    const char1: CharacterDefinition = {
      id: 'char1',
      name: 'Char 1',
      resourcePath: '/characters/char1',
      growth: {
        [StatType.ATK]: 10,
        [StatType.DEF]: 5,
        [StatType.HP]: 100,
        [StatType.SPD]: 2
      },
      skillIds: []
    };
    
    const char2: CharacterDefinition = {
      id: 'char2',
      name: 'Char 2',
      resourcePath: '/characters/char2',
      growth: {
        [StatType.ATK]: 15,
        [StatType.DEF]: 8,
        [StatType.HP]: 150,
        [StatType.SPD]: 3
      },
      skillIds: []
    };
    
    pluginManager.registerPlugin({ type: PluginType.CHARACTER, definition: char1 });
    pluginManager.registerPlugin({ type: PluginType.CHARACTER, definition: char2 });
    pluginManager.registerPlugin({
      type: PluginType.SKILL,
      definition: {
        id: 'skill1',
        name: 'Test Skill',
        cost: 25,
        effects: [],
        passive: null,
        description: ''
      }
    });
    
    const allCharacters = pluginManager.getAllCharacters();
    expect(allCharacters.length).toBe(2);
    expect(allCharacters).toContain(char1);
    expect(allCharacters).toContain(char2);
  });
});
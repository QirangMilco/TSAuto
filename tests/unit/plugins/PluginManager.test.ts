import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../../../src/core/plugin/PluginManager';
import { StatType, BattleEventType, BuffType, ResourceType } from '../../../src/core/types/definitions';
import { PluginType } from '../../../src/core/types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition } from '../../../src/core/types/definitions';

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
      growthValuesBeforeAwake: {
        hp: 10,
        atk: 5,
        def: 2
      },
      baseValuesBeforeAwake: {
        spd: 100,
        crit: 0.1,
        critDmg: 1.5
      },
      growthValuesAfterAwake: {
        hp: 12,
        atk: 8,
        def: 4
      },
      baseValuesAfterAwake: {
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
        type: ResourceType.BATTLE_RESOURCE,
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
    
    pluginManager.registerPlugin(skillDef.id, PluginType.SKILL, skillDef);
    
    const result = pluginManager.getSkill('skill1');
    expect(result).toEqual(skillDef);
  });
  
  it('should register equipment plugin successfully', () => {
    const equipmentDef: EquipmentDefinition = {
      id: 'equip1',
      name: 'Test Equipment',
      setId: 'set1',
      slot: 1,
      baseStats: {
        [StatType.ATK]: 100,
        [StatType.CRIT]: 0.1
      },
      possibleSecondaryStats: [StatType.ATK_P, StatType.CRIT_DMG]
    };
    
    pluginManager.registerPlugin(equipmentDef.id, PluginType.EQUIPMENT, equipmentDef);
    
    const result = pluginManager.getEquipment('equip1');
    expect(result).toEqual(equipmentDef);
  });
  
  it('should register status plugin successfully', () => {
    const statusDef: StatusDefinition = {
      id: 'status1',
      name: 'Test Status',
      type: BuffType.STATUS,
      duration: 2,
      statModifiers: {}
    };
    
    pluginManager.registerPlugin(statusDef.id, PluginType.STATUS, statusDef);
    
    const result = pluginManager.getStatus('status1');
    expect(result).toEqual(statusDef);
  });
  
  it('should handle duplicate plugin registration correctly', () => {
    // 注册第一个插件
    const characterDef1: CharacterDefinition = {
      id: 'char1',
      name: 'Test Character 1',
      assets: {
        avatar: '',
        portrait: ''
      },
      growthValuesBeforeAwake: {
        hp: 10,
        atk: 5,
        def: 2
      },
      baseValuesBeforeAwake: {
        spd: 100,
        crit: 0.0,
        critDmg: 0.0
      },
      growthValuesAfterAwake: {
        hp: 12,
        atk: 8,
        def: 4
      },
      baseValuesAfterAwake: {
        spd: 120,
        crit: 0.15,
        critDmg: 1.5
      },
      skills: ['skill1', "s2", "s3"]
    };
    
    pluginManager.registerPlugin(characterDef1.id, PluginType.CHARACTER, characterDef1);
    
    // 注册相同ID的第二个插件（覆盖）
    const characterDef2: CharacterDefinition = {
      ...characterDef1,
      name: 'Test Character 2'
    };
    
    pluginManager.registerPlugin(characterDef2.id, PluginType.CHARACTER, characterDef2);
    
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
      assets: {
        avatar: '',
        portrait: ''
      },
      growthValuesBeforeAwake: {
        hp: 10,
        atk: 5,
        def: 2
      },
      baseValuesBeforeAwake: {
        spd: 100,
        crit: 0.0,
        critDmg: 0.0
      },
      growthValuesAfterAwake: {
        hp: 12,
        atk: 8,
        def: 4
      },
      baseValuesAfterAwake: {
        spd: 120,
        crit: 0.15,
        critDmg: 1.5
      },
      skills: ['skill1', "s2", "s3"]
    };
    
    pluginManager.registerPlugin(characterDef.id, PluginType.CHARACTER, characterDef);
    
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
      assets: {
        avatar: '',
        portrait: ''
      },
      growthValuesBeforeAwake: {
        hp: 10,
        atk: 5,
        def: 2
      },
      baseValuesBeforeAwake: {
        spd: 100,
        crit: 0.0,
        critDmg: 0.0
      },
      growthValuesAfterAwake: {
        hp: 12,
        atk: 8,
        def: 4
      },
      baseValuesAfterAwake: {
        spd: 120,
        crit: 0.15,
        critDmg: 1.5
      },
      skills: ['s1', 's2', 's3']
    };
    
    const char2: CharacterDefinition = {
      id: 'char2',
      name: 'Char 2',
      assets: {avatar: '', portrait: ''},
      growthValuesBeforeAwake: {
        hp: 15,
        atk: 8,
        def: 4
      },
      baseValuesBeforeAwake: {
        spd: 100,
        crit: 0.0,
        critDmg: 0.0
      },
      growthValuesAfterAwake: {
        hp: 17,
        atk: 12,
        def: 6
      },
      baseValuesAfterAwake: {
        spd: 120,
        crit: 0.15,
        critDmg: 1.5
      },
      skills: ['s4', 's5', 's6']
    };
    
    pluginManager.registerPlugin(char1.id, PluginType.CHARACTER, char1);
    pluginManager.registerPlugin(char2.id, PluginType.CHARACTER, char2);
    
    const allCharacters = pluginManager.getAllCharacters();
    expect(allCharacters.length).toBe(2);
    expect(allCharacters).toContain(char1);
    expect(allCharacters).toContain(char2);
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { PluginValidator } from '../../../src/core/plugin/PluginValidator';
import { StatType, BuffType, BattleEventType, EffectType, ResourceType } from '../../../src/core/types/definitions';
import { PluginType } from '../../../src/core/types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition } from '../../../src/core/types/definitions';

describe('PluginValidator', () => {
  let validator: PluginValidator;
  
  beforeEach(() => {
    validator = new PluginValidator();
  });
  
  describe('Character Plugin Validation', () => {
    it('should validate valid character plugin', () => {
      const validCharacter: CharacterDefinition = {
        id: 'char1',
        name: 'Valid Character',
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
      
      // 更新调用签名
      const isValid = validator.validatePlugin(validCharacter.id, PluginType.CHARACTER, validCharacter);
      expect(isValid).toBe(true);
    });
    
    it('should invalidate character plugin with missing required fields', () => {
      const invalidCharacter = {
        id: 'char1',
        // 缺少 name
        assets: { avatar: '', portrait: '' },
        growthValuesBeforeAwake: {
          hp: 10,
          atk: 5,
          def: 2
        },
        // 缺少 baseValuesBeforeAwake
        growthValuesAfterAwake: {
          hp: 12,
          atk: 8,
          def: 4
        },
        // 缺少 baseValuesAfterAwake
        skills: []
      };
      
      const isValid = validator.validatePlugin(invalidCharacter.id, PluginType.CHARACTER, invalidCharacter);
      expect(isValid).toBe(false);
    });
    
    it('should invalidate character plugin with invalid growth values', () => {
      const invalidCharacter: CharacterDefinition = {
        id: 'char1',
        name: 'Invalid Character',
        assets: { avatar: 'a', portrait: 'p' },
        growthValuesBeforeAwake: {
          hp: 100,
          atk: -10,
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
        skills: ["s1", "s2", "s3"]
      };
      
      const isValid = validator.validatePlugin(invalidCharacter.id, PluginType.CHARACTER, invalidCharacter);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Skill Plugin Validation', () => {
    it('should validate valid skill plugin', () => {
      const validSkill: SkillDefinition = {
        id: 'skill1',
        name: 'Valid Skill',
        cost: {type: ResourceType.BATTLE_RESOURCE, amount: 25},
        activeEffects: [{
          type: EffectType.DAMAGE,
          target: 'TARGET' as any,
          damageMultiplier: 1.0,
          baseDamageStat: StatType.ATK
        }],
        description: 'Valid skill description'
      };
      
      const isValid = validator.validatePlugin(validSkill.id, PluginType.SKILL, validSkill);
      expect(isValid).toBe(true);
    });
    
    it('should invalidate skill plugin with negative cost', () => {
      const invalidSkill: SkillDefinition = {
        id: 'skill1',
        name: 'Invalid Skill',
        cost: {type: ResourceType.BATTLE_RESOURCE, amount: -25}, // 负值
        activeEffects: [],
        description: ''
      };
      
      const isValid = validator.validatePlugin(invalidSkill.id, PluginType.SKILL, invalidSkill);
      expect(isValid).toBe(false);
    });
    
    it('should validate skill plugin with passive', () => {
      const validSkillWithPassive: SkillDefinition = {
        id: 'skill1',
        name: 'Skill With Passive',
        cost: {type: ResourceType.BATTLE_RESOURCE, amount: 0},
        activeEffects: [],
        passiveListeners: [{
          event: BattleEventType.ON_DAMAGE_DEALT,
          effects: [{
            type: EffectType.DAMAGE,
            target: 'TARGET' as any,
            damageMultiplier: 1.0,
            baseDamageStat: StatType.ATK
          }]
        }],
        description: 'Has passive effect'
      };
      
      const isValid = validator.validatePlugin(validSkillWithPassive.id, PluginType.SKILL, validSkillWithPassive);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Equipment Plugin Validation', () => {
    it('should validate valid equipment plugin', () => {
      const validEquipment: EquipmentDefinition = {
        id: 'equip1',
        name: 'Valid Equipment',
        setId: 'set1',
        slot: 1,
        baseStats: {
          [StatType.ATK]: 100,
          [StatType.CRIT]: 0.1
        },
        possibleSecondaryStats: [StatType.ATK_P, StatType.CRIT_DMG]
      };
      
      const isValid = validator.validatePlugin(validEquipment.id, PluginType.EQUIPMENT, validEquipment);
      expect(isValid).toBe(true);
    });
    
    it('should invalidate equipment plugin with invalid stat type', () => {
      const invalidEquipment = {
        id: 'equip1',
        name: 'Invalid Equipment',
        type: 'weapon',
        baseStats: {
          'invalid_stat': 100 // 无效的属性类型
        },
        possibleSecondaryStats: []
      };
      
      const isValid = validator.validatePlugin(invalidEquipment.id, PluginType.EQUIPMENT, invalidEquipment as any);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Status Plugin Validation', () => {
    it('should validate valid status plugin', () => {
      const validStatus: StatusDefinition = {
        id: 'status1',
        name: 'Valid Status',
        type: BuffType.ATK_UP,
        duration: 2,
        statModifiers: {
          [StatType.ATK]: 10
        }
      };
      
      const isValid = validator.validatePlugin(validStatus.id, PluginType.STATUS, validStatus);
      expect(isValid).toBe(true);
    });
    
    it('should invalidate status plugin with negative duration', () => {
      const invalidStatus: StatusDefinition = {
        id: 'status1',
        name: 'Invalid Status',
        type: BuffType.ATK_UP,
        duration: -1, // 负值
        statModifiers: {}
      };
      
      const isValid = validator.validatePlugin(invalidStatus.id, PluginType.STATUS, invalidStatus);
      expect(isValid).toBe(false);
    });
  });
  
  it('should handle unknown plugin type', () => {
    const isValid = validator.validatePlugin('id', 'UNKNOWN' as PluginType, {});
    expect(isValid).toBe(false);
  });
});
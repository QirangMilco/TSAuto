import { describe, it, expect, beforeEach } from 'vitest';
import { PluginValidator } from '../../src/core/plugin/PluginValidator';
import { PluginType, StatType, BuffType, BattleEventType, EffectType } from '../../src/core/types/definitions';
import type { PluginMetadata } from '../../src/core/types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition } from '../../src/core/types/definitions';

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
        resourcePath: '/characters/char1',
        growth: {
          [StatType.ATK]: 10,
          [StatType.DEF]: 5,
          [StatType.HP]: 100,
          [StatType.SPD]: 2
        },
        skillIds: ['skill1', 'skill2']
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.CHARACTER,
        definition: validCharacter
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should invalidate character plugin with missing required fields', () => {
      const invalidCharacter = {
        id: 'char1',
        // 缺少 name
        resourcePath: '/characters/char1',
        growth: {
          [StatType.ATK]: 10
          // 缺少其他成长属性
        },
        skillIds: []
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.CHARACTER,
        definition: invalidCharacter as any
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
    
    it('should invalidate character plugin with invalid growth values', () => {
      const invalidCharacter: CharacterDefinition = {
        id: 'char1',
        name: 'Invalid Character',
        resourcePath: '/characters/char1',
        growth: {
          [StatType.ATK]: -10, // 负值
          [StatType.DEF]: 5,
          [StatType.HP]: 100,
          [StatType.SPD]: 2
        },
        skillIds: []
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.CHARACTER,
        definition: invalidCharacter
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
  
  describe('Skill Plugin Validation', () => {
    it('should validate valid skill plugin', () => {
      const validSkill: SkillDefinition = {
        id: 'skill1',
        name: 'Valid Skill',
        cost: 25,
        effects: [{
          type: EffectType.DAMAGE,
          target: 'enemy',
          value: 1,
          properties: { isAoE: false }
        }],
        passive: null,
        description: 'Valid skill description'
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.SKILL,
        definition: validSkill
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should invalidate skill plugin with negative cost', () => {
      const invalidSkill: SkillDefinition = {
        id: 'skill1',
        name: 'Invalid Skill',
        cost: -25, // 负值
        effects: [],
        passive: null,
        description: ''
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.SKILL,
        definition: invalidSkill
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
    
    it('should validate skill plugin with passive', () => {
      const validSkillWithPassive: SkillDefinition = {
        id: 'skill1',
        name: 'Skill With Passive',
        cost: 0,
        effects: [],
        passive: {
          listenTo: BattleEventType.ATTACK,
          triggerCondition: (event) => true,
          executeEffect: (event) => {}
        },
        description: 'Has passive effect'
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.SKILL,
        definition: validSkillWithPassive
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Equipment Plugin Validation', () => {
    it('should validate valid equipment plugin', () => {
      const validEquipment: EquipmentDefinition = {
        id: 'equip1',
        name: 'Valid Equipment',
        type: 'weapon',
        baseStats: {
          [StatType.ATK]: 100,
          [StatType.CRIT]: 0.1
        },
        possibleSubStats: [StatType.ATK_P, StatType.CRIT_DMG]
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.EQUIPMENT,
        definition: validEquipment
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should invalidate equipment plugin with invalid stat type', () => {
      const invalidEquipment = {
        id: 'equip1',
        name: 'Invalid Equipment',
        type: 'weapon',
        baseStats: {
          'invalid_stat': 100 // 无效的属性类型
        },
        possibleSubStats: []
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.EQUIPMENT,
        definition: invalidEquipment as any
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
  
  describe('Status Plugin Validation', () => {
    it('should validate valid status plugin', () => {
      const validStatus: StatusDefinition = {
        id: 'status1',
        name: 'Valid Status',
        effects: [{
          type: BuffType.ATK_UP,
          value: 0.2
        }],
        duration: 2,
        isStackable: false
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.STATUS,
        definition: validStatus
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should invalidate status plugin with negative duration', () => {
      const invalidStatus: StatusDefinition = {
        id: 'status1',
        name: 'Invalid Status',
        effects: [],
        duration: -1, // 负值
        isStackable: true
      };
      
      const plugin: PluginMetadata = {
        type: PluginType.STATUS,
        definition: invalidStatus
      };
      
      const result = validator.validatePlugin(plugin);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
  
  it('should handle unknown plugin type', () => {
    const unknownPlugin: PluginMetadata = {
      type: 'unknown_type' as any,
      definition: {}
    };
    
    const result = validator.validatePlugin(unknownPlugin);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
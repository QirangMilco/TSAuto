import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition, EquipmentSetDefinition } from '../types/definitions';
import { PluginType } from '../types/plugin';
import { BattleEventType, BuffType, EffectType, TargetType, StatType } from '../types/definitions';

/**
 * 插件验证器
 * 负责验证插件是否符合接口规范
 */
export class PluginValidator {
  /**
   * 验证插件
   */
  public validatePlugin(id: string, type: PluginType, content: any): boolean {
    // 基础检查
    if (!content || typeof content !== 'object') return false;
    if (content.id !== id) {
       // 允许 id 不匹配的情况（如手动注册），但通常应该匹配
       // 这里为了严格性，我们暂时不强制要求内容里的 ID 必须和注册 ID 完全一致，
       // 但内容必须要有 id 字段
       if (!content.id) return false;
    }
    // 插件类型检查
    switch (type) {
      case PluginType.CHARACTER:
        return this.validateCharacter(content as CharacterDefinition);
      case PluginType.SKILL:
        return this.validateSkill(content as SkillDefinition);
      case PluginType.EQUIPMENT:
        return this.validateEquipment(content as EquipmentDefinition);
      case PluginType.STATUS:
        return this.validateStatus(content as StatusDefinition);
      case PluginType.EQUIPMENT_SET:
        return this.validateEquipmentSet(content as EquipmentSetDefinition);
      default:
        return false;
    }
  }

  /**
   * 验证角色插件
   */
  private validateCharacter(character: CharacterDefinition): boolean {
    if (!character || typeof character !== 'object') return false;

    // 必需字段验证
    if (!character.id || typeof character.id !== 'string') return false;
    if (!character.name || typeof character.name !== 'string') return false;

    // 资产验证
    if (!character.assets || typeof character.assets !== 'object') return false;
    if (!character.assets.avatar || typeof character.assets.avatar !== 'string') return false;
    if (!character.assets.portrait || typeof character.assets.portrait !== 'string') return false;

    // 成长值验证 - 修改为适应新的字段结构
    // 验证觉醒前成长值
    if (!character.growthValuesBeforeAwake || typeof character.growthValuesBeforeAwake !== 'object') return false;
    if (typeof character.growthValuesBeforeAwake.hp !== 'number' || character.growthValuesBeforeAwake.hp < 0) return false;
    if (typeof character.growthValuesBeforeAwake.atk !== 'number' || character.growthValuesBeforeAwake.atk < 0) return false;
    if (typeof character.growthValuesBeforeAwake.def !== 'number' || character.growthValuesBeforeAwake.def < 0) return false;

    // 验证觉醒前基础值
    if (!character.baseValuesBeforeAwake || typeof character.baseValuesBeforeAwake !== 'object') return false;
    if (typeof character.baseValuesBeforeAwake.spd !== 'number' || character.baseValuesBeforeAwake.spd < 0) return false;
    if (typeof character.baseValuesBeforeAwake.crit !== 'number' || character.baseValuesBeforeAwake.crit < 0) return false;
    if (typeof character.baseValuesBeforeAwake.critDmg !== 'number' || character.baseValuesBeforeAwake.critDmg < 0) return false;

    // 验证觉醒后成长值
    if (!character.growthValuesAfterAwake || typeof character.growthValuesAfterAwake !== 'object') return false;
    if (typeof character.growthValuesAfterAwake.hp !== 'number' || character.growthValuesAfterAwake.hp < 0) return false;
    if (typeof character.growthValuesAfterAwake.atk !== 'number' || character.growthValuesAfterAwake.atk < 0) return false;
    if (typeof character.growthValuesAfterAwake.def !== 'number' || character.growthValuesAfterAwake.def < 0) return false;

    // 验证觉醒后基础值
    if (!character.baseValuesAfterAwake || typeof character.baseValuesAfterAwake !== 'object') return false;
    if (typeof character.baseValuesAfterAwake.spd !== 'number' || character.baseValuesAfterAwake.spd < 0) return false;
    if (typeof character.baseValuesAfterAwake.crit !== 'number' || character.baseValuesAfterAwake.crit < 0) return false;
    if (typeof character.baseValuesAfterAwake.critDmg !== 'number' || character.baseValuesAfterAwake.critDmg < 0) return false;

    // 技能验证
    if (!Array.isArray(character.skills) || character.skills.length !== 3) return false;
    for (const skillId of character.skills) {
      if (!skillId || typeof skillId !== 'string') return false;
    }

    return true;
  }

  /**
   * 验证技能插件
   */
  private validateSkill(skill: SkillDefinition): boolean {
    if (!skill || typeof skill !== 'object') return false;

    // 必需字段验证
    if (!skill.id || typeof skill.id !== 'string') return false;
    if (!skill.name || typeof skill.name !== 'string') return false;

    // 消耗验证
    if (!skill.cost || typeof skill.cost !== 'object') return false;
    if (skill.cost.type !== 'BATTLE_RESOURCE') return false;
    if (typeof skill.cost.amount !== 'number' || skill.cost.amount < 0) return false;

    // 主动效果验证
    if (skill.activeEffects) {
      if (!Array.isArray(skill.activeEffects)) return false;
      for (const effect of skill.activeEffects) {
        if (!this.validateEffect(effect)) return false;
      }
    }

    // 被动监听验证
    if (skill.passiveListeners) {
      if (!Array.isArray(skill.passiveListeners)) return false;
      for (const listener of skill.passiveListeners) {
        if (!listener || typeof listener !== 'object') return false;
        if (!Object.values(BattleEventType).includes(listener.event)) return false;
        if (!Array.isArray(listener.effects)) return false;
        for (const effect of listener.effects) {
          if (!this.validateEffect(effect)) return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证装备插件
   */
  private validateEquipment(equipment: EquipmentDefinition): boolean {
    if (!equipment || typeof equipment !== 'object') return false;

    // 必需字段验证
    if (!equipment.id || typeof equipment.id !== 'string') return false;
    if (!equipment.name || typeof equipment.name !== 'string') return false;
    if (!equipment.setId || typeof equipment.setId !== 'string') return false;

    // 装备位验证
    const validSlots = [1, 2, 3, 4, 5, 6];
    if (!validSlots.includes(equipment.slot)) return false;

    // 基础属性验证
    if (equipment.baseStats) {
      for (const [stat, value] of Object.entries(equipment.baseStats)) {
        if (!Object.values(StatType).includes(stat as StatType)) return false;
        if (typeof value !== 'number' || value < 0) return false;
      }
    }

    // 副属性验证
    if (equipment.possibleSecondaryStats) {
      if (!Array.isArray(equipment.possibleSecondaryStats)) return false;
      for (const stat of equipment.possibleSecondaryStats) {
        if (!Object.values(StatType).includes(stat)) return false;
      }
    }

    return true;
  }

  /**
   * 验证状态插件
   */
  private validateStatus(status: StatusDefinition): boolean {
    if (!status || typeof status !== 'object') return false;

    // 必需字段验证
    if (!status.id || typeof status.id !== 'string') return false;
    if (!status.name || typeof status.name !== 'string') return false;

    // 状态类型验证
    if (!Object.values(BuffType).includes(status.type)) return false;

    // 持续时间验证
    if (status.duration !== undefined && (typeof status.duration !== 'number' || status.duration < 0)) {
      return false;
    }

    // 属性修饰符验证
    if (status.statModifiers) {
      for (const [stat, value] of Object.entries(status.statModifiers)) {
        if (!Object.values(StatType).includes(stat as StatType)) return false;
        if (typeof value !== 'number') return false;
      }
    }

    // 特殊行为验证
    if (status.onTurnStart && !this.validateEffectsArray(status.onTurnStart)) return false;
    if (status.onTurnEnd && !this.validateEffectsArray(status.onTurnEnd)) return false;
    if (status.onReceiveDamage && !this.validateEffectsArray(status.onReceiveDamage)) return false;

    return true;
  }

  /**
   * ✨ 新增：验证套装插件
   */
  private validateEquipmentSet(set: EquipmentSetDefinition): boolean {
    if (!set || typeof set !== 'object') return false;
    
    // 必需字段
    if (!set.id || typeof set.id !== 'string') return false;
    if (!set.name || typeof set.name !== 'string') return false;
    
    // 验证 2件套 (可选，但如果有必须合法)
    if (set.piece2) {
      if (typeof set.piece2 !== 'object') return false;
      if (!Object.values(StatType).includes(set.piece2.stat)) return false;
      if (typeof set.piece2.value !== 'number') return false;
    }
    
    // 验证 4件套 (可选)
    if (set.piece4) {
      if (typeof set.piece4 !== 'object') return false;
      
      // 必须至少包含 属性加成 或 机制描述 之一
      const hasStat = set.piece4.stat && typeof set.piece4.value === 'number';
      const hasEffect = set.piece4.description && typeof set.piece4.description === 'string';
      
      if (!hasStat && !hasEffect) return false;
      
      if (set.piece4.stat && !Object.values(StatType).includes(set.piece4.stat)) return false;
    }
    
    return true;
  }

  /**
   * 验证效果
   */
  private validateEffect(effect: any): boolean {
    if (!effect || typeof effect !== 'object') return false;

    // 效果类型验证
    if (!Object.values(EffectType).includes(effect.type)) return false;

    // 目标类型验证
    if (!Object.values(TargetType).includes(effect.target)) return false;

    // 根据效果类型验证其他字段
    switch (effect.type) {
      case EffectType.DAMAGE:
        if (typeof effect.damageMultiplier !== 'number' || effect.damageMultiplier < 0) {
          return false;
        }
        if (!Object.values(StatType).includes(effect.baseDamageStat)) return false;
        break;
      case EffectType.HEAL:
        if (typeof effect.healMultiplier !== 'number' || effect.healMultiplier < 0) {
          return false;
        }
        if (!Object.values(StatType).includes(effect.baseHealStat)) return false;
        break;
      case EffectType.APPLY_STATUS:
        if (!effect.statusId || typeof effect.statusId !== 'string') {
          return false;
        }
        if (effect.duration !== undefined && (typeof effect.duration !== 'number' || effect.duration < 0)) {
          return false;
        }
        break;
      case EffectType.MODIFY_ACTION_BAR:
        if (typeof effect.amount !== 'number') {
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * 验证效果数组
   */
  private validateEffectsArray(effects: any[]): boolean {
    if (!Array.isArray(effects)) return false;
    for (const effect of effects) {
      if (!this.validateEffect(effect)) return false;
    }
    return true;
  }
}
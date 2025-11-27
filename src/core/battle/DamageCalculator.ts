import type { CharacterInstance } from '../types/battle';
import { StatType } from '../types/definitions';

/**
 * 伤害计算器
 * 负责处理各种伤害计算逻辑
 */
export class DamageCalculator {
  // 防御减伤公式参数
  private static readonly DEF_CONSTANT = 300; // 防御常数，符合设计文档要求
  
  /**
   * 计算最终伤害
   * @param attacker 攻击者
   * @param defender 防御者
   * @param multiplier 伤害系数
   * @param baseStat 基础属性类型（默认攻击力）
   * @returns 最终伤害值
   */
  public calculateDamage(
    attacker: CharacterInstance,
    defender: CharacterInstance,
    multiplier: number = 1.0,
    baseStat: StatType = StatType.ATK
  ): {
    damage: number;
    isCritical: boolean;
    rawDamage: number;
    criticalDamage: number;
    defenseReduction: number;
  } {
    // 根据阴阳师伤害公式：
    // 总伤害 = (基础属性 × (1 + 属性增减) + 属性固定加成)
    //        × 暴击伤害
    //        × (1 + 伤害增减 + 承受伤害增减)
    //        × (300 / (300 + (1 - 无视防御) × (敌方防御 - 忽略防御) × (1 + 防御增减)))
    
    // 计算基础属性值
    const baseValue = this.calculateBaseStat(attacker, baseStat);
    
    // 计算属性百分比加成
    const percentBonus = this.calculateStatBonus(attacker, baseStat);

    // 计算有效属性值：基础属性 × (1 + 属性百分比加成)
    const effectiveValue = baseValue * (1 + percentBonus);
    
    // 计算基础伤害
    let rawDamage = effectiveValue * multiplier;
    
    // 检查暴击
    const isCritical = this.checkCritical(attacker);
    let criticalDamage = 0;
    
    // 应用暴击伤害
    if (isCritical) {
      const critMultiplier = 1 + (attacker.currentStats.CRIT_DMG || 0);
      rawDamage *= critMultiplier;
      criticalDamage = rawDamage;
    }
    
    // 计算伤害增减和承受伤害增减
    const damageBonus = attacker.currentStats.DMG_BONUS || 0;
    const damageTakenBonus = defender.currentStats.DMG_TAKEN_BONUS || 0;
    const damageModifier = 1 + (damageBonus / 100) + (damageTakenBonus / 100);
    
    // 应用伤害增减
    rawDamage *= damageModifier;
    
    // 计算防御减伤
    const effectiveDefense = this.calculateEffectiveDefense(attacker, defender);
    
    // 应用防御减伤：300/(300+防御值)
    const defParam = DamageCalculator.DEF_CONSTANT / (DamageCalculator.DEF_CONSTANT + effectiveDefense);
    let finalDamage = rawDamage * defParam;
    
    // 确保伤害在合理范围内
    finalDamage = this.clampDamage(finalDamage, defender.maxHp);
    
    return {
      damage: Math.round(finalDamage),
      isCritical,
      rawDamage,
      criticalDamage,
      defenseReduction: 1 - defParam // 减伤比例 = 1 - 承受伤害比例
    };
  }

  
  
  
  /**
   * 检查是否暴击
   */
  public checkCritical(attacker: CharacterInstance): boolean {
    const critRate = Math.min(1.0, attacker.currentStats.CRIT || 0);
    return Math.random() < critRate;
  }
  
  /**
   * 计算有效防御
   * @param attacker 攻击者
   * @param defender 防御者
   * @returns 有效防御值
   */
  public calculateEffectiveDefense(
    attacker: CharacterInstance,
    defender: CharacterInstance
  ): number {
    let defense = defender.currentStats.DEF || 0;
    
    // 应用无视防御效果
    const ignoreDefPercent = attacker.currentStats.IGNORE_DEF_P || 0; // 百分比值
    const ignoreDefFlat = attacker.currentStats.IGNORE_DEF_FLAT || 0; // 固定值
    
    // 获取防御增减效果（如果存在）
    const defenseModifier = defender.currentStats.DEF_P || 0; // 防御增减百分比
    
    // 按照公式计算：(1 - 无视防御) × (敌方防御 - 忽略防御) × (1 + 防御增减)
    // 注意：这里假设ignoreDefPercent是百分比值，需要转换为小数
    // 先计算 (敌方防御 - 忽略防御)
    const defenseAfterFlatReduction = Math.max(0, defense - ignoreDefFlat);
    
    // 应用 (1 - 无视防御) - 无视防御为百分比，转换为小数
    const defenseAfterPercentReduction = defenseAfterFlatReduction * (1 - ignoreDefPercent / 100);
    
    // 应用 (1 + 防御增减) - 防御增减为百分比，转换为小数
    const effectiveDefense = defenseAfterPercentReduction * (1 + defenseModifier / 100);
    
    return Math.max(0, effectiveDefense);
  }
  
  /**
   * 限制伤害值在合理范围内
   */
  private clampDamage(damage: number, maxPossibleDamage: number): number {
    const minDamage = 1;
    const maxDamage = maxPossibleDamage;
    
    return Math.max(minDamage, Math.min(maxDamage, damage));
  }
  
  /**
   * 计算治疗量
   * @param healer 治疗者
   * @param target 被治疗者
   * @param multiplier 治疗系数
   * @param baseStat 基础属性类型，默认为生命
   * @returns 最终治疗值和是否暴击的信息
   */
  public calculateHeal(
    healer: CharacterInstance,
    target: CharacterInstance,
    multiplier: number = 1.0,
    baseStat: StatType = StatType.HP
  ): {
    healAmount: number;
    isCritical: boolean;
    rawHeal: number;
    criticalHeal: number;
  } {
    // 计算基础生命值
    const baseHp = this.calculateBaseStat(healer, baseStat);
    
    // 计算生命增益
    const hpBonus = this.calculateStatBonus(healer, baseStat);
    
    // 计算有效基础值
    const effectiveBase = baseHp * (1 + hpBonus);
    
    // 计算基础治疗量
    let rawHeal = effectiveBase * multiplier;
    
    // 检查治疗暴击
    const isCritical = this.checkCritical(healer);
    let criticalHeal = 0;
    
    // 应用暴击伤害
    if (isCritical) {
      const critMultiplier = 1 + (healer.currentStats.CRIT_DMG || 0);
      rawHeal *= critMultiplier;
      criticalHeal = rawHeal;
    }
    
    // 计算治疗增减
    const healBonus = healer.currentStats.HEAL_BONUS || 0; // 治疗者的治疗增减
    const receiveHealBonus = target.currentStats.RECEIVE_HEAL_BONUS || 0; // 被治疗者的承受治疗增减
    
    // 应用治疗增减效果：(1 + 治疗增减 + 承受治疗增减)
    let finalHeal = rawHeal * (1 + healBonus / 100 + receiveHealBonus / 100);
    
    // 确保治疗不超过最大可能治疗量
    const maxPossibleHeal = target.maxHp - target.currentHp;
    finalHeal = Math.min(finalHeal, maxPossibleHeal);
    
    return {
      healAmount: Math.round(finalHeal),
      isCritical,
      rawHeal,
      criticalHeal
    };
  }
  
  /**
   * 计算基础属性值
   */
  public calculateBaseStat(character: CharacterInstance, statType: StatType): number {
    return character.currentStats[statType] || 0;
  }
  
  /**
   * 计算属性增益
   */
  public calculateStatBonus(character: CharacterInstance, statType: StatType): number {
    // 动态获取对应的百分比加成属性
    const percentStat = `${statType}_P` as StatType;
    const statPercent = character.currentStats[percentStat] || 0;
    
    return statPercent / 100; // 转换为小数
  }
}
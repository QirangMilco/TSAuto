import type { CharacterInstance } from '../types/battle';
import { StatType } from '../types/definitions';

/**
 * 伤害计算器
 * 负责处理各种伤害计算逻辑
 */
export class DamageCalculator {
  // 防御减伤公式参数
  private static readonly DEF_CONSTANT = 300; // 防御常数，符合设计文档要求
  private static readonly MIN_DAMAGE_RATIO = 0.1; // 最小伤害系数
  private static readonly MAX_DAMAGE_RATIO = 99.0; // 最大伤害系数
  
  /**
   * 计算最终伤害
   * @param attacker 攻击者
   * @param defender 防御者
   * @param multiplier 伤害系数
   * @returns 最终伤害值
   */
  public calculateDamage(
    attacker: CharacterInstance,
    defender: CharacterInstance,
    multiplier: number = 1.0
  ): {
    damage: number;
    isCritical: boolean;
    rawDamage: number;
    criticalDamage: number;
    defenseReduction: number;
  } {
    // 计算基础攻击力
    const baseAttack = this.calculateBaseAttack(attacker);
    
    // 计算攻击增益
    const attackBonus = this.calculateAttackBonus(attacker);
    
    // 计算有效攻击
    const effectiveAttack = baseAttack * (1 + attackBonus);
    
    // 计算基础伤害
    let rawDamage = effectiveAttack * multiplier;
    
    // 检查暴击
    const isCritical = this.checkCritical(attacker);
    let criticalDamage = 0;
    
    // 应用暴击伤害
    if (isCritical) {
      const critMultiplier = 1 + (attacker.currentStats.CRIT_DMG || 0);
      rawDamage *= critMultiplier;
      criticalDamage = rawDamage;
    }
    
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
   * 计算基础攻击力
   */
  public calculateBaseAttack(attacker: CharacterInstance): number {
    return attacker.currentStats.ATK || 0;
  }
  
  /**
   * 计算攻击增益
   */
  public calculateAttackBonus(attacker: CharacterInstance): number {
    const atkFlat = attacker.currentStats.ATK || 0;
    const atkPercent = attacker.currentStats.ATK_P || 0;
    
    return atkPercent / 100; // 转换为小数
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
    const ignoreDefPercent = attacker.currentStats.IGNORE_DEF_P || 0;
    const ignoreDefFlat = attacker.currentStats.IGNORE_DEF_FLAT || 0;
    
    // 计算有效防御
    const effectiveDefense = Math.max(0, defense * (1 - ignoreDefPercent / 100) - ignoreDefFlat);
    
    return effectiveDefense;
  }
  
  /**
   * 限制伤害值在合理范围内
   */
  private clampDamage(damage: number, maxPossibleDamage: number): number {
    const minDamage = maxPossibleDamage * DamageCalculator.MIN_DAMAGE_RATIO;
    const maxDamage = maxPossibleDamage * DamageCalculator.MAX_DAMAGE_RATIO;
    
    return Math.max(minDamage, Math.min(maxDamage, damage));
  }
  
  /**
   * 计算治疗量
   */
  public calculateHeal(target: CharacterInstance, healAmount: number): number {
    // 计算生命加成
    const hpPercentBonus = target.currentStats.HP_P || 0;
    const baseHeal = healAmount;
    
    // 应用生命加成
    const finalHeal = baseHeal * (1 + hpPercentBonus / 100);
    
    // 确保治疗不超过最大生命值
    const maxPossibleHeal = target.maxHp - target.currentHp;
    
    return Math.min(finalHeal, maxPossibleHeal);
  }
}
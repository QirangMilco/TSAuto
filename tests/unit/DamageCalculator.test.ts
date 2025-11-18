import { describe, it, expect } from 'vitest';
import { DamageCalculator } from '../../src/core/battle/DamageCalculator';
import { StatType, BuffType } from '../../src/core/types/definitions';
import type { CharacterInstance, CharacterStatus } from '../../src/core/types/battle';

describe('DamageCalculator', () => {
  let calculator: DamageCalculator;
  let attacker: CharacterInstance;
  let target: CharacterInstance;
  
  beforeEach(() => {
    calculator = new DamageCalculator();
    
    // 创建测试角色实例
    attacker = {
      instanceId: 'attacker',
      characterId: 'attacker1',
      currentStats: {
        [StatType.ATK]: 1000,
        [StatType.DEF]: 500,
        [StatType.HP]: 10000,
        [StatType.SPD]: 100,
        [StatType.CRIT]: 0.1,
        [StatType.CRIT_DMG]: 0.5,
        [StatType.ATK_P]: 0,
        [StatType.DEF_P]: 0,
        [StatType.HP_P]: 0,
        [StatType.DMG_BONUS]: 0,
        [StatType.DMG_TAKEN_BONUS]: 0,
        [StatType.IGNORE_DEF_P]: 0,
        [StatType.IGNORE_DEF_FLAT]: 0
      },
      actionBarPosition: 0,
      statuses: [],
      isDead: false,
      equipment: [],
      maxHp: 10000,
      currentHp: 10000,
      takeDamage: () => {},
      addStatus: () => {},
      removeStatus: () => {}
    };
    
    target = {
      instanceId: 'target',
      characterId: 'target1',
      currentStats: {
        [StatType.ATK]: 800,
        [StatType.DEF]: 500,
        [StatType.HP]: 10000,
        [StatType.SPD]: 100,
        [StatType.CRIT]: 0.1,
        [StatType.CRIT_DMG]: 0.5,
        [StatType.ATK_P]: 0,
        [StatType.DEF_P]: 0,
        [StatType.HP_P]: 0,
        [StatType.DMG_BONUS]: 0,
        [StatType.DMG_TAKEN_BONUS]: 0,
        [StatType.IGNORE_DEF_P]: 0,
        [StatType.IGNORE_DEF_FLAT]: 0
      },
      actionBarPosition: 0,
      statuses: [],
      isDead: false,
      equipment: [],
      maxHp: 10000,
      currentHp: 10000,
      takeDamage: () => {},
      addStatus: () => {},
      removeStatus: () => {}
    };
  });
  
  it('should calculate base attack correctly', () => {
    const baseAttack = calculator.calculateBaseAttack(attacker);
    expect(baseAttack).toBe(1000);
  });
  
  it('should apply attack buffs correctly', () => {
    // 添加攻击增益
    attacker.statuses = [{
      statusId: 'atk_buff',
      remainingTurns: 2,
      stackCount: 1,
      type: BuffType.ATK_UP,
      effect: { value: 0.2 }
    }];
    
    const attack = calculator.calculateAttackBonus(attacker, 1);
    expect(attack).toBe(1.2); // 20%加成
  });
  
  it('should calculate defense reduction correctly', () => {
    // 无增益时
    let reduction = calculator.calculateDefenseReduction(attacker, target);
    expect(reduction).toBeCloseTo(1000 / (1000 + 500 * 2), 5);
    
    // 添加忽略防御
    attacker.currentStats[StatType.IGNORE_DEF_P] = 0.3;
    attacker.currentStats[StatType.IGNORE_DEF_FLAT] = 100;
    
    reduction = calculator.calculateDefenseReduction(attacker, target);
    const effectiveDefense = 500 - 100 - (500 * 0.3); // 500 - 100 - 150 = 250
    expect(reduction).toBeCloseTo(1000 / (1000 + effectiveDefense * 2), 5);
  });
  
  it('should check critical hit correctly', () => {
    // 强制暴击
    calculator.setRandom(() => 0.05); // 5%随机值 < 10%暴击率
    const result = calculator.checkCritical(attacker);
    expect(result.isCritical).toBe(true);
    expect(result.criticalMultiplier).toBe(1.5); // 1 + 0.5
    
    // 强制不暴击
    calculator.setRandom(() => 0.15); // 15%随机值 > 10%暴击率
    const noCritResult = calculator.checkCritical(attacker);
    expect(noCritResult.isCritical).toBe(false);
    expect(noCritResult.criticalMultiplier).toBe(1);
  });
  
  it('should calculate final damage correctly', () => {
    // 基础伤害计算
    const damage = calculator.calculateDamage(attacker, target, 1, 0);
    expect(damage).toBeGreaterThan(0);
    
    // 有伤害加成
    attacker.currentStats[StatType.DMG_BONUS] = 0.5;
    const damageWithBonus = calculator.calculateDamage(attacker, target, 1, 0);
    expect(damageWithBonus).toBeGreaterThan(damage);
    
    // 目标受到额外伤害
    target.currentStats[StatType.DMG_TAKEN_BONUS] = 0.3;
    const damageWithTakenBonus = calculator.calculateDamage(attacker, target, 1, 0);
    expect(damageWithTakenBonus).toBeGreaterThan(damageWithBonus);
  });
  
  it('should calculate heal correctly', () => {
    const heal = calculator.calculateHeal(attacker, 0.5);
    expect(heal).toBe(5000); // 10000 * 0.5 = 5000
    
    // 添加治疗加成
    attacker.statuses = [{
      statusId: 'heal_buff',
      remainingTurns: 2,
      stackCount: 1,
      type: BuffType.HEAL_BONUS,
      effect: { value: 0.3 }
    }];
    
    const healWithBonus = calculator.calculateHeal(attacker, 0.5);
    expect(healWithBonus).toBe(6500); // 5000 * 1.3 = 6500
  });
  
  it('should clamp damage within limits', () => {
    // 最小伤害
    target.currentStats[StatType.DEF] = 100000;
    const minDamage = calculator.calculateDamage(attacker, target, 1, 0);
    expect(minDamage).toBe(1); // 至少造成1点伤害
    
    // 最大伤害
    target.currentStats[StatType.DEF] = 0;
    attacker.currentStats[StatType.DMG_BONUS] = 100;
    const maxDamage = calculator.calculateDamage(attacker, target, 1, 0);
    expect(maxDamage).toBe(99999); // 最大伤害限制
  });
});
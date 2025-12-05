import { describe, it, expect, beforeEach } from 'vitest';
import { DamageCalculator } from '../../../../src/core/battle/DamageCalculator';
import { StatType } from '../../../../src/core/types/definitions';
import type { CharacterInstance, CharacterStatus } from '../../../../src/core/types/battle';

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
      baseStats: {
        [StatType.ATK]: 1000,
        [StatType.DEF]: 500,
        [StatType.HP]: 10000,
        [StatType.SPD]: 100,
        [StatType.CRIT]: 0.1,
        [StatType.CRIT_DMG]: 0.5
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
        [StatType.SPD_P]: 0,
        [StatType.HEAL_BONUS]: 0,
        [StatType.RECEIVE_HEAL_BONUS]: 0,
        [StatType.DMG_BONUS]: 0,
        [StatType.DMG_TAKEN_BONUS]: 0,
        [StatType.IGNORE_DEF_P]: 0,
        [StatType.IGNORE_DEF_FLAT]: 0,
      },
      baseStats: {
        [StatType.ATK]: 800,
        [StatType.DEF]: 500,
        [StatType.HP]: 10000,
        [StatType.SPD]: 100
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
    const baseAttack = calculator.calculateBaseStat(attacker, StatType.ATK);
    expect(baseAttack).toBe(1000);
  });
  
  it('should calculate attack bonus correctly', () => {
    // 测试攻击加成计算
    attacker.currentStats[StatType.ATK_P] = 20; // 20%攻击加成
    
    const attack = calculator.calculateStatBonus(attacker, StatType.ATK);
    expect(attack).toBeCloseTo(0.2, 5); // 20%加成，返回小数
  });
  
  it('should calculate effective defense correctly', () => {
    // 无增益时
    let effectiveDefense = calculator.calculateEffectiveDefense(attacker, target);
    expect(effectiveDefense).toBeCloseTo(500, 5); // 基础防御值
    
    // 添加忽略防御
    attacker.currentStats[StatType.IGNORE_DEF_P] = 30; // 30%忽略防御
    attacker.currentStats[StatType.IGNORE_DEF_FLAT] = 100;
    
    effectiveDefense = calculator.calculateEffectiveDefense(attacker, target);
    // (1 - 0.3) × (500 - 100) × (1 + 0) = 280
    const expectedDefense = Math.max(0, (1 - 0.3) * (500 - 100) * (1 + 0));
    expect(effectiveDefense).toBeCloseTo(expectedDefense, 5);
  });
  
  it('should apply 300/300+def formula to damage calculation', () => {
    // 清除所有可能影响的状态和属性
    attacker.currentStats[StatType.IGNORE_DEF_P] = 0;
    attacker.currentStats[StatType.IGNORE_DEF_FLAT] = 0;
    attacker.currentStats[StatType.CRIT] = 0; // 禁用暴击以获得稳定结果
    
    // 设置基础攻击1000，目标防御300
    attacker.currentStats[StatType.ATK] = 1000;
    target.currentStats[StatType.DEF] = 300;
    
    // 计算伤害
    const damageResult = calculator.calculateDamage(attacker, target, 1.0);
    
    // 期望伤害：1000 * (300 / (300 + 300)) = 500
    expect(damageResult.damage).toBeCloseTo(500, 0);
    
    // 测试防御为0的情况
    target.currentStats[StatType.DEF] = 0;
    const maxDamageResult = calculator.calculateDamage(attacker, target, 1.0);
    // 期望伤害：1000 * (300 / 300) = 1000
    expect(maxDamageResult.damage).toBeCloseTo(1000, 0);
  });
  
  it('should check critical hit correctly', () => {
    // 测试暴击率逻辑
    // 注意：由于使用Math.random()，我们无法精确测试，但可以测试边界条件
    
    // 测试0%暴击率
    attacker.currentStats[StatType.CRIT] = 0;
    let noCrit = true;
    for (let i = 0; i < 100; i++) {
      if (calculator.checkCritical(attacker)) {
        noCrit = false;
        break;
      }
    }
    expect(noCrit).toBe(true);
    
    // 测试100%暴击率
    attacker.currentStats[StatType.CRIT] = 1.0;
    let alwaysCrit = true;
    for (let i = 0; i < 100; i++) {
      if (!calculator.checkCritical(attacker)) {
        alwaysCrit = false;
        break;
      }
    }
    expect(alwaysCrit).toBe(true);
  });
  
  it('should calculate final damage with attack percentage bonus', () => {
    // 重置属性以便测试
    attacker.currentStats[StatType.ATK] = 1000;
    attacker.currentStats[StatType.IGNORE_DEF_P] = 0;
    attacker.currentStats[StatType.IGNORE_DEF_FLAT] = 0;
    attacker.currentStats[StatType.CRIT] = 0; // 禁用暴击
    target.currentStats[StatType.DEF] = 300;
    
    // 基础伤害计算
    const baseResult = calculator.calculateDamage(attacker, target, 1.0);
    
    // 添加攻击百分比加成
    attacker.currentStats[StatType.ATK_P] = 50; // 50%攻击加成
    
    const bonusResult = calculator.calculateDamage(attacker, target, 1.0);
    
    // 期望伤害：基础伤害 * 1.5（由于攻击百分比加成）
    expect(bonusResult.damage).toBeCloseTo(baseResult.damage * 1.5, 0);
  });
  
  it('should calculate heal with healer and target correctly', () => {
    // 准备测试环境
    attacker.currentStats[StatType.HP] = 10000; // 治疗者最大生命值10000
    attacker.currentStats[StatType.HP_P] = 0;    // 无生命百分比加成
    attacker.currentStats[StatType.CRIT] = 0;    // 禁用暴击以获得稳定结果
    (attacker.currentStats as any).HEAL_BONUS = 0;        // 无治疗加成
    (target.currentStats as any).RECEIVE_HEAL_BONUS = 0;  // 无承受治疗加成
    
    // 目标受伤，以便测试治疗
    target.currentHp = 5000; // 目标当前生命值5000
    
    // 计算基础治疗量（基于生命，系数0.1）
    const healResult = calculator.calculateHeal(attacker, target, 0.1);
    
    // 期望治疗量：10000 * 0.1 = 1000
    expect(healResult.healAmount).toBeCloseTo(1000, 0);
    expect(healResult.isCritical).toBe(false);
  });
  
  it('should apply critical hit to healing', () => {
    // 设置100%暴击率和50%暴击伤害
    attacker.currentStats[StatType.HP] = 10000;
    attacker.currentStats[StatType.CRIT] = 1.0;    // 100%暴击率
    attacker.currentStats[StatType.CRIT_DMG] = 0.5; // 50%暴击伤害
    (attacker.currentStats as any).HEAL_BONUS = 0;
    (target.currentStats as any).RECEIVE_HEAL_BONUS = 0;
    target.currentHp = 5000;
    
    const healResult = calculator.calculateHeal(attacker, target, 0.1);
    
    // 期望治疗量：10000 * 0.1 * 1.5（暴击伤害）= 1500
    expect(healResult.healAmount).toBeCloseTo(1500, 0);
    expect(healResult.isCritical).toBe(true);
    expect(healResult.criticalHeal).toBeCloseTo(1500, 0);
  });
  
  it('should apply heal bonus and receive heal bonus', () => {
    attacker.currentStats[StatType.HP] = 10000;
    attacker.currentStats[StatType.CRIT] = 0;
    (attacker.currentStats as any).HEAL_BONUS = 30; // 30%治疗加成
    (target.currentStats as any).RECEIVE_HEAL_BONUS = 20; // 20%承受治疗加成
    target.currentHp = 5000;
    
    const healResult = calculator.calculateHeal(attacker, target, 0.1);
    
    // 期望治疗量：10000 * 0.1 * (1 + 0.3 + 0.2) = 1500
    expect(healResult.healAmount).toBeCloseTo(1500, 0);
  });
  
  it('should respect heal limit (cannot exceed max HP)', () => {
    attacker.currentStats[StatType.HP] = 10000;
    attacker.currentStats[StatType.CRIT] = 0;
    (attacker.currentStats as any).HEAL_BONUS = 0;
    (target.currentStats as any).RECEIVE_HEAL_BONUS = 0;
    target.currentHp = 8000; // 当前生命值8000，最大10000
    
    // 尝试治疗一个很大的量
    const healResult = calculator.calculateHeal(attacker, target, 1.0);
    
    // 最多只能治疗2000点
    expect(healResult.healAmount).toBeCloseTo(2000, 0);
  });
  
  it('should calculate heal based on different base stats', () => {
    // 设置治疗者的属性
    attacker.currentStats[StatType.HP] = 10000;
    attacker.currentStats[StatType.ATK] = 2000; // 攻击力2000
    attacker.currentStats[StatType.CRIT] = 0;
    (target.currentStats as any).RECEIVE_HEAL_BONUS = 0;
    target.currentHp = 0; // 目标满血，确保治疗无上限
    
    // 基于攻击的治疗（系数0.5）
    const atkHealResult = calculator.calculateHeal(attacker, target, 0.5, StatType.ATK);
    
    // 期望治疗量：2000 * 0.5 = 1000
    expect(atkHealResult.healAmount).toBeCloseTo(1000, 0);
  });
  

  
  it('should clamp damage within limits', () => {
    // 根据实现，伤害范围是目标最大生命值的0.1%到9900%
    attacker.currentStats[StatType.CRIT] = 0; // 禁用暴击
    target.maxHp = 10000;
    
    // 测试最小伤害限制（1）
    attacker.currentStats[StatType.ATK] = 100;
    target.currentStats[StatType.DEF] = 100000;
    
    const minDamageResult = calculator.calculateDamage(attacker, target, 1.0);
    const expectedMinDamage = 1; // 1
    expect(minDamageResult.damage).toBeCloseTo(expectedMinDamage, 0);
    
    // 测试最大伤害限制（使用较大的伤害系数）
    attacker.currentStats[StatType.ATK] = 1000;
    target.currentStats[StatType.DEF] = 0;
    
    const maxDamageResult = calculator.calculateDamage(attacker, target, 100.0); // 很大的伤害系数
    const expectedMaxDamage = target.maxHp * 99.0; // 990000
    expect(maxDamageResult.damage).toBeLessThanOrEqual(expectedMaxDamage);
  });
});
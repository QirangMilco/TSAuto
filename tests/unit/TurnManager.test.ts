import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from '../../src/core/battle/TurnManager';
import { BuffType, StatType } from '../../src/core/types/definitions';
import type { CharacterInstance } from '../../src/core/types/battle';

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let character1: CharacterInstance;
  let character2: CharacterInstance;
  
  beforeEach(() => {
    turnManager = new TurnManager();
    
    // 创建测试角色实例
    character1 = {
      instanceId: 'char1',
      characterId: 'test1',
      currentStats: {
        [StatType.ATK]: 100,
        [StatType.DEF]: 50,
        [StatType.HP]: 1000,
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
      maxHp: 1000,
      currentHp: 1000,
      takeDamage: () => {},
      addStatus: () => {},
      removeStatus: () => {}
    };
    
    character2 = {
      ...character1,
      instanceId: 'char2',
      characterId: 'test2',
      currentStats: {
        ...character1.currentStats,
        [StatType.SPD]: 200
      }
    };
  });
  
  it('should calculate effective speed correctly', () => {
    const speed = turnManager.calculateEffectiveSpeed(character1);
    expect(speed).toBe(100);
  });
  
  it('should apply speed buffs correctly', () => {
    // 添加速度增益状态
    character1.statuses = [{
      statusId: 'speed_buff',
      remainingTurns: 2,
      stackCount: 1,
      type: BuffType.SPD_UP,
      effect: { value: 0.3 }
    }];
    
    const speed = turnManager.calculateEffectiveSpeed(character1);
    expect(speed).toBe(130); // 100 * 1.3 = 130
  });
  
  it('should clamp speed within limits', () => {
    // 设置极小速度
    character1.currentStats[StatType.SPD] = 1;
    let speed = turnManager.calculateEffectiveSpeed(character1);
    expect(speed).toBe(10); // 最小速度限制
    
    // 设置极大速度
    character1.currentStats[StatType.SPD] = 2000;
    speed = turnManager.calculateEffectiveSpeed(character1);
    expect(speed).toBe(1000); // 最大速度限制
  });
  
  it('should update action bar correctly', () => {
    const characters = [character1, character2];
    const ready = turnManager.updateActionBar(characters);
    
    expect(character1.actionBarPosition).toBe(100);
    expect(character2.actionBarPosition).toBe(200);
    expect(ready.length).toBe(0); // 都没满
  });
  
  it('should return characters with full action bar', () => {
    character1.actionBarPosition = 950;
    character2.actionBarPosition = 900;
    
    const ready = turnManager.updateActionBar([character1, character2]);
    
    expect(ready.length).toBe(2);
    expect(ready[0]).toBe(character1); // 先行动
    expect(ready[1]).toBe(character2);
  });
  
  it('should reset action bar correctly', () => {
    character1.actionBarPosition = 500;
    turnManager.resetActionBar(character1);
    expect(character1.actionBarPosition).toBe(0);
  });
  
  it('should adjust action bar correctly', () => {
    character1.actionBarPosition = 500;
    
    // 拉条30%
    turnManager.adjustActionBar(character1, 0.3);
    expect(character1.actionBarPosition).toBe(800); // 500 + 300 = 800
    
    // 推条20%
    turnManager.adjustActionBar(character1, -0.2);
    expect(character1.actionBarPosition).toBe(600); // 800 - 200 = 600
    
    // 边界测试
    turnManager.adjustActionBar(character1, 1.0);
    expect(character1.actionBarPosition).toBe(1000); // 最大值限制
    
    turnManager.adjustActionBar(character1, -2.0);
    expect(character1.actionBarPosition).toBe(0); // 最小值限制
  });
});
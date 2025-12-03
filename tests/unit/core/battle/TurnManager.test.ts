import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from '../../../../src/core/battle/TurnManager';
import { BuffType, StatType } from '../../../../src/core/types/definitions';
import type { CharacterInstance } from '../../../../src/core/types/battle';
import type { GameDataInterface } from '../../../../src/core/types/plugin';

// Mock GameData to support status lookups
class MockGameData implements GameDataInterface {
  getCharacter = () => undefined;
  getAllCharacters = () => [];
  getSkill = () => undefined;
  getAllSkills = () => [];
  getEquipment = () => undefined;
  getAllEquipment = () => [];
  
  // Implemented for the test
  getStatus(id: string) {
    if (id === 'speed_buff') {
      return {
        id: 'speed_buff',
        name: 'Speed Buff',
        type: BuffType.SPD_UP,
        statModifiers: {
          [StatType.SPD_P]: 30 // 30% speed boost
        }
      };
    }
    return undefined;
  }
  getAllStatuses = () => [];
  initialize = async () => {};
}

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let character1: CharacterInstance;
  let character2: CharacterInstance;
  let characters: CharacterInstance[];
  let mockGameData: MockGameData;
  
  beforeEach(() => {
    mockGameData = new MockGameData();
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
        [StatType.IGNORE_DEF_FLAT]: 0,
        [StatType.HEAL_BONUS]: 0,
        [StatType.RECEIVE_HEAL_BONUS]: 0
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
    
    characters = [character1, character2];
    // 现在构造函数需要传入角色列表和游戏数据接口
    turnManager = new TurnManager(characters, mockGameData);
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
      stackCount: 1
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
    // 重置角色的行动条位置
    character1.actionBarPosition = 0;
    character2.actionBarPosition = 0;
    
    // 调用updateActionBar，会重新计算全场一速并更新行动条位置
    const ready = turnManager.updateActionBar(characters);
    const globalFastestSpeed = turnManager.getGlobalFastestSpeed();
    
    // 检查行动条位置更新
    expect(character1.actionBarPosition).toBe(100);
    expect(character2.actionBarPosition).toBe(200);
    
    // 由于character2的速度等于全场一速，行动条位置会被设置为等于全场一速，所以应该被标记为准备行动
    expect(ready.length).toBe(1);
    expect(ready[0]).toBe(character2); // 应该是速度最快的角色
    expect(globalFastestSpeed).toBe(200); // 全场一速是200
  });
  
  it('should return character when action bar is full', () => {
    // 设置角色行动条到接近满的值
    const globalFastestSpeed = turnManager.getGlobalFastestSpeed();
    character1.actionBarPosition = globalFastestSpeed - 10;
    character2.actionBarPosition = globalFastestSpeed - 20;
    
    // 调用updateActionBar，应该让角色行动条填满
    const ready = turnManager.updateActionBar(characters);
    
    // 应该有角色准备行动
    expect(ready.length).toBeGreaterThan(0);
    // 角色的行动条位置应该 >= 全场一速
    ready.forEach(char => {
      expect(char.actionBarPosition).toBeGreaterThanOrEqual(globalFastestSpeed);
    });
  });
  
  it('should recalculate global speed when characters change', () => {
    // 创建一个更快的角色
    const fastCharacter: CharacterInstance = {
      ...character1,
      instanceId: 'char3',
      characterId: 'test3',
      currentStats: {
        ...character1.currentStats,
        [StatType.SPD]: 300
      }
    };
    
    const newCharacters = [...characters, fastCharacter];
    turnManager.recalculateGlobalSpeed(newCharacters);
    
    expect(turnManager.getGlobalFastestSpeed()).toBe(300);
  });
  
  it('should return characters with full action bar', () => {
    const globalFastestSpeed = turnManager.getGlobalFastestSpeed();
    
    character1.actionBarPosition = globalFastestSpeed - 50;
    character2.actionBarPosition = globalFastestSpeed - 100;
    
    const ready = turnManager.updateActionBar(characters);
    
    // 更新后应该都满了
    expect(ready.length).toBe(2);
    expect(ready[0].actionBarPosition).toBeGreaterThanOrEqual(globalFastestSpeed);
    expect(ready[1].actionBarPosition).toBeGreaterThanOrEqual(globalFastestSpeed);
  });
  
  it('should reset action bar correctly', () => {
    const globalFastestSpeed = turnManager.getGlobalFastestSpeed();
    character1.actionBarPosition = 500;
    turnManager.resetActionBar(character1);
    // 根据CTB机制，重置行动条应该减去全场一速值，而不是直接重置为0
    expect(character1.actionBarPosition).toBe(500 - globalFastestSpeed);
  });
  
  it('should adjust action bar correctly', () => {
    const globalFastestSpeed = turnManager.getGlobalFastestSpeed();
    character1.actionBarPosition = globalFastestSpeed * 0.5; // 50%
    
    // 拉条30%
    turnManager.adjustActionBar(character1, 0.3);
    expect(character1.actionBarPosition).toBe(globalFastestSpeed * 0.8); // 50% + 30% = 80%
    
    // 推条20%
    turnManager.adjustActionBar(character1, -0.2);
    expect(character1.actionBarPosition).toBe(globalFastestSpeed * 0.6); // 80% - 20% = 60%
    
    // 边界测试
    turnManager.adjustActionBar(character1, 1.0);
    expect(character1.actionBarPosition).toBe(globalFastestSpeed); // 最大值限制
    
    turnManager.adjustActionBar(character1, -2.0);
    expect(character1.actionBarPosition).toBe(0); // 最小值限制
  });
});
import type { CharacterInstance, CharacterStatus } from '../types/battle';
import { BuffType } from '../types/definitions';
import type { GameDataInterface } from '../types/plugin';

/**
 * 行动条管理器
 * 负责处理角色行动顺序、速度计算和行动条进度
 */
export class TurnManager {
  private static readonly MIN_SPEED = 10;        // 最小速度
  private static readonly MAX_SPEED = 1000;      // 最大速度
  private globalFastestSpeed: number = 100;     // 全场一速，默认为100
  private gameData?: GameDataInterface;         // 游戏数据访问接口
  
  /**
   * 构造函数
   * @param characters 所有角色实例，用于计算全场一速
   * @param gameData 游戏数据访问接口，用于获取状态定义
   */
  constructor(characters: CharacterInstance[] = [], gameData?: GameDataInterface) {
    this.gameData = gameData;
    if (characters.length > 0) {
      this.recalculateGlobalSpeed(characters);
    }
  }

  /**
   * 设置游戏数据访问接口
   * @param gameData 游戏数据访问接口
   */
  public setGameData(gameData: GameDataInterface): void {
    this.gameData = gameData;
  }
  
  /**
   * 重新计算全场一速
   * @param characters 所有角色实例
   */
  public recalculateGlobalSpeed(characters: CharacterInstance[]): void {
    // 获取所有存活单位的当前速度的最大值
    const aliveCharacters = characters.filter(c => !c.isDead);
    if (aliveCharacters.length > 0) {
      this.globalFastestSpeed = Math.max(
        ...aliveCharacters.map(c => this.calculateEffectiveSpeed(c))
      );
    } else {
      this.globalFastestSpeed = 100; // 默认值
    }
  }
  
  /**
   * 计算所有角色的行动条增量并更新位置
   * @param characters 所有角色实例
   * @returns 达到行动条满值的角色
   */
  public updateActionBar(characters: CharacterInstance[]): CharacterInstance[] {
    const readyCharacters: CharacterInstance[] = [];
    
    // 先更新全场一速
    this.recalculateGlobalSpeed(characters);
    
    // 计算每个角色到达终点所需的时间
    const timeToFinish: Map<CharacterInstance, number> = new Map();
    let minTime = Infinity;
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      // 计算实际速度
      const effectiveSpeed = this.calculateEffectiveSpeed(character);
      
      // 距离终点长度 = 全场一速 - 当前位置
      const distanceToEnd = this.globalFastestSpeed - character.actionBarPosition;
      
      // 到达终点时间 = 距离终点长度 ÷ 速度
      const time = distanceToEnd / effectiveSpeed;
      timeToFinish.set(character, time);
      
      // 找到最短时间
      if (time < minTime) {
        minTime = time;
      }
    }
    
    // 更新所有角色的行动条位置
    for (const character of characters) {
      if (character.isDead) continue;
      
      // 计算实际速度
      const effectiveSpeed = this.calculateEffectiveSpeed(character);
      
      // 更新行动条位置 = 当前位置 + 速度 × 最短时间
      character.actionBarPosition += effectiveSpeed * minTime;
      
      // 检查是否准备行动
      if (character.actionBarPosition >= this.globalFastestSpeed) {
        readyCharacters.push(character);
      }
    }
    
    return readyCharacters.sort((a, b) => {
      // 先按行动条位置排序，位置高的先行动
      const positionDiff = b.actionBarPosition - a.actionBarPosition;
      if (positionDiff !== 0) {
        return positionDiff;
      }
      
      // 位置相同时，速度慢的己方优先（怪物例外）
      // 这里简化处理，按速度从小到大排序
      return a.currentStats.SPD - b.currentStats.SPD;
    });
  }
  
  /**
   * 计算角色的实际速度（考虑增益/减益）
   */
  public calculateEffectiveSpeed(character: CharacterInstance): number {
    let baseSpeed = character.currentStats.SPD || 0;
    
    // 获取速度增益/减益
    const speedModifier = this.getSpeedBuffs(character);
    
    // 应用速度加成
    let effectiveSpeed = baseSpeed * (1 + speedModifier);
    
    // 确保在合理范围内
    effectiveSpeed = Math.max(TurnManager.MIN_SPEED, 
                             Math.min(TurnManager.MAX_SPEED, effectiveSpeed));
    
    return effectiveSpeed;
  }
  
  /**
   * 获取角色的速度加成总和
   */
  public getSpeedBuffs(character: CharacterInstance): number {
    let totalModifier = 0;
    
    // 如果没有游戏数据接口，返回0
    if (!this.gameData) {
      return totalModifier;
    }
    
    for (const status of character.statuses) {
      // 通过statusId从游戏数据中获取状态定义
      const statusDefinition = this.gameData!.getStatus(status.statusId);
      
      // 检查状态定义是否存在并且类型为速度提升
      if (statusDefinition && statusDefinition.type === BuffType.SPD_UP) {
        // 从状态定义的statModifiers中获取速度加成
        // 注意：这里假设速度加成存储在SPD_P属性中，需要根据实际设计调整
        const speedBonus = statusDefinition.statModifiers?.SPD_P || 0;
        totalModifier += speedBonus / 100; // 转换为小数
      }
    }
    
    return totalModifier;
  }
  
  /**
   * 重置角色行动条
   */
  public resetActionBar(character: CharacterInstance): void {
    character.actionBarPosition -= this.globalFastestSpeed;
  }
  
  /**
   * 调整角色行动条位置
   * @param character 角色实例
   * @param percent 百分比值（正值为拉条，负值为推条）
   */
  public adjustActionBar(character: CharacterInstance, percent: number): void {
    const amount = this.globalFastestSpeed * percent;
    character.actionBarPosition = Math.max(0, 
      Math.min(this.globalFastestSpeed, 
        character.actionBarPosition + amount));
  }
  
  /**
   * 获取当前全场一速值
   */
  public getGlobalFastestSpeed(): number {
    return this.globalFastestSpeed;
  }
  
  /**
   * 获取当前行动条满值（即全场一速）
   */
  public getCurrentMaxActionBar(): number {
    return this.globalFastestSpeed;
  }
}
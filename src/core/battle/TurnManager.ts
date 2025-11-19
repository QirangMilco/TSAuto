import type { CharacterInstance, CharacterStatus } from '../types/battle';
import { BuffType } from '../types/definitions';

/**
 * 行动条管理器
 * 负责处理角色行动顺序、速度计算和行动条进度
 */
export class TurnManager {
  private static readonly MIN_SPEED = 10;        // 最小速度
  private static readonly MAX_SPEED = 1000;      // 最大速度
  private globalFastestSpeed: number = 100;     // 全场一速，默认为100
  
  /**
   * 构造函数
   * @param characters 所有角色实例，用于计算全场一速
   */
  constructor(characters: CharacterInstance[] = []) {
    if (characters.length > 0) {
      this.recalculateGlobalSpeed(characters);
    }
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
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      // 计算实际速度
      const effectiveSpeed = this.calculateEffectiveSpeed(character);
      
      // 更新行动条位置
      character.actionBarPosition += effectiveSpeed;
      
      // 检查是否准备行动
      if (character.actionBarPosition >= this.globalFastestSpeed) {
        readyCharacters.push(character);
      }
    }
    
    return readyCharacters.sort((a, b) => 
      b.actionBarPosition - a.actionBarPosition // 速度快的先行动
    );
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
    
    for (const status of character.statuses) {
      // 直接使用类型断言获取所需属性
      const typedStatus = status as CharacterStatus & { 
        type?: BuffType; 
        effect?: { value: number };
      };
      
      if (typedStatus.type === BuffType.SPD_UP) {
        totalModifier += typedStatus.effect?.value || 0;
      }
    }
    
    return totalModifier;
  }
  
  /**
   * 重置角色行动条
   */
  public resetActionBar(character: CharacterInstance): void {
    character.actionBarPosition = 0;
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
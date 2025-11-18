import type { CharacterInstance, CharacterStatus } from '../types/battle';
import { BuffType } from '../types/definitions';

/**
 * 行动条管理器
 * 负责处理角色行动顺序、速度计算和行动条进度
 */
export class TurnManager {
  private static readonly MAX_ACTION_BAR = 1000; // 行动条满值
  private static readonly MIN_SPEED = 10;        // 最小速度
  private static readonly MAX_SPEED = 1000;      // 最大速度
  
  /**
   * 计算所有角色的行动条增量并更新位置
   * @param characters 所有角色实例
   * @returns 达到行动条满值的角色
   */
  public updateActionBar(characters: CharacterInstance[]): CharacterInstance[] {
    const readyCharacters: CharacterInstance[] = [];
    
    for (const character of characters) {
      if (character.isDead) continue;
      
      // 计算实际速度
      const effectiveSpeed = this.calculateEffectiveSpeed(character);
      
      // 更新行动条位置
      character.actionBarPosition += effectiveSpeed;
      
      // 检查是否准备行动
      if (character.actionBarPosition >= TurnManager.MAX_ACTION_BAR) {
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
   */
  public adjustActionBar(character: CharacterInstance, amount: number): void {
    character.actionBarPosition = Math.max(0, 
      Math.min(TurnManager.MAX_ACTION_BAR, 
        character.actionBarPosition + (amount * TurnManager.MAX_ACTION_BAR)));
  }
  
  /**
   * 获取行动条满值常量
   */
  public static getMaxActionBar(): number {
    return TurnManager.MAX_ACTION_BAR;
  }
}
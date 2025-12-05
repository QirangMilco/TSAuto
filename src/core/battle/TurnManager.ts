import type { CharacterInstance, CharacterStatus } from '../types/battle';
import { BuffType, TurnType, StatType } from '../types/definitions';
import type { GameDataInterface } from '../types/plugin';

/**
 * 就绪的回合信息
 */
export interface ReadyTurn {
  characterId: string; // 角色实例ID
  turnType: TurnType;  // 回合类型
  character?: CharacterInstance; // 为了兼容旧代码，可选携带实例引用
}

/**
 * 行动条管理器
 * 负责处理角色行动顺序、速度计算和行动条进度
 */
export class TurnManager {
  private static readonly MIN_SPEED = 10;        // 最小速度
  private static readonly MAX_SPEED = 1000;      // 最大速度
  private globalFastestSpeed: number = 100;     // 全场一速，默认为100
  private gameData?: GameDataInterface;         // 游戏数据访问接口
  private extraTurnQueue: string[] = [];        // 额外回合队列
  
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
   * 插入额外回合
   * @param characterId 角色实例ID
   */
  public grantExtraTurn(characterId: string): void {
    // 将角色加入额外回合队列
    this.extraTurnQueue.push(characterId);
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
   * @returns 准备好行动的角色列表 (包含回合类型信息)
   */
  public updateActionBar(characters: CharacterInstance[]): ReadyTurn[] {
    const readyTurns: ReadyTurn[] = [];

    // 1. 优先处理额外回合
    if (this.extraTurnQueue.length > 0) {
      // 一次只处理一个额外回合，或者全部处理？通常一次处理一个比较安全，防止逻辑冲突
      // 这里我们将队列中第一个取出来
      const id = this.extraTurnQueue.shift()!;
      // 找到对应的角色实例 (为了方便上层调用，虽然ReadyTurn只要求ID)
      const char = characters.find(c => c.instanceId === id);
      if (char && !char.isDead) {
          readyTurns.push({ 
            characterId: id, 
            turnType: TurnType.EXTRA,
            character: char 
          });
          return readyTurns; // 如果有额外回合，优先返回，不推进正常时间
      }
    }
    
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
    
    // 排序并转换为 ReadyTurn
    readyCharacters.sort((a, b) => {
      // 先按行动条位置排序，位置高的先行动
      const positionDiff = b.actionBarPosition - a.actionBarPosition;
      if (positionDiff !== 0) {
        return positionDiff;
      }
      
      // 位置相同时，速度慢的己方优先（怪物例外）
      // 这里简化处理，按速度从小到大排序
      return a.currentStats.SPD - b.currentStats.SPD;
    }).forEach(char => {
        readyTurns.push({
            characterId: char.instanceId,
            turnType: TurnType.NORMAL,
            character: char
        });
    });

    return readyTurns;
  }
  
  /**
   * 计算角色的实际速度（考虑增益/减益）
   */
  public calculateEffectiveSpeed(character: CharacterInstance): number {
    // 直接使用 StatsCalculator 计算后的最终速度
    // StatsCalculator 已经处理了所有属性加成（包括来自状态的 SPD_P 和 SPD）
    // 注意：这里假设 StatsCalculator 已经正确更新到了 character.currentStats[StatType.SPD]
    // 或者我们可以直接调用 StatsCalculator.getFinalStat?
    // 为了性能，我们通常相信 currentStats 是最新的（在回合开始/状态变化时更新）
    // 但如果需要确保实时性且不信任 currentStats，可以调用 StatsCalculator.getFinalStat
    // 这里我们信任 character.currentStats.SPD 是最终值
    
    let effectiveSpeed = character.currentStats[StatType.SPD] || 0;
    
    // 确保在合理范围内
    effectiveSpeed = Math.max(TurnManager.MIN_SPEED, 
                             Math.min(TurnManager.MAX_SPEED, effectiveSpeed));
    
    return effectiveSpeed;
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
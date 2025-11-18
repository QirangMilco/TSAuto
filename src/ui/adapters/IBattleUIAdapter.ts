import type { BattleState, BattleEvent, PlayerAction } from '../../core/types/battle';
import { BattleEventType } from '../../core/types/definitions';

/**
 * 战斗UI适配器接口
 * 定义了核心战斗系统与UI层交互的标准接口
 */
export interface IBattleUIAdapter {
  /**
   * 开始战斗
   */
  startBattle(): void;
  
  /**
   * 执行玩家动作
   */
  executePlayerAction(action: PlayerAction): void;
  
  /**
   * 重置战斗
   */
  resetBattle(): void;
  
  /**
   * 获取当前战斗状态
   */
  getBattleState(): BattleState;
  
  /**
   * 添加战斗事件监听器
   */
  addEventListener(type: BattleEventType, callback: (event: BattleEvent) => void): void;
  
  /**
   * 移除战斗事件监听器
   */
  removeEventListener(type: BattleEventType, callback: (event: BattleEvent) => void): void;
  
  /**
   * 更新UI显示
   * 当战斗状态改变时调用
   */
  updateUI(state: BattleState): void;
}
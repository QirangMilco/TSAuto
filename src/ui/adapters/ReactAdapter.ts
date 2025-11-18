import { create } from 'zustand';
import { IBattleUIAdapter } from './IBattleUIAdapter';
import type { BattleState, BattleEvent, PlayerAction } from '../../core/types/battle';
import type { GameDataInterface } from '../../core/types/plugin';
import { BattleEventType } from '../../core/types/definitions';
import { BattleEngine } from '../../core/battle/BattleEngine';

/**
 * React适配器状态类型
 */
interface BattleStoreState {
  battleState: BattleState;
  isLoading: boolean;
  error: string | null;
}

/**
 * React适配器动作类型
 */
interface BattleStoreActions {
  startBattle: () => void;
  executePlayerAction: (action: PlayerAction) => void;
  resetBattle: () => void;
  updateState: (newState: BattleState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * 战斗状态存储类型
 */
type BattleStore = BattleStoreState & BattleStoreActions;

/**
 * React适配器
 * 连接战斗系统和React前端，使用Zustand进行状态管理
 */
export class ReactAdapter implements IBattleUIAdapter {
  private battleEngine: BattleEngine;
  private eventListeners: Map<BattleEventType, ((event: BattleEvent) => void)[]> = new Map();
  
  // Zustand存储
  private store: any;
  
  constructor(gameData: GameDataInterface) {
    this.battleEngine = new BattleEngine(gameData);
    
    // 初始化Zustand存储
    this.store = create<BattleStore>((set) => ({
      battleState: this.battleEngine.getBattleState(),
      isLoading: false,
      error: null,
      
      startBattle: () => this.startBattle(),
      executePlayerAction: (action) => this.executePlayerAction(action),
      resetBattle: () => this.resetBattle(),
      updateState: (newState) => set({ battleState: newState }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error })
    }));
    
    // 注册战斗引擎事件监听器
    this.registerBattleEngineListeners();
  }
  
  /**
   * 注册战斗引擎事件监听器
   */
  private registerBattleEngineListeners(): void {
    // 监听所有战斗事件
    Object.values(BattleEventType).forEach((eventType) => {
      this.battleEngine.addEventListener(eventType, (event) => {
        this.handleBattleEvent(eventType, event);
      });
    });
  }
  
  /**
   * 处理战斗事件
   */
  private handleBattleEvent(type: BattleEventType, event: BattleEvent): void {
    // 更新UI状态
    const newState = this.battleEngine.getBattleState();
    this.store.getState().updateState(newState);
    
    // 触发UI层注册的监听器
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
  
  /**
   * 开始战斗
   */
  public startBattle(): void {
    try {
      this.store.getState().setLoading(true);
      this.store.getState().setError(null);
      
      // 在新线程中运行战斗循环（简化实现）
      setTimeout(() => {
        this.battleEngine.startBattle();
        this.store.getState().setLoading(false);
      }, 0);
    } catch (error) {
      this.store.getState().setError((error as Error).message);
      this.store.getState().setLoading(false);
    }
  }
  
  /**
   * 执行玩家动作
   */
  public executePlayerAction(action: PlayerAction): void {
    try {
      this.battleEngine.executePlayerAction(action);
    } catch (error) {
      this.store.getState().setError((error as Error).message);
    }
  }
  
  /**
   * 重置战斗
   */
  public resetBattle(): void {
    try {
      // 创建新的战斗引擎实例
      this.battleEngine = new BattleEngine(this.battleEngine['gameData']);
      
      // 更新状态
      const newState = this.battleEngine.getBattleState();
      this.store.getState().updateState(newState);
      this.store.getState().setError(null);
      
      // 重新注册事件监听器
      this.registerBattleEngineListeners();
    } catch (error) {
      this.store.getState().setError((error as Error).message);
    }
  }
  
  /**
   * 获取当前战斗状态
   */
  public getBattleState(): BattleState {
    return this.store.getState().battleState;
  }
  
  /**
   * 添加战斗事件监听器
   */
  public addEventListener(type: BattleEventType, callback: (event: BattleEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(callback);
  }
  
  /**
   * 移除战斗事件监听器
   */
  public removeEventListener(type: BattleEventType, callback: (event: BattleEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 更新UI显示
   */
  public updateUI(state: BattleState): void {
    this.store.getState().updateState(state);
  }
  
  /**
   * 获取Zustand存储钩子
   * 供React组件使用
   */
  public useBattleStore() {
    return this.store;
  }
}
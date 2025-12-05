import type { StatType, BuffType, TurnType } from './definitions';

/**
 * 战斗状态相关类型
 */

/**
 * 角色实例 (运行时状态)
 */
export interface CharacterInstance {
  instanceId: string; // 实例ID (唯一)
  characterId: string; // 角色定义ID
  name: string; // 角色名称
  
  // 当前面板属性 (计算后)
  currentStats: Record<StatType, number>;

  // 基础属性 (未加成，用于计算基准)
  baseStats: Record<StatType, number>;
  
  // 行动条状态
  actionBarPosition: number; // 当前位置 (0-全场一速)
  
  // 状态管理
  statuses: CharacterStatus[];
  
  // 生命状态
  isDead: boolean;
  
  // 装备
  equipment: string[]; // 装备实例ID数组
  
  // 生命值
  maxHp: number;
  currentHp: number;
  
  // 技能列表
  skills: string[]; // 技能ID列表

  // AI配置
  gambitId?: string;

  // 方法
  takeDamage(damage: number): void;
  addStatus(statusId: string, duration?: number): void;
  removeStatus(statusId: string): void;
}

/**
 * 角色状态实例
 */
export interface CharacterStatus {
  statusId: string; // 状态定义ID
  remainingTurns: number; // 剩余回合数
  stackCount: number; // 叠加层数
  type?: BuffType; // 状态类型
  effect?: { value: number }; // 效果值
  group?: string; // 状态组 (用于堆叠规则：同组同属性只取最大值)
}

/**
 * 战斗状态 (全局)
 */
export interface BattleState {
  battleId: string;
  round: number; // 当前回合数
  
  // 参战角色
  players: CharacterInstance[];
  enemies: CharacterInstance[];
  
  // 当前行动者
  activeCharacterId: string | null;
  
  // 战斗资源
  resourceManager: ResourceManager;
  
  // 战斗结果
  result: "IN_PROGRESS" | "VICTORY" | "DEFEAT";
}

/**
 * 资源管理器
 */
export interface ResourceManager {
  currentResource: number; // 当前资源量
  maxResource: number;     // 最大资源量
  resourceBar: number;     // 鬼火条进度 (0-5)
  
  advance(turns?: number, turnType?: TurnType): void; // 推进资源条
  consume(amount: number): boolean; // 消耗资源
}

/**
 * 战斗事件
 */
export interface BattleEvent {
  type: string;
  timestamp: number;
  data: any;
}

/**
 * 玩家动作
 */
export interface PlayerAction {
  skillId: string;
  targetId: string;
}
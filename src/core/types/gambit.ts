import type { StatType } from './definitions';

/**
 * Gambit 目标策略
 */
export enum GambitTargetType {
  SELF = 'SELF',
  ALLY = 'ALLY',
  ENEMY = 'ENEMY'
}

export enum GambitTargetStrategy {
  ANY = 'ANY',
  LOWEST_HP_PERCENT = 'LOWEST_HP_PERCENT', // 最低生命值百分比
  HIGHEST_ATK = 'HIGHEST_ATK',             // 最高攻击力
  RANDOM = 'RANDOM',                       // 随机
  SELF = 'SELF'                            // 自身
}

export interface GambitTarget {
  type: GambitTargetType;
  strategy: GambitTargetStrategy;
  parameter?: any; // 额外参数 (例如: "拥有状态 X 的队友")
}

/**
 * Gambit 条件
 */
export enum GambitConditionType {
  ALWAYS = 'ALWAYS',
  HP_BELOW = 'HP_BELOW',
  HP_ABOVE = 'HP_ABOVE',
  MP_BELOW = 'MP_BELOW',
  HAS_STATUS = 'HAS_STATUS',
  ALLY_DEAD = 'ALLY_DEAD',
  ENEMY_COUNT_ABOVE = 'ENEMY_COUNT_ABOVE'
}

export interface GambitCondition {
  type: GambitConditionType;
  value?: any; // 例如: 0.5 代表 50% HP, 或者 'status_id'
}

/**
 * Gambit 规则
 */
export interface GambitRule {
  id: string;
  name: string;
  priority: number; // 数值越小优先级越高
  condition: GambitCondition;
  target: GambitTarget;
  actionId: string; // 技能 ID
}

/**
 * Gambit 配置
 */
export interface Gambit {
  id: string;
  name: string;
  rules: GambitRule[];
}

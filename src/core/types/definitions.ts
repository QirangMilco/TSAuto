/**
 * TSAuto 游戏核心类型定义
 * ⚠️ 法律文件：禁止修改此文件中的接口定义
 */

// ==================== 基础枚举 ====================

export enum BattleEventType {
  ON_BATTLE_START = "ON_BATTLE_START",
  ON_TURN_START = "ON_TURN_START", 
  ON_TURN_END = "ON_TURN_END",
  ON_DAMAGE_DEALT = "ON_DAMAGE_DEALT",
  ON_HEAL_RECEIVED = "ON_HEAL_RECEIVED",
  ON_STATUS_APPLIED = "ON_STATUS_APPLIED",
  ON_STATUS_REMOVED = "ON_STATUS_REMOVED",
  ON_CHARACTER_DEATH = "ON_CHARACTER_DEATH",
  ON_PSEUDO_TURN_START = "ON_PSEUDO_TURN_START",
  ON_PSEUDO_TURN_END = "ON_PSEUDO_TURN_END",
  ON_SKILL_USED = "ON_SKILL_USED"
}

export enum TurnType {
  NORMAL = "NORMAL",           // 真回合 - 推进资源条
  NEW_TURN = "NEW_TURN",       // 新回合 - 不推进资源条
  PSEUDO_TURN = "PSEUDO_TURN"  // 伪回合 - 不推进资源条
}

export enum EffectType {
  DAMAGE = "DAMAGE",
  HEAL = "HEAL", 
  APPLY_STATUS = "APPLY_STATUS",
  MODIFY_ACTION_BAR = "MODIFY_ACTION_BAR",
  GAIN_EXTRA_TURN = "GAIN_EXTRA_TURN",
  TRIGGER_PSEUDO_TURN = "TRIGGER_PSEUDO_TURN",
  MODIFY_RESOURCE = "MODIFY_RESOURCE"
}

export enum TargetType {
  SELF = "SELF",
  TARGET = "TARGET", 
  ALL_ALLIES = "ALL_ALLIES",
  ALL_ENEMIES = "ALL_ENEMIES",
  RANDOM_ENEMY = "RANDOM_ENEMY",
  RANDOM_ALLY = "RANDOM_ALLY"
}

export enum StatType {
  // 基础属性
  HP = "HP",           // 生命值
  ATK = "ATK",         // 攻击
  DEF = "DEF",         // 防御  
  SPD = "SPD",         // 速度
  CRIT = "CRIT",       // 暴击率
  CRIT_DMG = "CRIT_DMG", // 暴击伤害
  
  // 百分比属性
  ATK_P = "ATK_P",     // 攻击加成(%)
  DEF_P = "DEF_P",     // 防御加成(%)
  HP_P = "HP_P",       // 生命加成(%)
  
  // 特殊属性
  DMG_BONUS = "DMG_BONUS",         // 伤害加成
  DMG_TAKEN_BONUS = "DMG_TAKEN_BONUS", // 承受伤害加成
  IGNORE_DEF_P = "IGNORE_DEF_P",   // 无视防御(%)
  IGNORE_DEF_FLAT = "IGNORE_DEF_FLAT", // 忽略防御(固定值)
  HEAL_BONUS = "HEAL_BONUS",       // 治疗加成
  RECEIVE_HEAL_BONUS = "RECEIVE_HEAL_BONUS" // 承受治疗加成
}

export enum BuffType {
  ATK_UP = "ATK_UP",           // 攻击提升
  DEF_UP = "DEF_UP",           // 防御提升
  SPD_UP = "SPD_UP",           // 速度提升
  INVINCIBLE = "INVINCIBLE",   // 无敌
  FROZEN = "FROZEN",           // 冰冻
  BURNING = "BURNING",         // 灼烧
  POISONED = "POISONED"        // 中毒
}

export enum ResourceType {
  BATTLE_RESOURCE = "BATTLE_RESOURCE"  // 战斗资源类型
}

// ==================== 核心接口 ====================

/**
 * 可执行效果
 * ⚠️ 这个接口定义了所有可能的技能效果
 */
export interface Effect {
  type: EffectType;
  target: TargetType;
  
  // MODIFY_ACTION_BAR 专用
  amount?: number; // 推拉条比例，如 0.3 = 拉条30%
  
  // GAIN_EXTRA_TURN & TRIGGER_PSEUDO_TURN 专用  
  pseudoTurnSkillId?: string;
  
  // DAMAGE 专用
  damageMultiplier?: number; // 伤害系数，如 1.2 = 120%攻击
  baseDamageStat?: StatType; // 基础伤害属性类型（用于伤害计算）
  
  // HEAL 专用
  healMultiplier?: number; // 治疗系数
  baseHealStat?: StatType; // 基础治疗属性类型（用于治疗计算）
  
  // APPLY_STATUS 专用
  statusId?: string; // 要施加的状态ID
  duration?: number; // 状态持续回合数
}

/**
 * 角色定义 (插件接口)
 */
export interface CharacterDefinition {
  id: string; // 唯一标识，如 "CHAR_1001"
  name: string; // 显示名称
  
  assets: {
    avatar: string; // 头像图片路径
    portrait: string; // 立绘图片路径
  };
  
  // 觉醒前
  growthValueBeforeAwake: {
    hp: number;     // 生命成长值
    atk: number;    // 攻击成长值
    def: number;    // 防御成长值
  }

  baseValueBeforeAwake: {
    spd: number;    // 速度
    crit: number;   // 暴击率
    critDmg: number; // 暴击伤害
  }

  // 觉醒后
  growthValueAfterAwake: {
    hp: number;     // 生命成长值
    atk: number;    // 攻击成长值
    def: number;    // 防御成长值
  }

  baseValueAfterAwake: {
    spd: number;    // 速度
    crit: number;   // 暴击率
    critDmg: number; // 暴击伤害
  }
  
  skills: [string, string, string]; // 技能ID数组
}

/**
 * 技能定义 (插件接口)
 */
export interface SkillDefinition {
  id: string; // 唯一标识，如 "SKILL_1001"
  name: string; // 技能名称
  
  // 技能消耗
  cost: {
    type: ResourceType; 
    amount: number;
  };
  
  activeEffects?: Effect[]; // 主动效果
  passiveListeners?: {     // 被动监听
    event: BattleEventType;
    effects: Effect[];
  }[];
  
  // 技能描述 (可选，用于UI显示)
  description?: string;
}

/**
 * 装备定义 (插件接口)
 */
export interface EquipmentDefinition {
  id: string; // 唯一标识，如 "EQUIP_2001"
  name: string; // 装备名称
  setId: string; // 套装ID
  slot: 1 | 2 | 3 | 4 | 5 | 6; // 装备位
  
  // 基础属性
  baseStats?: Partial<Record<StatType, number>>;
  
  // 副属性选项 (用于随机生成)
  possibleSecondaryStats?: StatType[];
}

/**
 * 状态定义 (插件接口)
 */
export interface StatusDefinition {
  id: string; // 唯一标识
  name: string; // 状态名称
  type: BuffType; // 状态类型
  
  duration?: number; // 持续回合数，undefined = 永久
  
  // 状态效果
  statModifiers?: Partial<Record<StatType, number>>;
  
  // 特殊行为
  onTurnStart?: Effect[]; // 回合开始时触发
  onTurnEnd?: Effect[];   // 回合结束时触发
  onReceiveDamage?: Effect[]; // 受到伤害时触发
}
/**
 * 游戏术语配置文件
 * 所有游戏内名词通过此配置文件引用，便于国际化和版权规避
 */

export interface TerminologyConfig {
  // 核心资源
  RESOURCE_NAME: string;         // 资源名称（如"鬼火"）
  RESOURCE_BAR_NAME: string;     // 资源条名称（如"鬼火条"）
  
  // 装备系统
  EQUIPMENT_NAME: string;        // 装备名称（如"御魂"）
  EQUIPMENT_SET_NAME: string;    // 装备套装名称（如"御魂套装"）
  EQUIPMENT_SLOT_NAME: string;   // 装备部位名称（如"御魂位置"）
  
  // 战斗相关
  ACTION_BAR_NAME: string;       // 行动条名称（如"行动条"）
  TURN_NAME: string;             // 回合名称（如"回合"）
  PSEUDO_TURN_NAME: string;      // 伪回合名称（如"伪回合"）
  NEW_TURN_NAME: string;         // 新回合名称（如"新回合"）
  
  // 角色相关
  CHARACTER_NAME: string;        // 角色名称（如"式神"）
  STATUS_NAME: string;           // 状态名称（如"状态"）
  BUFF_NAME: string;             // 增益名称（如"增益"）
  DEBUFF_NAME: string;           // 减益名称（如"减益"）
  
  // 技能相关
  SKILL_NAME: string;            // 技能名称（如"技能"）
  ACTIVE_SKILL_NAME: string;     // 主动技能名称（如"主动技能"）
  PASSIVE_SKILL_NAME: string;    // 被动技能名称（如"被动技能"）
  
  // 战斗效果
  DAMAGE_NAME: string;           // 伤害名称（如"伤害"）
  HEAL_NAME: string;             // 治疗名称（如"治疗"）
  CRITICAL_NAME: string;         // 暴击名称（如"暴击"）
  
  // 装备系统功能
  FORGE_NAME: string;            // 熔炉名称（如"熔炉"）
  REFINE_NAME: string;           // 洗练名称（如"洗练"）
  TRANSFER_NAME: string;         // 转移名称（如"转移"）
}

/**
 * 默认术语配置
 */
export const DEFAULT_TERMINOLOGY: TerminologyConfig = {
  // 核心资源
  RESOURCE_NAME: "鬼火",
  RESOURCE_BAR_NAME: "鬼火条",
  
  // 装备系统
  EQUIPMENT_NAME: "御魂",
  EQUIPMENT_SET_NAME: "御魂套装",
  EQUIPMENT_SLOT_NAME: "御魂位置",
  
  // 战斗相关
  ACTION_BAR_NAME: "行动条",
  TURN_NAME: "回合",
  PSEUDO_TURN_NAME: "伪回合",
  NEW_TURN_NAME: "新回合",
  
  // 角色相关
  CHARACTER_NAME: "式神",
  STATUS_NAME: "状态",
  BUFF_NAME: "增益",
  DEBUFF_NAME: "减益",
  
  // 技能相关
  SKILL_NAME: "技能",
  ACTIVE_SKILL_NAME: "主动技能",
  PASSIVE_SKILL_NAME: "被动技能",
  
  // 战斗效果
  DAMAGE_NAME: "伤害",
  HEAL_NAME: "治疗",
  CRITICAL_NAME: "暴击",
  
  // 装备系统功能
  FORGE_NAME: "熔炉",
  REFINE_NAME: "洗练",
  TRANSFER_NAME: "转移"
};

/**
 * 术语配置管理器
 */
export class TerminologyManager {
  private static instance: TerminologyManager;
  private config: TerminologyConfig;
  
  private constructor() {
    this.config = DEFAULT_TERMINOLOGY;
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): TerminologyManager {
    if (!TerminologyManager.instance) {
      TerminologyManager.instance = new TerminologyManager();
    }
    return TerminologyManager.instance;
  }
  
  /**
   * 设置术语配置
   */
  public setConfig(config: Partial<TerminologyConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取术语配置
   */
  public getConfig(): TerminologyConfig {
    return this.config;
  }
  
  /**
   * 获取单个术语
   */
  public getTerm(key: keyof TerminologyConfig): string {
    return this.config[key];
  }
}

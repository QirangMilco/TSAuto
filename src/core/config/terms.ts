/**
 * 游戏术语配置文件 (SSOT - Single Source of Truth)
 * 用于集中管理游戏中使用的所有术语，避免版权问题
 * 例如：将"鬼火"替换为"能量"，"御魂"替换为"装备"等
 */

/**
 * 游戏术语配置接口
 */
export interface TermsConfig {
  // 核心资源相关
  resources: {
    primary: string;          // 主要资源名称（如"能量"）
    primaryIcon: string;      // 主要资源图标
    primaryUnit: string;      // 主要资源单位
  };
  
  // 系统相关术语
  systems: {
    equipment: string;        // 装备系统名称
    character: string;        // 角色系统名称
    skill: string;            // 技能系统名称
    status: string;           // 状态系统名称
  };
  
  // 战斗相关术语
  battle: {
    turn: string;             // 回合
    actionBar: string;        // 行动条
    speed: string;            // 速度
    attack: string;           // 攻击
    defense: string;          // 防御
    critical: string;         // 暴击
    criticalDamage: string;   // 暴击伤害
  };
  
  // 状态类型术语
  statusTypes: {
    buff: string;             // 增益状态
    debuff: string;           // 减益状态
    control: string;          // 控制状态
    dot: string;              // 持续伤害状态
  };
  
  // 效果类型术语
  effectTypes: {
    damage: string;           // 伤害效果
    heal: string;             // 治疗效果
    buff: string;             // 增益效果
    debuff: string;           // 减益效果
    actionBar: string;        // 行动条调整效果
  };
}

/**
 * 默认术语配置
 * 可以根据不同版本或需求替换为其他配置
 */
export const DEFAULT_TERMS: TermsConfig = {
  resources: {
    primary: "能量",
    primaryIcon: "energy_icon",
    primaryUnit: "点"
  },
  
  systems: {
    equipment: "装备",
    character: "角色",
    skill: "技能",
    status: "状态"
  },
  
  battle: {
    turn: "回合",
    actionBar: "行动条",
    speed: "速度",
    attack: "攻击",
    defense: "防御",
    critical: "暴击",
    criticalDamage: "暴击伤害"
  },
  
  statusTypes: {
    buff: "增益",
    debuff: "减益",
    control: "控制",
    dot: "持续伤害"
  },
  
  effectTypes: {
    damage: "伤害",
    heal: "治疗",
    buff: "增益",
    debuff: "减益",
    actionBar: "行动条调整"
  }
};

/**
 * 术语管理器
 * 负责提供和管理游戏术语
 */
export class TermsManager {
  private static instance: TermsManager;
  private currentTerms: TermsConfig;
  
  private constructor() {
    this.currentTerms = DEFAULT_TERMS;
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): TermsManager {
    if (!TermsManager.instance) {
      TermsManager.instance = new TermsManager();
    }
    return TermsManager.instance;
  }
  
  /**
   * 获取当前术语配置
   */
  public getTerms(): TermsConfig {
    return this.currentTerms;
  }
  
  /**
   * 设置术语配置
   */
  public setTerms(terms: Partial<TermsConfig>): void {
    this.currentTerms = {
      ...this.currentTerms,
      ...terms,
      resources: {
        ...this.currentTerms.resources,
        ...terms.resources
      },
      systems: {
        ...this.currentTerms.systems,
        ...terms.systems
      },
      battle: {
        ...this.currentTerms.battle,
        ...terms.battle
      },
      statusTypes: {
        ...this.currentTerms.statusTypes,
        ...terms.statusTypes
      },
      effectTypes: {
        ...this.currentTerms.effectTypes,
        ...terms.effectTypes
      }
    };
  }
  
  /**
   * 获取指定术语
   * 提供路径访问，如 getTerm('resources.primary')
   */
  public getTerm(path: string): string | undefined {
    const keys = path.split('.');
    let value: any = this.currentTerms;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return typeof value === 'string' ? value : undefined;
  }
}

// 导出便捷访问方法
export const getTerms = (): TermsConfig => TermsManager.getInstance().getTerms();
export const getTerm = (path: string): string | undefined => TermsManager.getInstance().getTerm(path);
export const setTerms = (terms: Partial<TermsConfig>): void => TermsManager.getInstance().setTerms(terms);
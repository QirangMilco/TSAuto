import { StatType } from '../types/definitions';

/**
 * 属性元数据定义
 */
interface StatMeta {
  base: number;      // Lv.0 基础值
  step: number;      // 每级成长值
  subRange: [number, number]; // 副属性单次随机范围 [min, max]
  weight: number;    // 主属性出现权重
}

/**
 * 装备系统常量配置
 * 模组制作者可以通过修改此文件调整御魂数值模型
 */
export const EQUIPMENT_CONFIG = {
  // 装备槽数量配置
  SLOT_COUNT: 5, // 与五行系统一致，5个装备槽
  
  // 属性元数据表 (整合了成长、副属性范围、权重)
  STATS: {
    [StatType.ATK_P]:        { base: 10, step: 3,   subRange: [2.4, 3.0],   weight: 30 },
    [StatType.DEF_P]:        { base: 10, step: 3,   subRange: [2.4, 3.0],   weight: 30 },
    [StatType.HP_P]:         { base: 10, step: 3,   subRange: [2.4, 3.0],   weight: 30 },
    [StatType.CRIT]:         { base: 10, step: 3,   subRange: [2.4, 3.0],   weight: 5  },
    [StatType.CRIT_DMG]:     { base: 14, step: 5,   subRange: [3.2, 4.0],   weight: 5  },
    [StatType.SPD]:          { base: 12, step: 3,   subRange: [2.4, 3.0],   weight: 10 },
    [StatType.EFFECT_HIT]:   { base: 10, step: 3,   subRange: [3.2, 4.0],   weight: 5  },
    [StatType.EFFECT_RESIST]:{ base: 10, step: 3,   subRange: [3.2, 4.0],   weight: 5  },
    
    // 固定属性 (仅出现在特定位置或副属性)
    [StatType.ATK]:          { base: 81,  step: 27,  subRange: [21.6, 27],   weight: 100 }, // 权重100仅用于1号位必出
    [StatType.DEF]:          { base: 14,  step: 6,   subRange: [4, 5],       weight: 100 },
    [StatType.HP]:           { base: 342, step: 114, subRange: [91.2, 114],  weight: 100 },
  } as Record<StatType, StatMeta>,

  // 主属性分布规则 (Key: 槽位, Value: 可能的属性)
  // 与五行系统对应：1-[金]-攻伐, 2-[水]-节奏, 3-[木]-生长, 4-[火]-爆发, 5-[土]-承载
  SLOT_MAIN_STATS: {
    // 金-宝剑-攻伐：[基石] 保证所有角色拥有最基础的普攻与技能伤害系数，对应传统RPG的武器位
    1: [StatType.ATK], // 固定攻击 (Flat ATK)
    
    // 水-流云-节奏：[博弈核心]
    // • 抢一速/辅助：必选速度
    // • 尾速输出：选攻击加成（避免乱轴）
    // • 纯肉盾：选生命/防御
    // • 控制/解控：选命中/抵抗
    2: [StatType.SPD, StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.EFFECT_HIT, StatType.EFFECT_RESIST], // 速度,攻击加成,生命加成,防御加成,效果命中,效果抵抗
    
    // 木-葫芦-生长：[放大器]纯粹的百分比放大位。决定角色的基础走向是"输出"、"承伤"还是"纯防御"
    3: [StatType.ATK_P, StatType.HP_P, StatType.DEF_P], // 攻击加成,生命加成,防御加成
    
    // 火-闪电-爆发：[输出核心]输出角色的灵魂位置
    // • 满暴前：选暴击率
    // • 满暴后：选爆伤
    // • 纯DOT/奶妈：可选攻击加成（如果不需要暴击）
    4: [StatType.CRIT, StatType.CRIT_DMG, StatType.ATK_P], // 暴击率,暴击伤害,攻击加成
    
    // 土-兽面-承载：[基石] 保证脆皮输出不被满血秒杀，提供最基础的生存容错率，防止PVP变成"互秒"游戏
    5: [StatType.HP] // 固定生命 (Flat HP)
  } as Record<number, StatType[]>
};
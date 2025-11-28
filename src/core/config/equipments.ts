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
  SLOT_COUNT: 6, // 默认6个装备槽，模组可以修改此值
  
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
  // 模组可以扩展或修改此配置，添加新的槽位和对应的主属性
  SLOT_MAIN_STATS: {
    1: [StatType.ATK],
    2: [StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.SPD],
    3: [StatType.DEF],
    4: [StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.EFFECT_HIT, StatType.EFFECT_RESIST],
    5: [StatType.HP],
    6: [StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.CRIT, StatType.CRIT_DMG]
  } as Record<number, StatType[]>
};
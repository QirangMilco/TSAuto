import { StatType } from '../types/definitions';

/**
 * 御魂套装定义
 */
export interface SetBonusDefinition {
  id: string;        // 套装ID (如 WIND_SET)
  name: string;      // 套装名
  
  // 2件套效果 (通常是属性加成)
  piece2?: {
    stat: StatType;
    value: number; // 如 15 代表 15%
  };
  
  // 4件套效果
  piece4?: {
    // 如果是纯属性加成 (如 +速度)
    stat?: StatType;
    value?: number;
    
    // 如果是特殊战斗机制，使用 description 描述，具体逻辑在 BattleEngine 中实现
    description?: string;
    effectId?: string; // 关联到战斗系统的 Effect ID
  };
}

/**
 * 套装配置表 (SSOT)
 */
export const EQUIPMENT_SETS: Record<string, SetBonusDefinition> = {
  // 示例：风语套装 (2件套+攻击，4件套+速度)
  'WIND_SET': {
    id: 'WIND_SET',
    name: '风语',
    piece2: { stat: StatType.ATK_P, value: 15 }, // +15% 攻击
    piece4: { stat: StatType.SPD, value: 25, description: "战斗开始时获得风之加护" }     // +25 速度 (为了演示属性计算)
  },
  
  // 示例：破势 (2件套+暴击，4件套战斗特效)
  'PO_SHI': {
    id: 'PO_SHI',
    name: '破势',
    piece2: { stat: StatType.CRIT, value: 15 },
    piece4: { description: "对生命值高于70%的单位造成额外40%伤害", effectId: "EFF_POSHI" }
  },
  
  // 示例：针女 (2件套+暴击，4件套战斗特效)
  'ZHEN_NV': {
    id: 'ZHEN_NV',
    name: '针女',
    piece2: { stat: StatType.CRIT, value: 15 },
    piece4: { description: "暴击时有40%概率造成目标最大生命值10%的无视防御伤害", effectId: "EFF_ZHENNV" }
  }
};
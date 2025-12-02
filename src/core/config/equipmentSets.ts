import { StatType } from '../types/definitions';

/**
 * 装备套装效果定义
 */
export interface SetEffectDefinition {
  // 如果是纯属性加成 (如 +速度)
  stat?: StatType;
  value?: number;
  
  // 如果是特殊战斗机制，使用 description 描述，具体逻辑在 BattleEngine 中实现
  description?: string;
  effectId?: string; // 关联到战斗系统的 Effect ID
}

/**
 * 御魂套装定义
 * 支持灵活的件数加成，可轻松扩展为6件、7件或更多
 */
export interface SetBonusDefinition {
  id: string;        // 套装ID (如 WIND_SET)
  name: string;      // 套装名
  
  // 按件数定义的套装效果 (支持任意件数)
  // key: 件数 (如 2, 4, 6, 7), value: 对应的效果
  effects: Record<number, SetEffectDefinition>;
}

/**
 * 套装配置表 (SSOT)
 */
export const EQUIPMENT_SETS: Record<string, SetBonusDefinition> = {
  // 示例：风语套装 (2件套+攻击，4件套+速度)
  'WIND_SET': {
    id: 'WIND_SET',
    name: '风语',
    effects: {
      2: { stat: StatType.ATK_P, value: 15 }, // +15% 攻击
      4: { stat: StatType.SPD, value: 25, description: "战斗开始时获得风之加护" } // +25 速度
    }
  },
  
  // 示例：破势 (2件套+暴击，4件套战斗特效)
  'PO_SHI': {
    id: 'PO_SHI',
    name: '破势',
    effects: {
      2: { stat: StatType.CRIT, value: 15 },
      4: { description: "对生命值高于70%的单位造成额外40%伤害", effectId: "EFF_POSHI" }
    }
  },
  
  // 示例：针女 (2件套+暴击，4件套战斗特效)
  'ZHEN_NV': {
    id: 'ZHEN_NV',
    name: '针女',
    effects: {
      2: { stat: StatType.CRIT, value: 15 },
      4: { description: "暴击时有40%概率造成目标最大生命值10%的无视防御伤害", effectId: "EFF_ZHENNV" }
    }
  },
  
  // 示例：6件套套装（演示扩展性）
  'SIX_SET': {
    id: 'SIX_SET',
    name: '六件套示例',
    effects: {
      2: { stat: StatType.ATK_P, value: 10 },
      4: { stat: StatType.CRIT, value: 15 },
      6: { stat: StatType.CRIT_DMG, value: 30, description: "六件套效果：暴击伤害大幅提升" }
    }
  },
  
  // 示例：7件套套装（演示扩展性）
  'SEVEN_SET': {
    id: 'SEVEN_SET',
    name: '七件套示例',
    effects: {
      2: { stat: StatType.HP_P, value: 10 },
      4: { stat: StatType.DEF_P, value: 15 },
      6: { stat: StatType.SPD, value: 20 },
      7: { description: "七件套效果：获得终极增益", effectId: "EFF_ULTIMATE" }
    }
  }
};
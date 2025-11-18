/**
 * 风语之刃 - 装备插件
 */
import { StatType } from '../../core/types/definitions';

export default {
  id: "EQUIP_2001",
  name: "风语之刃",
  setId: "WIND_SET", // 风元素套装
  slot: 1, // 武器位
  
  // 基础属性
  baseStats: {
    [StatType.ATK]: 300,      // 基础攻击300
    [StatType.ATK_P]: 10,     // 攻击加成10%
    [StatType.CRIT]: 0.05     // 暴击率5%
  },
  
  // 可能的副属性
  possibleSecondaryStats: [
    StatType.ATK_P,
    StatType.CRIT,
    StatType.CRIT_DMG,
    StatType.SPD
  ]
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "风元素武器装备插件"
};
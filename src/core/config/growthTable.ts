/**
 * 成长系数接口
 */
export interface GrowthCoefficients {
  atk: number; // 攻击成长点
  hp: number;  // 生命成长点
  def: number; // 防御成长点
}

/**
 * 成长表类型：等级 -> 系数
 */
export type GrowthTable = Record<number, GrowthCoefficients>;

/**
 * 默认成长点对照表
 * 数据来源：仙神通用全等级属性成长点对照表 (image_2ef0dc.png)
 * 注意：部分等级(如20->21)之间数值的大幅跳跃通常代表了升星带来的属性提升
 */
export const DEFAULT_GROWTH_TABLE: GrowthTable = {
  1:  { atk: 127,  hp: 1066, def: 75  },
  2:  { atk: 134,  hp: 1119, def: 77  },
  3:  { atk: 142,  hp: 1177, def: 80  },
  4:  { atk: 149,  hp: 1228, def: 82  },
  5:  { atk: 158,  hp: 1292, def: 85  },
  6:  { atk: 166,  hp: 1351, def: 87  },
  7:  { atk: 175,  hp: 1413, def: 90  },
  8:  { atk: 185,  hp: 1486, def: 92  },
  9:  { atk: 195,  hp: 1555, def: 95  },
  10: { atk: 206,  hp: 1634, def: 97  },
  
  11: { atk: 217,  hp: 1708, def: 100 },
  12: { atk: 229,  hp: 1789, def: 103 },
  13: { atk: 242,  hp: 1882, def: 105 },
  14: { atk: 255,  hp: 1968, def: 108 },
  15: { atk: 269,  hp: 2061, def: 111 },
  16: { atk: 284,  hp: 2160, def: 114 },
  17: { atk: 299,  hp: 2258, def: 117 },
  18: { atk: 316,  hp: 2370, def: 120 },
  19: { atk: 333,  hp: 2479, def: 123 },
  20: { atk: 351,  hp: 2595, def: 126 },
  
  // 20->21 的跳跃包含升星收益
  21: { atk: 471,  hp: 3211, def: 162 },
  22: { atk: 497,  hp: 3366, def: 165 },
  23: { atk: 525,  hp: 3526, def: 169 },
  24: { atk: 553,  hp: 3690, def: 172 },
  25: { atk: 584,  hp: 3864, def: 176 },
  
  // 25->26 的跳跃包含升星收益
  26: { atk: 783,  hp: 4725, def: 222 },
  27: { atk: 826,  hp: 4946, def: 226 },
  28: { atk: 872,  hp: 5172, def: 231 },
  29: { atk: 920,  hp: 5406, def: 236 },
  30: { atk: 970,  hp: 5647, def: 241 },
  
  // 30->31 的跳跃包含升星收益
  31: { atk: 1302, hp: 6835, def: 300 },
  32: { atk: 1373, hp: 7136, def: 306 },
  33: { atk: 1449, hp: 7458, def: 312 },
  34: { atk: 1528, hp: 7775, def: 319 },
  35: { atk: 1612, hp: 8124, def: 325 },
  
  // 35->36 的跳跃包含升星收益
  36: { atk: 2164, hp: 9655, def: 406 },
  37: { atk: 2283, hp: 10072, def: 414 },
  38: { atk: 2408, hp: 10491, def: 423 },
  39: { atk: 2540, hp: 10930, def: 432 },
  40: { atk: 2680, hp: 11392, def: 441 }
};

/**
 * 升星节点数据表 (同级不同星的额外数据)
 * Key: 星级 (Grade) -> Value: 该星级起始等级的属性
 * 例如: 5 代表 "5星30级" 的数据
 */
export const PROMOTION_GROWTH_TABLE: Record<number, { level: number, stats: { atk: number, hp: number, def: number } }> = {
  3: { level: 20, stats: { atk: 447,  hp: 3074, def: 158 } }, // 3星20级
  4: { level: 25, stats: { atk: 743,  hp: 4526, def: 217 } }, // 4星25级
  5: { level: 30, stats: { atk: 1234, hp: 6543, def: 294 } }, // 5星30级
  6: { level: 35, stats: { atk: 2051, hp: 9255, def: 398 } }  // 6星35级
};
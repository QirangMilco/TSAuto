import { StatType } from '../types/definitions';
import type { CharacterDefinition } from '../types/definitions';
import { DEFAULT_GROWTH_TABLE, PROMOTION_GROWTH_TABLE, GrowthTable, GrowthCoefficients } from '../config/growthTable';

/**
 * 角色属性计算服务
 * 负责根据等级、觉醒状态计算角色的基础面板属性
 */
export class CharacterStatsService {
  // 内部存储当前使用的成长表，默认加载 DEFAULT
  private static currentGrowthTable: GrowthTable = DEFAULT_GROWTH_TABLE;
  private static sortedLevels: number[] = Object.keys(DEFAULT_GROWTH_TABLE).map(Number).sort((a, b) => a - b);

  /**
   * 配置自定义成长表 (用于模组支持)
   * @param table 新的成长表
   */
  public static setGrowthTable(table: GrowthTable): void {
    this.currentGrowthTable = table;
    // 缓存排序后的等级键，优化查找性能
    this.sortedLevels = Object.keys(table).map(Number).sort((a, b) => a - b);
  }

  /**
   * 获取成长系数 (支持升星阶跃)
   * @param level 等级
   * @param grade 星级 (可选，用于处理同级不同星的情况，如 30级vs5星30级)
   */
  public static getGrowthCoefficients(level: number, grade?: number): GrowthCoefficients {
    // 1. 优先检查是否命中"升星节点" (例如 5星30级)
    if (grade && PROMOTION_GROWTH_TABLE[grade]) {
      const promoData = PROMOTION_GROWTH_TABLE[grade];
      // 如果当前等级就是该星级的起始等级 (如 Lv.30)
      // 注意：这里需要浮点数比较的容差处理，或者简单的 ===
      if (Math.abs(level - promoData.level) < 0.01) {
        return promoData.stats;
      }
      
      // 2. 特殊插值逻辑: 
      // 如果等级处于升星节点和下一级之间 (例如 30.5级, 且是5星)
      // 起点应该用 5星30级(1234) 而不是 普通30级(970)
      const nextLevel = Math.floor(level) + 1;
      if (level > promoData.level && level < nextLevel) {
         // 获取下一级的常规数据 (31级)
         const upperData = this.currentGrowthTable[nextLevel]; 
         const lowerData = promoData.stats; // 使用升星后的高数据作为起点
         
         if (upperData) {
            const ratio = level - promoData.level; // 0~1
            return {
              atk: Math.floor(lowerData.atk + (upperData.atk - lowerData.atk) * ratio),
              hp:  Math.floor(lowerData.hp  + (upperData.hp  - lowerData.hp)  * ratio),
              def: Math.floor(lowerData.def + (upperData.def - lowerData.def) * ratio)
            };
         }
      }
    }

    // 3. 回退到默认逻辑 (查普通表)
    return this.getDefaultGrowthCoefficients(level);
  }

  /**
   * 获取等级对应的成长系数 (HP, ATK, DEF 独立计算)
   * 支持线性插值
   * @param level 当前等级
   */
  public static getDefaultGrowthCoefficients(level: number): GrowthCoefficients {
    // 1. 直接命中
    if (this.currentGrowthTable[level]) {
      return this.currentGrowthTable[level];
    }

    const levels = this.sortedLevels;
    const minLevel = levels[0];
    const maxLevel = levels[levels.length - 1];

    // 2. 边界处理
    if (level < minLevel) return this.currentGrowthTable[minLevel];
    if (level > maxLevel) return this.currentGrowthTable[maxLevel];

    // 3. 线性插值 (分别计算三个属性)
    for (let i = 0; i < levels.length - 1; i++) {
      const lowerLevel = levels[i];
      const upperLevel = levels[i + 1];
      
      if (level > lowerLevel && level < upperLevel) {
        const lowerData = this.currentGrowthTable[lowerLevel];
        const upperData = this.currentGrowthTable[upperLevel];
        const ratio = (level - lowerLevel) / (upperLevel - lowerLevel);

        return {
          atk: Math.floor(lowerData.atk + (upperData.atk - lowerData.atk) * ratio),
          hp: Math.floor(lowerData.hp + (upperData.hp - lowerData.hp) * ratio),
          def: Math.floor(lowerData.def + (upperData.def - lowerData.def) * ratio)
        };
      }
    }
    
    // 默认回退
    return this.currentGrowthTable[minLevel];
  }

  /**
   * 计算角色基础属性 (面板属性)
   */
  public static calculateBaseStats(
    character: CharacterDefinition, 
    level: number, 
    grade: number = 2,
    isAwakened: boolean = false
  ): Record<StatType, number> {
    // 1. 获取成长系数 (现在是包含 atk, hp, def 的对象)
    const coeffs = this.getGrowthCoefficients(level, grade);
    
    const growthValues = isAwakened 
      ? character.growthValuesAfterAwake 
      : character.growthValuesBeforeAwake;
      
    const baseValues = isAwakened
      ? character.baseValuesAfterAwake
      : character.baseValuesBeforeAwake;

    // 2. 构造属性
    // 注意：由于现在的系数(如127)较大，character.growthValues 应该相应调小，
    // 或者我们假设 character.growthValues 是一个较小的倍率 (比如 S级=3.0)
    const stats: Partial<Record<StatType, number>> = {
      // 公式: 角色成长值 * 表格系数 + 1 (HP)
      [StatType.HP]: Math.floor(growthValues.hp * coeffs.hp) + 1,
      [StatType.ATK]: Math.floor(growthValues.atk * coeffs.atk),
      [StatType.DEF]: Math.floor(growthValues.def * coeffs.def),
      
      [StatType.SPD]: baseValues.spd,
      [StatType.CRIT]: baseValues.crit,
      [StatType.CRIT_DMG]: baseValues.critDmg,
      
      [StatType.ATK_P]: 0,
      [StatType.DEF_P]: 0,
      [StatType.HP_P]: 0,
      [StatType.SPD_P]: 0,
      [StatType.DMG_BONUS]: 0,
      [StatType.DMG_TAKEN_BONUS]: 0,
      [StatType.IGNORE_DEF_P]: 0,
      [StatType.IGNORE_DEF_FLAT]: 0,
      [StatType.HEAL_BONUS]: 0,
      [StatType.RECEIVE_HEAL_BONUS]: 0
    };

    return stats as Record<StatType, number>;
  }
}
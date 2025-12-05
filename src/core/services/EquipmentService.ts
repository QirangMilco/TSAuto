import { StatType } from '../types/definitions';
import type { EquipmentDefinition } from '../types/definitions';
import { RandomService } from './RandomService';
import { EQUIPMENT_SETS } from '../config/equipmentSets';
import { EQUIPMENT_CONFIG } from '../config/equipments';
import { FiveElementsService } from './FiveElementsService';
// 移除 GameData 依赖，改为通过参数注入或使用配置文件


/**
 * 装备实例接口
 * 定义了运行时的装备数据结构
 */
export interface EquipmentInstance {
    instanceId: string;
    definitionId: string; // 对应 EquipmentDefinition.id
    setId: string;        // 套装ID
    name: string;         // 装备名称
    slot: number;         // 部位 (1-5)
    level: number;        // 强化等级 (0-15)
    grade: number;        // 星级 (1-6)

    // 主属性 (只有一条)
    mainStat: { type: StatType; value: number };

    // 副属性 (多条)
    subStats: { type: StatType; value: number }[];
}

/**
 * 装备服务
 * 负责御魂的生成、强化模拟和属性计算
 */
export class EquipmentService {
    private static rng = RandomService.getInstance();

    /**
     * Irwin-Hall 分布随机算法
     * 生成符合正态分布特征的随机数，使结果倾向于区间的中值
     * @param min 最小值
     * @param max 最大值
     * @param n 叠加次数 (默认3次，次数越高越趋近正态分布)
     * @returns [min, max] 之间的随机浮点数
     */
    public static rollIrwinHall(min: number, max: number, n: number = 3): number {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += this.rng.float();
        }
        // sum 的范围是 [0, n]
        // 归一化到 [0, 1]: sum / n
        // 映射到 [min, max]
        const normalized = sum / n;
        return min + normalized * (max - min);
    }

    /**
   * 生成单条副属性
   */
    private static generateSubStat(excludeTypes: Set<StatType>): { type: StatType; value: number } {
        // 1. 获取所有可用的副属性类型 (排除已有的)
        // 注意：需要从 StatType 枚举或配置中获取所有可能的副属性列表
        const allSubStats = [
            StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.SPD, 
            StatType.CRIT, StatType.CRIT_DMG, StatType.EFFECT_HIT, StatType.EFFECT_RESIST,
            StatType.ATK, StatType.HP, StatType.DEF
        ];
        
        const availablePool = allSubStats.filter(t => !excludeTypes.has(t));
        
        // 如果池子空了(极罕见情况)，允许重复或回退
        const type = this.rng.pick(availablePool) || StatType.ATK;

        // 2. 生成数值 (保留完整精度，不进行 Math.floor)
        const val = this.generateSubStatValueByType(type);

        return { type, value: val };
    }

    /**
     * 创建一件新装备 (随机生成)
     * @param def 装备定义
     * @param grade 星级 (默认6星)
     */
    public static createEquipment(
        def: EquipmentDefinition,
        grade: number = 6
    ): EquipmentInstance {
        const instanceId = `equip_${this.rng.int(100000, 999999)}`;

        // 1. 确定主属性
        const mainStatType = this.determineMainStatType(def.slot);
        // 初始值 (Lv.0)
        const mainVal = this.calculateMainStatValue(mainStatType, 0);

        // 2. 生成初始副属性 (6星通常带 2-4 条初始副属性)
        const subStats: { type: StatType; value: number }[] = [];
        const subCount = this.rng.weightedPick([2, 3, 4], [0.3, 0.5, 0.2]) || 3;

        const existingTypes = new Set<StatType>();

        while (subStats.length < subCount) {
            // Filter available stats from the full pool, not the existing set
            const availableStats = [
                StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.SPD, 
                StatType.CRIT, StatType.CRIT_DMG, StatType.EFFECT_HIT, StatType.EFFECT_RESIST,
                StatType.ATK, StatType.HP, StatType.DEF
            ].filter(t => !existingTypes.has(t));

            const type = this.rng.pick(availableStats)!;
            const val = this.generateSubStatValueByType(type);
            subStats.push({ type, value: val });
            existingTypes.add(type);
        }

        return {
            instanceId,
            definitionId: def.id,
            setId: def.setId,
            name: def.name,
            slot: def.slot,
            level: 0,
            grade,
            mainStat: { type: mainStatType, value: mainVal },
            subStats
        };
    }

    /**
   * 根据槽位生成主属性 (加权随机)
   */
    private static determineMainStatType(slot: number): StatType {
        const possibleStats = EQUIPMENT_CONFIG.SLOT_MAIN_STATS[slot];
        if (!possibleStats) return StatType.ATK; // 默认回退

        // 如果只有一个可能 (如1/3/5号位)，直接返回
        if (possibleStats.length === 1) return possibleStats[0];

        // 准备权重列表
        const weights = possibleStats.map(statType => {
            return EQUIPMENT_CONFIG.STATS[statType]?.weight || 0;
        });

        // 使用 RandomService 的加权随机
        return this.rng.weightedPick(possibleStats, weights) || StatType.ATK;
    }

    /**
   * 计算主属性数值 (基于精确公式)
   */
    public static calculateMainStatValue(type: StatType, level: number): number {
        const config = EQUIPMENT_CONFIG.STATS[type];
        if (!config) return 0;

        // 公式: 基础值 + 等级 * 成长步长
        return config.base + (level * config.step);
    }

    private static generateSubStatValueByType(type: StatType): number {
        const config = EQUIPMENT_CONFIG.STATS[type];
        if (config && config.subRange) {
            const [min, max] = config.subRange;
            // 使用 Irwin-Hall 算法生成倾向于中间值的随机数 (n=3 接近正态分布)
            const val = this.rollIrwinHall(min, max, 3);
            // 确保数值在有效范围内
            return Math.max(min, Math.min(max, val));
        }

        // 兜底逻辑 (防止配置缺失)
        return this.rng.floatRange(2.4, 3.0);
    }

    /**
     * 计算基础属性加成（不包含五行加成）
     * 汇总所有装备的主属性、副属性和套装加成
     * @param equips 装备列表
     */
    public static calculateBaseStats(equips: EquipmentInstance[]): Record<StatType, number> {
        const totalStats: Record<string, number> = {};
        Object.values(StatType).forEach(s => totalStats[s] = 0);

        const setCounts: Record<string, number> = {};

        for (const eq of equips) {
            setCounts[eq.setId] = (setCounts[eq.setId] || 0) + 1;

            totalStats[eq.mainStat.type] = (totalStats[eq.mainStat.type] || 0) + eq.mainStat.value;
            for (const sub of eq.subStats) {
                totalStats[sub.type] = (totalStats[sub.type] || 0) + sub.value;
            }
        }

        // 计算套装加成（支持任意件数）
        for (const [setId, count] of Object.entries(setCounts)) {
            // 从配置文件获取套装定义
            const setDef = EQUIPMENT_SETS[setId];

            if (!setDef) {
                console.warn(`Equipment Set definition not found: ${setId}`);
                continue;
            }

            // 获取该套装所有可用的效果件数，并按从大到小排序
            const availablePieces = Object.keys(setDef.effects)
                .map(Number) // 转换为数字
                .filter(piece => piece <= count) // 只保留已达到的件数
                .sort((a, b) => b - a); // 从大到小排序

            // 遍历所有已达到的效果件数，应用对应的效果
            for (const piece of availablePieces) {
                const effect = setDef.effects[piece];
                if (effect && effect.stat !== undefined && effect.value !== undefined) {
                    totalStats[effect.stat] = (totalStats[effect.stat] || 0) + effect.value;
                }
                // 特殊效果（非属性类）会在战斗引擎中处理，这里只处理属性类效果
            }
        }

        // 统一取整
        for (const key of Object.keys(totalStats)) {
            totalStats[key] = Math.round(totalStats[key]);
        }

        return totalStats as Record<StatType, number>;
    }

    /**
     * 计算总属性加成
     * 汇总所有装备的主属性、副属性、套装加成和可选的五行加成
     * @param equips 装备列表
     * @param includeFiveElements 是否包含五行加成 (默认不包含，保持与测试用例一致)
     */
    public static calculateTotalStats(equips: EquipmentInstance[], includeFiveElements: boolean = false): Record<StatType, number> {
        // 计算基础属性
        const baseStats = this.calculateBaseStats(equips);
        
        if (includeFiveElements) {
            // 计算五行效果
            const fiveElementsResult = FiveElementsService.calculateFiveElements(equips);
            
            // 计算包含五行加成的最终属性
            const finalStats = FiveElementsService.calculateTotalStatsWithElements(baseStats, fiveElementsResult);
            
            return finalStats as Record<StatType, number>;
        }
        
        return baseStats;
    }

    /**
   * 强化装备 (完整模拟)
   * @param targetLevel 目标等级 (如直接强到15)
   */
    public static enhance(equip: EquipmentInstance, targetLevel: number = 15): void {
        if (equip.level >= 15) return;
        const finalLevel = Math.min(15, targetLevel);

        // 模拟每一级的提升
        for (let l = equip.level + 1; l <= finalLevel; l++) {
            equip.level = l;

            // 1. 主属性成长 (使用精确公式)
            equip.mainStat.value = this.calculateMainStatValue(equip.mainStat.type, l);

            // 2. 副属性判定 (3, 6, 9, 12, 15 级触发)
            if (l % 3 === 0) {
                const currentTypes = new Set(equip.subStats.map(s => s.type));
                // 如果不满4条，必定新增 (参考阴阳师机制)
                if (equip.subStats.length < 4) {
                    // 新增一条不重复的
                    let newSub = this.generateSubStat(currentTypes);
                    equip.subStats.push(newSub);
                } else {
                    // 满4条，随机强化一条
                    const targetSub = this.rng.pick(equip.subStats)!;
                    // 生成一个增量值
                    const addVal = this.generateSubStatValueByType(targetSub.type);
                    targetSub.value += addVal;
                }
            }
        }
    }
}
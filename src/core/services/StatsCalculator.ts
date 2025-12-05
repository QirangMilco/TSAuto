import { StatType, BuffType } from '../types/definitions';
import { CharacterInstance } from '../types/battle';
import { CharacterStatsService } from './CharacterStatsService';
import { EquipmentService, EquipmentInstance } from './EquipmentService';
import type { GameDataInterface } from '../types/plugin';

/**
 * 统一属性计算服务
 * 提供 getFinalStat(unit, StatType) 系统，整合：
 * - 角色基础属性 (CharacterStatsService)
 * - 装备/御魂加成 (EquipmentService)
 * - 状态效果加成 (从角色状态中计算)
 * - 其他临时加成
 */
export class StatsCalculator {
    // 静态游戏数据访问接口，用于获取状态定义和装备定义
    private static gameData: GameDataInterface | undefined;
    
    /**
     * 设置游戏数据访问接口
     * @param gameData 游戏数据访问接口
     */
    public static setGameData(gameData: GameDataInterface): void {
        this.gameData = gameData;
    }
    
    /**
     * 计算角色最终属性值
     * @param character 角色实例
     * @param statType 属性类型
     * @returns 最终计算的属性值
     */
    public static getFinalStat(character: CharacterInstance, statType: StatType): number {
        // 1. 获取基础属性 (面板白值)
        // 使用 baseStats 作为基准，避免重复叠加 Buff
        let baseValue = character.baseStats[statType] || 0;
        
        // 2. 计算装备/御魂加成
        let equipmentBonus = 0;
        if (character.equipment && character.equipment.length > 0) {
            // 临时实现：假设装备实例直接存储在 character.equipment 中
            // 实际应该从装备实例ID获取装备实例
            // TODO: 实现装备实例管理系统，从装备ID获取装备实例
            // 目前我们简化处理，跳过装备加成计算
        }
        
        // 3. 计算状态效果加成
        const statusBonus = this.calculateStatusEffectsBonus(character, statType);
        
        // 4. 计算总属性
        let finalValue = baseValue + equipmentBonus + statusBonus;
        
        // 5. 处理百分比属性的特殊计算
        if (this.isPercentageStat(statType)) {
            // 百分比属性直接相加
            finalValue = Math.max(finalValue, 0); // 百分比属性不能为负
        } else {
            // 普通属性取整
            finalValue = Math.round(finalValue);
            // 确保非百分比属性不小于0
            if (statType !== StatType.HP) {
                finalValue = Math.max(finalValue, 0);
            }
        }
        
        return finalValue;
    }
    
    /**
     * 计算角色所有状态效果提供的属性加成
     * 支持同组互斥（取最大值）和不同组叠加
     * @param character 角色实例
     * @param statType 属性类型
     * @returns 状态效果提供的属性加成值
     */
    private static calculateStatusEffectsBonus(character: CharacterInstance, statType: StatType): number {
        let totalBonus = 0;
        
        // 分组状态的最优值映射: group -> maxBonus
        const groupMaxBonus: Map<string, number> = new Map();
        
        // 遍历角色所有状态
        character.statuses.forEach(status => {
            // 1. 获取状态定义
            const statusDefinition = this.gameData?.getStatus(status.statusId);
            
            // 2. 确定加成值和分组
            let bonus = 0;
            let group = status.group; // 优先使用实例上的 group (动态赋予)

            if (statusDefinition) {
                // 如果定义中有 group 且实例没覆盖，则使用定义的 group
                if (!group && statusDefinition.group) {
                    group = statusDefinition.group;
                }
                
                // 获取加成值
                if (statusDefinition.statModifiers && statusDefinition.statModifiers[statType] !== undefined) {
                    bonus = statusDefinition.statModifiers[statType]!;
                }
            } else if (status.type) {
                // 兼容旧逻辑：如果没有获取到状态定义，使用状态类型推断
                // TODO: 逐步废弃这种硬编码逻辑，全面转向 StatusDefinition
                switch (status.type) {
                    case BuffType.ATK_UP:
                        if (statType === StatType.ATK_P) bonus = 30;
                        break;
                    case BuffType.DEF_UP:
                        if (statType === StatType.DEF_P) bonus = 30;
                        break;
                    case BuffType.SPD_UP:
                        // 注意：TurnManager 中的 getSpeedBuffs 已被废弃，统一由此处处理
                        // SPD_UP 通常是百分比还是固定值？这里假设是百分比 SPD_P 或固定值 SPD
                        // 如果是 SPD_P，则 bonus = value
                        if (statType === StatType.SPD_P) {
                             bonus = status.effect?.value || 0;
                        }
                        break;
                }
            }

            // 3. 应用堆叠规则
            if (bonus !== 0) {
                if (group) {
                    // 同组互斥：取绝对值最大的效果（正负方向分别取最大？通常 RPG 规则是覆盖）
                    // 简单规则：只取数值最大的（Buff 覆盖 Debuff？或者 Buff 和 Debuff 分离？）
                    // 阴阳师规则：同名 Buff 覆盖。同类 Buff (如加速) 可能有多种来源。
                    // 这里实现：同 Group 取数值最大（Max）。
                    // 如果是负值（减益），也是数值比较。
                    // 例如：加速 20 (Group A) vs 加速 10 (Group A) -> 取 20
                    // 加速 20 (Group A) vs 减速 -30 (Group A) -> 取 20? 还是 -30?
                    // 通常互斥意味着它们不能共存，或者系统只计算一个。
                    // 假设：同 Group 取 max(bonus)。这适用于 "同类增益取最高"。
                    // 如果 Group 包含增益和减益（如 "SpeedModifier"），则需要更复杂的逻辑。
                    // 建议：Group 仅用于同向 Buff。
                    
                    const currentMax = groupMaxBonus.get(group);
                    if (currentMax === undefined || bonus > currentMax) {
                        groupMaxBonus.set(group, bonus);
                    }
                } else {
                    // 无分组：直接叠加
                    totalBonus += bonus;
                }
            }
        });
        
        // 4. 累加分组最优值
        for (const maxBonus of groupMaxBonus.values()) {
            totalBonus += maxBonus;
        }
        
        return totalBonus;
    }
    
    /**
     * 检查属性类型是否为百分比属性
     * @param statType 属性类型
     * @returns 是否为百分比属性
     */
    private static isPercentageStat(statType: StatType): boolean {
        const percentageStats = [
            StatType.ATK_P,
            StatType.DEF_P,
            StatType.HP_P,
            StatType.SPD_P,
            StatType.CRIT,
            StatType.CRIT_DMG,
            StatType.EFFECT_HIT,
            StatType.EFFECT_RESIST,
            StatType.DMG_BONUS,
            StatType.DMG_TAKEN_BONUS,
            StatType.IGNORE_DEF_P,
            StatType.HEAL_BONUS,
            StatType.RECEIVE_HEAL_BONUS
        ];
        
        return percentageStats.includes(statType);
    }
    
    /**
     * 重新计算角色所有最终属性
     * @param character 角色实例
     * @returns 更新后的属性对象
     */
    public static recalculateAllStats(character: CharacterInstance): Record<StatType, number> {
        const stats: Record<StatType, number> = {} as Record<StatType, number>;
        
        // 遍历所有属性类型，重新计算
        Object.values(StatType).forEach(statType => {
            stats[statType] = this.getFinalStat(character, statType);
        });
        
        return stats;
    }
    
    /**
     * 应用属性加成到角色
     * @param character 角色实例
     * @param statBoosts 要应用的属性加成
     */
    public static applyStatBoosts(character: CharacterInstance, statBoosts: Partial<Record<StatType, number>>): void {
        // 遍历所有属性加成，直接加到当前属性上
        for (const [statType, value] of Object.entries(statBoosts) as [StatType, number][]) {
            if (character.currentStats[statType] !== undefined) {
                character.currentStats[statType] += value;
            }
        }
        
        // 更新角色的maxHp（如果HP相关属性有变化）
        if (statBoosts[StatType.HP] || statBoosts[StatType.HP_P]) {
            character.maxHp = this.getFinalStat(character, StatType.HP);
            // 确保当前HP不超过新的maxHp
            if (character.currentHp > character.maxHp) {
                character.currentHp = character.maxHp;
            }
        }
    }
}
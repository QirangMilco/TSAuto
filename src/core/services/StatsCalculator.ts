import { StatType } from '../types/definitions';
import { CharacterInstance } from '../types/battle';
import { CharacterStatsService } from './CharacterStatsService';
import { EquipmentService, EquipmentInstance } from './EquipmentService';

/**
 * 统一属性计算服务
 * 提供 getFinalStat(unit, StatType) 系统，整合：
 * - 角色基础属性 (CharacterStatsService)
 * - 装备/御魂加成 (EquipmentService)
 * - 状态效果加成 (从角色状态中计算)
 * - 其他临时加成
 */
export class StatsCalculator {
    /**
     * 计算角色最终属性值
     * @param character 角色实例
     * @param statType 属性类型
     * @returns 最终计算的属性值
     */
    public static getFinalStat(character: CharacterInstance, statType: StatType): number {
        // 1. 获取基础属性 (面板白值)
        // 注意：这里需要从角色定义中获取基础属性
        // 由于角色实例中没有直接存储定义，我们假设 currentStats 中已有基础属性
        let baseValue = character.currentStats[statType] || 0;
        
        // 2. 计算装备/御魂加成
        // 注意：这里需要从装备实例ID获取装备实例
        // 由于当前系统中没有装备实例管理，我们暂时跳过这部分
        // TODO: 实现装备实例管理，从装备ID获取装备实例
        
        // 3. 计算状态效果加成
        const statusBonus = this.calculateStatusEffectsBonus(character, statType);
        
        // 4. 计算总属性
        let finalValue = baseValue + statusBonus;
        
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
     * @param character 角色实例
     * @param statType 属性类型
     * @returns 状态效果提供的属性加成值
     */
    private static calculateStatusEffectsBonus(character: CharacterInstance, statType: StatType): number {
        let bonus = 0;
        
        // 遍历角色所有状态
        character.statuses.forEach(status => {
            // 状态效果的加成值，这里需要从状态定义中获取
            // 由于当前系统中没有状态定义管理，我们暂时使用状态的effect.value
            // TODO: 实现状态定义管理，从状态ID获取完整状态定义
            if (status.effect && status.effect.value) {
                // 根据状态类型和属性类型计算加成
                // 注意：这里需要根据具体的状态定义来计算加成
                // 暂时简化处理，直接返回effect.value作为加成
                bonus += status.effect.value;
            }
        });
        
        return bonus;
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
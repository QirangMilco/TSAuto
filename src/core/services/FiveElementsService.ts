import { EquipmentInstance } from './EquipmentService';
import { FIVE_ELEMENTS_CONFIG } from '../config/fiveElements';
import { ElementType, ElementState, SlotElementInfo, FiveElementsResult, ElementRelationType } from '../types/fiveElements';
import { EQUIPMENT_SETS } from '../config/equipmentSets';
import { StatType } from '../types/definitions';

/**
 * 五行系统服务
 * 负责处理装备的五行元素计算、相生相克关系和状态判断
 * 设计为可扩展，支持动态调整槽位数量和开启/关闭五行机制
 */
export class FiveElementsService {
    
    /**
     * 计算装备槽的元素强度
     * @param equip 装备实例
     * @returns 元素强度值
     */
    private static calculateElementPower(equip: EquipmentInstance): number {
        const config = FIVE_ELEMENTS_CONFIG.POWER_CONVERSION;
        
        // 主属性贡献
        const mainStatContribution = equip.mainStat.value * config.mainStatWeight;
        
        // 副属性贡献
        const subStatsContribution = equip.subStats.reduce((sum, subStat) => {
            return sum + subStat.value * config.subStatWeight;
        }, 0);
        
        // 等级和星级贡献
        const levelContribution = equip.level * config.levelMultiplier;
        const gradeContribution = equip.grade * config.gradeMultiplier;
        
        // 总强度
        return mainStatContribution + subStatsContribution + levelContribution + gradeContribution;
    }
    
    /**
     * 获取槽位对应的元素类型
     * @param slot 槽位编号
     * @returns 元素类型，如果没有映射则返回null
     */
    private static getElementBySlot(slot: number): ElementType | null {
        const mapping = FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS.find(m => m.slot === slot);
        return mapping?.element || null;
    }
    
    /**
     * 获取元素间的关系
     * @param source 源元素
     * @param target 目标元素
     * @returns 关系定义，如果没有则返回null
     */
    private static getElementRelation(source: ElementType, target: ElementType): any | null {
        return FIVE_ELEMENTS_CONFIG.ELEMENT_RELATIONS.find(
            r => r.source === source && r.target === target
        ) || null;
    }
    
    /**
     * 计算五行系统结果
     * @param equipments 装备列表
     * @returns 五行计算结果
     */
    public static calculateFiveElements(equipments: EquipmentInstance[]): FiveElementsResult {
        // 如果五行系统未开启，返回空结果
        if (!FIVE_ELEMENTS_CONFIG.ENABLED) {
            return {
                slotElements: [],
                totalPower: 0,
                activeRelations: [],
                stateSummary: {
                    [ElementState.HEALTHY]: 0,
                    [ElementState.SUPPRESSED]: 0,
                    [ElementState.STARVED]: 0,
                }
            };
        }
        
        const slotElements: SlotElementInfo[] = [];
        const config = FIVE_ELEMENTS_CONFIG.CALCULATION_PARAMS;
        
        // 第一步：计算每个槽位的基础元素强度
        for (const equip of equipments) {
            const element = this.getElementBySlot(equip.slot);
            if (element) {
                const power = this.calculateElementPower(equip);
                slotElements.push({
                    slot: equip.slot,
                    element,
                    power,
                    state: ElementState.HEALTHY, // 初始状态为健康
                    efficiency: 1.0, // 初始效率为100%
                });
            }
        }
        
        // 第二步：根据相克关系计算抑制状态
        for (const slotElement of slotElements) {
            // 查找所有克制当前元素的关系
            const restrainingRelations = FIVE_ELEMENTS_CONFIG.ELEMENT_RELATIONS.filter(
                r => r.type === ElementRelationType.RESTRAINS && r.target === slotElement.element
            );
            
            for (const relation of restrainingRelations) {
                // 查找克制元素的槽位
                const restrainingSlot = slotElements.find(
                    s => s.element === relation.source
                );
                
                if (restrainingSlot && restrainingSlot.power > slotElement.power * config.SUPPRESSION_THRESHOLD) {
                    // 被抑制，效率降低
                    slotElement.state = ElementState.SUPPRESSED;
                    slotElement.efficiency = config.STATE_EFFICIENCY_MODIFIERS.suppressed;
                    break;
                }
            }
        }
        
        // 第三步：根据相生关系计算饥饿状态
        for (const slotElement of slotElements) {
            // 查找所有当前元素生成的关系
            const generatingRelations = FIVE_ELEMENTS_CONFIG.ELEMENT_RELATIONS.filter(
                r => r.type === ElementRelationType.GENERATES && r.source === slotElement.element
            );
            
            for (const relation of generatingRelations) {
                // 计算流入到目标元素的强度
                const inflow = slotElement.power * slotElement.efficiency * relation.multiplier;
                
                // 查找目标元素的槽位
                const targetSlot = slotElements.find(
                    s => s.element === relation.target
                );
                
                if (targetSlot && inflow < config.STARVATION_THRESHOLD) {
                    // 目标元素进入饥饿状态
                    targetSlot.state = ElementState.STARVED;
                }
            }
        }
        
        // 第四步：统计结果
        const totalPower = slotElements.reduce((sum, slot) => sum + slot.power, 0);
        
        // 统计各状态数量
        const stateSummary: Record<ElementState, number> = {
            [ElementState.HEALTHY]: 0,
            [ElementState.SUPPRESSED]: 0,
            [ElementState.STARVED]: 0,
        };
        
        for (const slotElement of slotElements) {
            stateSummary[slotElement.state]++;
        }
        
        // 收集激活的关系
        const activeRelations = FIVE_ELEMENTS_CONFIG.ELEMENT_RELATIONS.filter(relation => {
            const sourceSlot = slotElements.find(s => s.element === relation.source);
            const targetSlot = slotElements.find(s => s.element === relation.target);
            return sourceSlot && targetSlot;
        });
        
        return {
            slotElements,
            totalPower,
            activeRelations,
            stateSummary
        };
    }
    
    /**
     * 计算装备的总属性，包括五行加成
     * @param baseStats 基础属性
     * @param fiveElementsResult 五行计算结果
     * @returns 最终属性，包括五行加成
     */
    public static calculateTotalStatsWithElements(
        baseStats: Record<string, number>,
        fiveElementsResult: FiveElementsResult
    ): Record<string, number> {
        // 如果五行系统未开启，直接返回基础属性
        if (!FIVE_ELEMENTS_CONFIG.ENABLED) {
            return { ...baseStats };
        }
        
        const result = { ...baseStats };
        
        // 计算五行加成
        for (const slotElement of fiveElementsResult.slotElements) {
            // 根据元素类型和状态添加不同的加成
            const { element, power, efficiency } = slotElement;
            const effectivePower = power * efficiency;
            
            switch (element) {
                case ElementType.METAL: // 金 - 攻击型槽位
                    // 攻击加成
                    result[StatType.ATK_P] = (result[StatType.ATK_P] || 0) + (effectivePower * 0.01);
                    // 暴击率加成
                    result[StatType.CRIT] = (result[StatType.CRIT] || 0) + (effectivePower * 0.005);
                    // 暴击伤害加成
                    result[StatType.CRIT_DMG] = (result[StatType.CRIT_DMG] || 0) + (effectivePower * 0.01);
                    break;
                    
                case ElementType.WATER: // 水 - 支持型槽位
                    // 效果命中加成
                    result[StatType.EFFECT_HIT] = (result[StatType.EFFECT_HIT] || 0) + (effectivePower * 0.01);
                    // 效果抵抗加成
                    result[StatType.EFFECT_RESIST] = (result[StatType.EFFECT_RESIST] || 0) + (effectivePower * 0.01);
                    // 治疗加成
                    result[StatType.HEAL_BONUS] = (result[StatType.HEAL_BONUS] || 0) + (effectivePower * 0.01);
                    break;
                    
                case ElementType.WOOD: // 木 - 生长型槽位
                    // 生命加成
                    result[StatType.HP_P] = (result[StatType.HP_P] || 0) + (effectivePower * 0.01);
                    // 承受治疗加成
                    result[StatType.RECEIVE_HEAL_BONUS] = (result[StatType.RECEIVE_HEAL_BONUS] || 0) + (effectivePower * 0.01);
                    break;
                    
                case ElementType.FIRE: // 火 - 爆发型槽位
                    // 伤害加成
                    result[StatType.DMG_BONUS] = (result[StatType.DMG_BONUS] || 0) + (effectivePower * 0.01);
                    // 无视防御
                    result[StatType.IGNORE_DEF_P] = (result[StatType.IGNORE_DEF_P] || 0) + (effectivePower * 0.005);
                    break;
                    
                case ElementType.EARTH: // 土 - 防御型槽位
                    // 防御加成
                    result[StatType.DEF_P] = (result[StatType.DEF_P] || 0) + (effectivePower * 0.01);
                    // 速度加成
                    result[StatType.SPD_P] = (result[StatType.SPD_P] || 0) + (effectivePower * 0.005);
                    break;
            }
        }
        
        return result;
    }
    
    /**
     * 获取所有激活的套装效果
     * @param equipments 装备列表
     * @returns 激活的套装效果列表
     */
    public static getActiveSetEffects(equipments: EquipmentInstance[]): any[] {
        // 如果五行系统未开启，返回空列表
        if (!FIVE_ELEMENTS_CONFIG.ENABLED) {
            return [];
        }
        
        // 统计套装数量
        const setCounts: Record<string, number> = {};
        for (const equip of equipments) {
            setCounts[equip.setId] = (setCounts[equip.setId] || 0) + 1;
        }
        
        // 计算五行结果
        const fiveElementsResult = this.calculateFiveElements(equipments);
        
        // 收集激活的套装效果
        const activeEffects: any[] = [];
        
        // 遍历每个套装
        for (const [setId, count] of Object.entries(setCounts)) {
            // 获取套装定义
            const setDefinition = EQUIPMENT_SETS[setId];
            if (!setDefinition) continue;
            
            // 查找最大激活的件数
            const possiblePieceCounts = Object.keys(setDefinition.effects)
                .map(Number)
                .sort((a, b) => b - a);
            
            for (const pieceCount of possiblePieceCounts) {
                if (count >= pieceCount) {
                    const effect = setDefinition.effects[pieceCount];
                    if (effect) {
                        // 基于五行关系的效果增强
                        const enhancedEffect = this.enhanceSetEffect(effect, fiveElementsResult);
                        activeEffects.push({
                            setId,
                            setName: setDefinition.name,
                            pieceCount,
                            effect: enhancedEffect
                        });
                    }
                    break; // 只激活最高阶效果
                }
            }
        }
        
        return activeEffects;
    }
    
    /**
     * 基于五行结果增强套装效果
     * @param effect 原始套装效果
     * @param fiveElementsResult 五行计算结果
     * @returns 增强后的套装效果
     */
    private static enhanceSetEffect(effect: any, fiveElementsResult: FiveElementsResult): any {
        // 复制原始效果
        const enhancedEffect = { ...effect };
        
        // 根据五行状态调整效果值
        if (effect.value !== undefined) {
            // 计算五行增强系数
            const { stateSummary } = fiveElementsResult;
            
            // 健康状态提供正向加成，被抑制状态提供负向加成
            const healthBonus = stateSummary[ElementState.HEALTHY] * 0.1; // 每个健康元素 +10%
            const suppressedPenalty = stateSummary[ElementState.SUPPRESSED] * 0.05; // 每个被抑制元素 -5%
            const starvedPenalty = stateSummary[ElementState.STARVED] * 0.03; // 每个饥饿元素 -3%
            
            // 总增强系数
            const enhancementFactor = 1 + healthBonus - suppressedPenalty - starvedPenalty;
            
            // 应用增强
            enhancedEffect.value = Math.round(effect.value * enhancementFactor);
            enhancedEffect.enhancement = {
                healthBonus,
                suppressedPenalty,
                starvedPenalty,
                totalFactor: enhancementFactor
            };
        }
        
        return enhancedEffect;
    }
}

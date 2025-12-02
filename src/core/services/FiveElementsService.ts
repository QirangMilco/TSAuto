import { EquipmentInstance } from './EquipmentService';
import { FIVE_ELEMENTS_CONFIG } from '../config/fiveElements';
import { ElementType, ElementState, SlotElementInfo, FiveElementsResult, ElementRelationType } from '../types/fiveElements';

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
            // 这里可以根据游戏设计添加具体的加成逻辑
            // 例如：金元素提供攻击加成，水元素提供生命加成等
        }
        
        return result;
    }
    
    /**
     * 获取所有激活的套装效果
     * @param equipments 装备列表
     * @returns 激活的套装效果列表
     */
    public static getActiveSetEffects(equipments: EquipmentInstance[]): any[] {
        // 这里可以实现基于五行系统的套装效果逻辑
        // 例如：某些套装效果需要特定的五行组合才能激活
        return [];
    }
}

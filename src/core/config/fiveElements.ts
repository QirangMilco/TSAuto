import { ElementType, ElementRelation, ElementRelationType, SlotElementMapping } from '../types/fiveElements';

/**
 * 五行系统配置
 */
export const FIVE_ELEMENTS_CONFIG = {
    // 核心开关 - 可以完全关闭五行系统
    ENABLED: true,
    
    // 槽位数量配置 (与装备系统保持一致)
    // 注意：这只是五行系统的槽位配置，实际装备槽位数量由 EQUIPMENT_CONFIG.SLOT_COUNT 决定
    SLOT_COUNT: 5, // 默认5个五行槽位，对应金、木、水、火、土
    
    // 槽位与元素的映射关系
    // 模组可以轻松扩展此配置，添加更多槽位和对应的元素
    SLOT_ELEMENT_MAPPINGS: [
        { slot: 1, element: ElementType.METAL, name: '金', description: '攻击型槽位' },
        { slot: 2, element: ElementType.WATER, name: '水', description: '支持型槽位' },
        { slot: 3, element: ElementType.WOOD, name: '木', description: '生长型槽位' },
        { slot: 4, element: ElementType.FIRE, name: '火', description: '爆发型槽位' },
        { slot: 5, element: ElementType.EARTH, name: '土', description: '防御型槽位' },
        // 可以轻松添加更多槽位映射
        // { slot: 6, element: ElementType.METAL, name: '金', description: '额外金槽位' },
        // { slot: 7, element: ElementType.WATER, name: '水', description: '额外水槽位' },
    ] as SlotElementMapping[],
    
    // 五行关系定义
    // 相生: 金生水, 水生木, 木生火, 火生土, 土生金
    // 相克: 金克木, 木克土, 土克水, 水克火, 火克金
    ELEMENT_RELATIONS: [
        // 相生关系
        { source: ElementType.METAL, target: ElementType.WATER, type: ElementRelationType.GENERATES, multiplier: 0.2 },
        { source: ElementType.WATER, target: ElementType.WOOD, type: ElementRelationType.GENERATES, multiplier: 0.2 },
        { source: ElementType.WOOD, target: ElementType.FIRE, type: ElementRelationType.GENERATES, multiplier: 0.2 },
        { source: ElementType.FIRE, target: ElementType.EARTH, type: ElementRelationType.GENERATES, multiplier: 0.2 },
        { source: ElementType.EARTH, target: ElementType.METAL, type: ElementRelationType.GENERATES, multiplier: 0.2 },
        
        // 相克关系
        { source: ElementType.METAL, target: ElementType.WOOD, type: ElementRelationType.RESTRAINS, multiplier: 1.5 },
        { source: ElementType.WOOD, target: ElementType.EARTH, type: ElementRelationType.RESTRAINS, multiplier: 1.5 },
        { source: ElementType.EARTH, target: ElementType.WATER, type: ElementRelationType.RESTRAINS, multiplier: 1.5 },
        { source: ElementType.WATER, target: ElementType.FIRE, type: ElementRelationType.RESTRAINS, multiplier: 1.5 },
        { source: ElementType.FIRE, target: ElementType.METAL, type: ElementRelationType.RESTRAINS, multiplier: 1.5 },
    ] as ElementRelation[],
    
    // 计算参数
    CALCULATION_PARAMS: {
        // 抑制阈值 - 如果相克元素的强度超过此倍数，会被抑制
        SUPPRESSION_THRESHOLD: 1.5,
        
        // 饥饿阈值 - 如果元素强度低于此值，会进入饥饿状态
        STARVATION_THRESHOLD: 100,
        
        // 效率系数
        EFFICIENCY: {
            [ElementType.METAL]: 1.0,
            [ElementType.WATER]: 1.0,
            [ElementType.WOOD]: 1.0,
            [ElementType.FIRE]: 1.0,
            [ElementType.EARTH]: 1.0,
        },
        
        // 状态效率修正
        STATE_EFFICIENCY_MODIFIERS: {
            healthy: 1.0,    // 健康 - 100% 效率
            suppressed: 0.5, // 被抑制 - 50% 效率
            starved: 1.0,    // 饥饿 - 自身效率正常，但无法提供加成
        },
    },
    
    // 装备属性到元素强度的转换系数
    // 可以根据不同装备类型调整转换系数
    POWER_CONVERSION: {
        mainStatWeight: 1.0,  // 主属性权重
        subStatWeight: 0.5,   // 副属性权重
        levelMultiplier: 0.1, // 等级乘数
        gradeMultiplier: 0.2, // 星级乘数
    },
};

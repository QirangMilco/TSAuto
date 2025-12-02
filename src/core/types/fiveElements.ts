import { EquipmentInstance } from '../services/EquipmentService';

/**
 * 五行元素类型
 */
export enum ElementType {
    METAL = 'metal',      // 金
    WATER = 'water',      // 水
    WOOD = 'wood',        // 木
    FIRE = 'fire',        // 火
    EARTH = 'earth',      // 土
    // 可以轻松扩展更多元素类型
}

/**
 * 元素状态
 */
export enum ElementState {
    HEALTHY = 'healthy',  // 健康 - 100% 效率
    SUPPRESSED = 'suppressed', // 被抑制 - 50% 效率
    STARVED = 'starved',  // 饥饿 - 0% 效率，但自身属性正常
}

/**
 * 五行关系类型
 */
export enum ElementRelationType {
    GENERATES = 'generates',  // 相生
    RESTRAINS = 'restrains',  // 相克
}

/**
 * 单个装备槽的五行信息
 */
export interface SlotElementInfo {
    slot: number;              // 槽位编号
    element: ElementType;      // 元素类型
    power: number;             // 元素强度
    state: ElementState;       // 元素状态
    efficiency: number;        // 效率系数 (0.0 - 1.0)
}

/**
 * 五行关系定义
 */
export interface ElementRelation {
    source: ElementType;       // 源元素
    target: ElementType;       // 目标元素
    type: ElementRelationType; // 关系类型
    multiplier: number;        // 影响系数
}

/**
 * 五行计算结果
 */
export interface FiveElementsResult {
    slotElements: SlotElementInfo[]; // 各槽位的五行信息
    totalPower: number;             // 总元素强度
    activeRelations: ElementRelation[]; // 激活的关系
    stateSummary: Record<ElementState, number>; // 状态统计
}

/**
 * 装备槽与元素的映射配置
 */
export interface SlotElementMapping {
    slot: number;              // 槽位编号
    element: ElementType;      // 元素类型
    name?: string;             // 槽位名称 (可选)
    description?: string;      // 槽位描述 (可选)
}

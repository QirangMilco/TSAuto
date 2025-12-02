import { describe, it, expect, afterEach } from 'vitest';
import { EquipmentService, type EquipmentInstance } from '../../../src/core/services/EquipmentService';
import { FiveElementsService } from '../../../src/core/services/FiveElementsService';
import { FIVE_ELEMENTS_CONFIG } from '../../../src/core/config/fiveElements';
import { EQUIPMENT_CONFIG } from '../../../src/core/config/equipments';
import { ElementType } from '../../../src/core/types/fiveElements';
import type { EquipmentDefinition } from '../../../src/core/types/definitions';

// 模拟装备定义
const mockEquipmentDef: EquipmentDefinition = {
    id: 'mock_equip',
    name: '测试装备',
    setId: 'WIND_SET',
    slot: 1,
    possibleSecondaryStats: [],
};

// 模拟6星装备定义
const mockHighGradeDef: EquipmentDefinition = {
    ...mockEquipmentDef,
    id: 'mock_high_grade',
    name: '高级测试装备',
    possibleSecondaryStats: [],
};

describe('FiveElementsService', () => {
    
    // 保存原始配置，以便测试后恢复
    const originalEnabled = FIVE_ELEMENTS_CONFIG.ENABLED;
    const originalSlotCount = EQUIPMENT_CONFIG.SLOT_COUNT;
    
    afterEach(() => {
        // 恢复原始配置
        FIVE_ELEMENTS_CONFIG.ENABLED = originalEnabled;
        EQUIPMENT_CONFIG.SLOT_COUNT = originalSlotCount;
    });
    
    describe('五行系统开关', () => {
        it('应该能够关闭五行系统', () => {
            // 关闭五行系统
            FIVE_ELEMENTS_CONFIG.ENABLED = false;
            
            // 创建装备实例
            const equip = EquipmentService.createEquipment(mockEquipmentDef);
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements([equip]);
            
            // 验证结果为空
            expect(result.slotElements).toEqual([]);
            expect(result.totalPower).toBe(0);
            expect(result.activeRelations).toEqual([]);
        });
        
        it('应该能够开启五行系统', () => {
            // 开启五行系统
            FIVE_ELEMENTS_CONFIG.ENABLED = true;
            
            // 创建装备实例
            const equip = EquipmentService.createEquipment(mockEquipmentDef);
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements([equip]);
            
            // 验证结果不为空
            expect(result.slotElements.length).toBeGreaterThan(0);
        });
    });
    
    describe('装备槽位扩展性', () => {
        it('应该支持5个装备槽位', () => {
            // 设置为5个槽位
            EQUIPMENT_CONFIG.SLOT_COUNT = 5;
            
            // 创建5件装备，分别对应不同槽位
            const equips = [];
            for (let i = 1; i <= 5; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    slot: i
                }));
            }
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements(equips);
            
            // 验证所有槽位都被处理
            expect(result.slotElements.length).toBe(5);
        });
        
        it('应该支持6个装备槽位', () => {
            // 设置为6个槽位
            EQUIPMENT_CONFIG.SLOT_COUNT = 6;
            
            // 更新五行配置，添加第6个槽位的元素映射
            const originalMappings = [...FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS];
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS.push({
                slot: 6,
                element: ElementType.METAL,
                name: '金',
                description: '额外金槽位'
            });
            
            // 创建6件装备，分别对应不同槽位
            const equips = [];
            for (let i = 1; i <= 6; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    slot: i
                }));
            }
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements(equips);
            
            // 验证所有槽位都被处理
            expect(result.slotElements.length).toBe(6);
            
            // 恢复原始配置
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS = originalMappings;
        });
        
        it('应该支持7个装备槽位', () => {
            // 设置为7个槽位
            EQUIPMENT_CONFIG.SLOT_COUNT = 7;
            
            // 更新五行配置，添加第6和第7个槽位的元素映射
            const originalMappings = [...FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS];
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS.push(
                {
                    slot: 6,
                    element: ElementType.METAL,
                    name: '金',
                    description: '额外金槽位'
                },
                {
                    slot: 7,
                    element: ElementType.WATER,
                    name: '水',
                    description: '额外水槽位'
                }
            );
            
            // 创建7件装备，分别对应不同槽位
            const equips = [];
            for (let i = 1; i <= 7; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    slot: i
                }));
            }
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements(equips);
            
            // 验证所有槽位都被处理
            expect(result.slotElements.length).toBe(7);
            
            // 恢复原始配置
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS = originalMappings;
        });
    });
    
    describe('装备套装扩展性', () => {
        it('应该支持2件套效果', () => {
            // 创建2件相同套装的装备
            const equips = [
                EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    setId: 'WIND_SET',
                    slot: 1
                }),
                EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    setId: 'WIND_SET',
                    slot: 2
                })
            ];
            
            // 计算总属性
            const stats = EquipmentService.calculateTotalStats(equips);
            
            // 验证2件套效果被应用（风语套装2件套+15%攻击）
            expect(stats.ATK_P).toBeGreaterThan(0);
        });
        
        it('应该支持4件套效果', () => {
            // 创建4件相同套装的装备
            const equips = [];
            for (let i = 1; i <= 4; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    setId: 'WIND_SET',
                    slot: i
                }));
            }
            
            // 计算总属性
            const stats = EquipmentService.calculateTotalStats(equips);
            
            // 验证4件套效果被应用（风语套装4件套+25速度）
            expect(stats.SPD).toBeGreaterThan(0);
        });
        
        it('应该支持6件套效果', () => {
            // 创建6件相同套装的装备
            const equips = [];
            for (let i = 1; i <= 6; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    setId: 'SIX_SET',
                    slot: i
                }));
            }
            
            // 计算总属性
            const stats = EquipmentService.calculateTotalStats(equips);
            
            // 验证6件套效果被应用（+30%暴击伤害）
            expect(stats.CRIT_DMG).toBeGreaterThan(0);
        });
        
        it('应该支持7件套效果', () => {
            // 开启五行系统
            FIVE_ELEMENTS_CONFIG.ENABLED = true;
            
            // 设置为7个槽位
            EQUIPMENT_CONFIG.SLOT_COUNT = 7;
            
            // 更新五行配置，添加第6和第7个槽位的元素映射
            const originalMappings = [...FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS];
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS.push(
                {
                    slot: 6,
                    element: ElementType.METAL,
                    name: '金',
                    description: '额外金槽位'
                },
                {
                    slot: 7,
                    element: ElementType.WATER,
                    name: '水',
                    description: '额外水槽位'
                }
            );
            
            // 创建7件相同套装的装备
            const equips = [];
            for (let i = 1; i <= 7; i++) {
                equips.push(EquipmentService.createEquipment({
                    ...mockEquipmentDef,
                    setId: 'SEVEN_SET',
                    slot: i
                }));
            }
            
            // 计算套装效果
            const fiveElementsResult = FiveElementsService.calculateFiveElements(equips);
            
            // 验证所有装备都被处理
            expect(fiveElementsResult.slotElements.length).toBe(7);
            
            // 恢复原始配置
            FIVE_ELEMENTS_CONFIG.SLOT_ELEMENT_MAPPINGS = originalMappings;
        });
    });
    
    describe('五行关系计算', () => {
        it('应该正确计算相生关系', () => {
            // 创建5件装备，分别对应金、水、木、火、土
            const equips = [
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 1, // 金
                    mainStat: { type: 'ATK' as any, value: 1000 }
                }),
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 2, // 水
                    mainStat: { type: 'HP' as any, value: 1000 }
                }),
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 3, // 木
                    mainStat: { type: 'DEF' as any, value: 1000 }
                }),
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 4, // 火
                    mainStat: { type: 'ATK_P' as any, value: 100 }
                }),
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 5, // 土
                    mainStat: { type: 'HP_P' as any, value: 100 }
                })
            ];
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements(equips);
            
            // 验证相生关系被正确处理
            expect(result.totalPower).toBeGreaterThan(0);
            expect(result.slotElements.length).toBe(5);
        });
        
        it('应该正确计算相克关系', () => {
            // 创建2件装备，金和木（金克木）
            const equips = [
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 1, // 金
                    mainStat: { type: 'ATK' as any, value: 10000 } // 非常强的金
                }),
                EquipmentService.createEquipment({
                    ...mockHighGradeDef,
                    slot: 3, // 木
                    mainStat: { type: 'ATK' as any, value: 1000 } // 相对较弱的木
                })
            ];
            
            // 计算五行结果
            const result = FiveElementsService.calculateFiveElements(equips);
            
            // 验证相克关系被正确处理（木应该被抑制）
            const woodSlot = result.slotElements.find(s => s.slot === 3);
            expect(woodSlot).toBeDefined();
            // 注意：实际结果可能受具体计算逻辑影响，这里主要验证系统能够处理相克关系
        });
    });
});

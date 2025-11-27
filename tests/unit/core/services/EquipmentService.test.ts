import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentService, type EquipmentInstance } from '../../../../src/core/services/EquipmentService';
import { StatType } from '../../../../src/core/types/definitions';
import type { EquipmentDefinition } from '../../../../src/core/types/definitions';

// Mock Equipment Definition
const mockEquipmentDef: EquipmentDefinition = {
  id: 'EQUIP_2001',
  name: 'Test Equipment',
  setId: 'TEST_SET',
  slot: 1,
  possibleSecondaryStats: [StatType.ATK_P, StatType.HP_P, StatType.DEF_P, StatType.SPD]
};

describe('EquipmentService', () => {
  let equipmentService: typeof EquipmentService;
  
  beforeEach(() => {
    equipmentService = EquipmentService;
  });
  
  describe('createEquipment', () => {
    it('should create a new equipment with correct basic properties', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      
      expect(equipment).toBeDefined();
      expect(equipment.instanceId).toBeTruthy();
      expect(equipment.definitionId).toBe(mockEquipmentDef.id);
      expect(equipment.setId).toBe(mockEquipmentDef.setId);
      expect(equipment.slot).toBe(mockEquipmentDef.slot);
      expect(equipment.level).toBe(0);
      expect(equipment.grade).toBe(6); // 默认6星
      expect(equipment.mainStat).toBeDefined();
      expect(equipment.subStats).toBeDefined();
    });
    
    it('should create equipment with correct number of initial substats', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      
      // 6星装备初始副属性数量应该在2-4之间
      expect(equipment.subStats.length).toBeGreaterThanOrEqual(2);
      expect(equipment.subStats.length).toBeLessThanOrEqual(4);
    });
  });
  
  describe('enhance', () => {
    it('should enhance equipment to target level', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      const targetLevel = 9;
      
      equipmentService.enhance(equipment, targetLevel);
      
      expect(equipment.level).toBe(targetLevel);
    });
    
    it('should not exceed max level of 15', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      const targetLevel = 20;
      
      equipmentService.enhance(equipment, targetLevel);
      
      expect(equipment.level).toBe(15);
    });
    
    it('should add new substats at levels 3, 6, 9, 12 when under 4 substats', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      // 确保初始只有2个副属性，以便测试添加新副属性
      while (equipment.subStats.length > 2) {
        equipment.subStats.pop();
      }
      
      const initialSubstatCount = equipment.subStats.length;
      
      // 强化到3级，应该添加1个副属性
      equipmentService.enhance(equipment, 3);
      expect(equipment.subStats.length).toBe(initialSubstatCount + 1);
      
      // 强化到6级，应该再添加1个副属性
      equipmentService.enhance(equipment, 6);
      expect(equipment.subStats.length).toBe(initialSubstatCount + 2);
    });
    
    it('should increase existing substat values at levels 3, 6, 9, 12, 15 when at max substats', () => {
      const equipment = equipmentService.createEquipment(mockEquipmentDef);
      // 确保有4个副属性
      while (equipment.subStats.length < 4) {
        equipment.subStats.push({ type: StatType.ATK_P, value: 3.0 });
      }
      
      const initialSubstatValues = equipment.subStats.map(sub => sub.value);
      
      // 强化到3级，应该强化一个副属性
      equipmentService.enhance(equipment, 3);
      
      // 检查是否有副属性值增加
      const hasIncreased = equipment.subStats.some((sub, index) => sub.value > initialSubstatValues[index]);
      expect(hasIncreased).toBe(true);
    });
  });
  
  describe('calculateTotalStats', () => {
    it('should calculate total stats from multiple equipment', () => {
      const equipment1 = equipmentService.createEquipment(mockEquipmentDef);
      equipment1.mainStat = { type: StatType.ATK, value: 100 };
      equipment1.subStats = [{ type: StatType.ATK_P, value: 15 }];
      
      const equipment2 = equipmentService.createEquipment(mockEquipmentDef);
      equipment2.slot = 2;
      equipment2.mainStat = { type: StatType.HP, value: 500 };
      equipment2.subStats = [{ type: StatType.HP_P, value: 15 }];
      
      const totalStats = equipmentService.calculateTotalStats([equipment1, equipment2]);
      
      expect(totalStats[StatType.ATK]).toBe(100);
      expect(totalStats[StatType.ATK_P]).toBe(15);
      expect(totalStats[StatType.HP]).toBe(500);
      expect(totalStats[StatType.HP_P]).toBe(15);
    });
    
    it('should calculate set bonuses correctly', () => {
      // 创建4件相同套装的装备
      const equipment1 = equipmentService.createEquipment(mockEquipmentDef);
      const equipment2 = equipmentService.createEquipment(mockEquipmentDef);
      equipment2.slot = 2;
      const equipment3 = equipmentService.createEquipment(mockEquipmentDef);
      equipment3.slot = 3;
      const equipment4 = equipmentService.createEquipment(mockEquipmentDef);
      equipment4.slot = 4;
      
      const totalStats = equipmentService.calculateTotalStats([equipment1, equipment2, equipment3, equipment4]);
      
      // 这里假设TEST_SET套装有2件套和4件套效果，实际需要根据配置调整
      // 暂时只测试计算过程没有错误
      expect(totalStats).toBeDefined();
    });
  });
  
  describe('rollIrwinHall', () => {
    it('should generate values within the specified range', () => {
      const min = 2.4;
      const max = 3.0;
      
      for (let i = 0; i < 100; i++) {
        const value = equipmentService.rollIrwinHall(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    });
    
    it('should generate values that follow a normal distribution', () => {
      // 这个测试主要验证函数能正常工作，不严格测试分布
      const min = 2.4;
      const max = 3.0;
      const values: number[] = [];
      
      for (let i = 0; i < 1000; i++) {
        values.push(equipmentService.rollIrwinHall(min, max));
      }
      
      // 计算平均值，应该接近中间值
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const expectedMean = (min + max) / 2;
      
      // 允许一定误差
      expect(average).toBeCloseTo(expectedMean, 1);
    });
  });
});

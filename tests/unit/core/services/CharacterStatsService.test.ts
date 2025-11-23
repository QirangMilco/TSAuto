import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterStatsService } from '../../../../src/core/services/CharacterStatsService';
import { DEFAULT_GROWTH_TABLE, PROMOTION_GROWTH_TABLE } from '../../../../src/core/config/growthTable';
import { StatType } from '../../../../src/core/types/definitions';
import type { CharacterDefinition } from '../../../../src/core/types/definitions';

describe('CharacterStatsService', () => {
  // 每个测试前重置为默认表，防止测试间污染
  beforeEach(() => {
    CharacterStatsService.setGrowthTable(DEFAULT_GROWTH_TABLE);
  });

  describe('getGrowthCoefficients (系数获取)', () => {
    it('应该返回普通等级的系数 (Lv.30, 2星)', () => {
      // 普通30级 (非升星节点)
      const coeffs = CharacterStatsService.getGrowthCoefficients(30, 2);
      // 验证默认表中的 Lv.30 数据
      expect(coeffs.atk).toBe(970);
    });

    it('应该返回升星节点的特殊系数 (Lv.30, 5星)', () => {
      // 5星30级 (升星节点)
      const coeffs = CharacterStatsService.getGrowthCoefficients(30, 5);
      // 验证升星表(PROMOTION_GROWTH_TABLE)中的 5星 数据
      expect(coeffs.atk).toBe(1234); // 远高于 970
    });

    it('应该正确处理跨升星节点的插值 (Lv.30.5, 5星)', () => {
      // 测试插值: 起点是 5星30级(1234), 终点是 普通31级(1302)
      // Lv.30.5 应该在两者中间: 1234 + (1302 - 1234) * 0.5 = 1268
      const coeffs = CharacterStatsService.getGrowthCoefficients(30.5, 5);
      expect(coeffs.atk).toBe(1268);
    });
    
    it('如果不满足升星条件，应回退到普通插值 (Lv.30.5, 2星)', () => {
       // 测试插值: 起点是 普通30级(970), 终点是 普通31级(1302)
       // Lv.30.5: 970 + (1302 - 970) * 0.5 = 1136
       const coeffs = CharacterStatsService.getGrowthCoefficients(30.5, 2);
       expect(coeffs.atk).toBe(1136);
    });
  });

  describe('calculateBaseStats (面板计算)', () => {
    const mockCharacter: CharacterDefinition = {
      id: 'TEST_CHAR',
      name: 'Test',
      assets: { avatar: '', portrait: '' },
      // 模拟 S 级成长 (系数假设为 3.0)
      growthValuesBeforeAwake: {
        hp: 1.0, 
        atk: 3.0, 
        def: 1.0,
        spd: 0, crit: 0, critDmg: 0
      },
      baseValuesBeforeAwake: { spd: 100, crit: 0.1, critDmg: 1.5 },
      
      // 觉醒后 S+ 级成长
      growthValuesAfterAwake: { hp: 1.2, atk: 3.5, def: 1.2 },
      baseValuesAfterAwake: { spd: 110, crit: 0.1, critDmg: 1.5 },
      
      skills: ['s1', 's2', 's3']
    };

    it('计算 2星 Lv.30 (未觉醒) - 普通面板', () => {
      // 参数: char, level=30, grade=2, awakened=false
      const stats = CharacterStatsService.calculateBaseStats(mockCharacter, 30, 2, false);
      
      // ATK = floor(3.0 * 970) = 2910
      expect(stats[StatType.ATK]).toBe(2910);
    });

    it('计算 5星 Lv.30 (未觉醒) - 升星面板', () => {
      // 参数: char, level=30, grade=5, awakened=false
      const stats = CharacterStatsService.calculateBaseStats(mockCharacter, 30, 5, false);
      
      // ATK = floor(3.0 * 1234) = 3702
      // 验证是否使用了更高的升星系数
      expect(stats[StatType.ATK]).toBe(3702);
    });

    it('计算 6星 Lv.40 (觉醒后) - 满级满星面板', () => {
      // 觉醒系数 3.5
      // 40级系数 (表中为 2680, 40级通常无升星阶跃冲突，除非定义了7星)
      const stats = CharacterStatsService.calculateBaseStats(mockCharacter, 40, 6, true);
      
      // ATK = floor(3.5 * 2680) = 9380
      expect(stats[StatType.ATK]).toBe(9380);
      // 验证觉醒后的基础速度
      expect(stats[StatType.SPD]).toBe(110);
    });
  });
});
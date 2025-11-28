import { describe, it, expect, beforeEach } from 'vitest';
import { GachaService } from '../../../../src/core/services/GachaService';
import { GachaConfigManager } from '../../../../src/core/config/gacha';

describe('GachaService', () => {
  // 每个测试前重置服务状态，防止测试间污染
  beforeEach(() => {
    const gachaService = GachaService.getInstance();
    gachaService.resetHistory();
    
    // 重置配置为默认配置
    const configManager = GachaConfigManager.getInstance();
    configManager.setConfig({
      rarities: [
        { type: 'SSR', name: 'SSR', probability: 5, rank: 4 },
        { type: 'SR', name: 'SR', probability: 15, rank: 3 },
        { type: 'R', name: 'R', probability: 30, rank: 2 },
        { type: 'N', name: 'N', probability: 50, rank: 1 }
      ],
      pity: {
        threshold: 100,
        guaranteedRarity: 'SSR',
        rarityRankThreshold: 4
      },
      characterPool: [
        { characterId: 'CHAR_1001', rarity: 'SSR' },
        { characterId: 'CHAR_1002', rarity: 'SSR' },
        { characterId: 'CHAR_2001', rarity: 'SR' },
        { characterId: 'CHAR_2002', rarity: 'SR' },
        { characterId: 'CHAR_2003', rarity: 'SR' },
        { characterId: 'CHAR_3001', rarity: 'R' },
        { characterId: 'CHAR_3002', rarity: 'R' },
        { characterId: 'CHAR_3003', rarity: 'R' },
        { characterId: 'CHAR_3004', rarity: 'R' },
        { characterId: 'CHAR_4001', rarity: 'N' },
        { characterId: 'CHAR_4002', rarity: 'N' },
        { characterId: 'CHAR_4003', rarity: 'N' },
        { characterId: 'CHAR_4004', rarity: 'N' },
        { characterId: 'CHAR_4005', rarity: 'N' }
      ]
    });
  });
  
  // 辅助函数：打印抽卡结果
  const printGachaResults = (results: any[]) => {
    console.log('\n=== 抽卡结果 ===');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.characterName} (${result.rarity})${result.isPity ? ' [保底]' : ''}`);
    });
    
    // 统计稀有度分布
    const rarityCount: Record<string, number> = {};
    results.forEach(result => {
      rarityCount[result.rarity] = (rarityCount[result.rarity] || 0) + 1;
    });
    
    console.log('\n=== 稀有度分布 ===');
    Object.entries(rarityCount).forEach(([rarity, count]) => {
      console.log(`${rarity}: ${count} (${((count / results.length) * 100).toFixed(1)}%)`);
    });
    console.log('================\n');
  };

  describe('单抽功能', () => {
    it('应该返回有效的抽卡结果', () => {
      const gachaService = GachaService.getInstance();
      const result = gachaService.pull();
      
      console.log('\n=== 单抽测试结果 ===');
      console.log(`角色: ${result.characterName}, 稀有度: ${result.rarity}, 是否保底: ${result.isPity}`);
      console.log('================\n');
      
      expect(result).toHaveProperty('characterId');
      expect(result).toHaveProperty('characterName');
      expect(result).toHaveProperty('rarity');
      expect(result).toHaveProperty('isPity');
    });

    it('应该正确更新抽卡历史', () => {
      const gachaService = GachaService.getInstance();
      
      // 初始历史应为空
      expect(gachaService.getHistory().results.length).toBe(0);
      expect(gachaService.getHistory().currentPulls).toBe(0);
      
      // 执行一次抽卡
      gachaService.pull();
      
      // 验证历史更新
      expect(gachaService.getHistory().results.length).toBe(1);
      expect(gachaService.getHistory().currentPulls).toBe(1);
      
      // 再执行一次抽卡
      gachaService.pull();
      
      // 验证历史再次更新
      expect(gachaService.getHistory().results.length).toBe(2);
      expect(gachaService.getHistory().currentPulls).toBe(2);
    });
  });

  describe('十连抽功能', () => {
    it('应该返回10个抽卡结果', () => {
      const gachaService = GachaService.getInstance();
      const results = gachaService.pullTen();
      
      // 打印抽卡结果
      printGachaResults(results);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('characterId');
        expect(result).toHaveProperty('characterName');
        expect(result).toHaveProperty('rarity');
        expect(result).toHaveProperty('isPity');
      });
    });

    it('应该正确更新抽卡历史', () => {
      const gachaService = GachaService.getInstance();
      
      // 执行十连抽
      gachaService.pullTen();
      
      // 验证历史更新 - 抽卡结果数量应该是10
      expect(gachaService.getHistory().results.length).toBe(10);
      
      // 当前抽卡计数可能小于10，因为抽中高级稀有度会重置保底计数
      // 所以我们只验证计数是合理的（大于等于0，小于等于10）
      expect(gachaService.getHistory().currentPulls).toBeGreaterThanOrEqual(0);
      expect(gachaService.getHistory().currentPulls).toBeLessThanOrEqual(10);
    });
  });

  describe('保底机制', () => {
    it('应该在达到保底次数时触发保底', () => {
      const gachaService = GachaService.getInstance();
      const configManager = GachaConfigManager.getInstance();
      
      // 修改配置，确保不会提前抽到SSR，方便测试保底机制
      configManager.setConfig({
        rarities: [
          { type: 'SSR', name: 'SSR', probability: 0, rank: 4 }, // 概率设为0，确保不会随机抽到
          { type: 'SR', name: 'SR', probability: 10, rank: 3 },
          { type: 'R', name: 'R', probability: 40, rank: 2 },
          { type: 'N', name: 'N', probability: 50, rank: 1 }
        ],
        pity: {
          threshold: 5, // 保底阈值设为5，方便测试
          guaranteedRarity: 'SSR',
          rarityRankThreshold: 4
        },
        characterPool: [
          { characterId: 'CHAR_1001', rarity: 'SSR' },
          { characterId: 'CHAR_1002', rarity: 'SSR' },
          { characterId: 'CHAR_2001', rarity: 'SR' },
          { characterId: 'CHAR_2002', rarity: 'SR' },
          { characterId: 'CHAR_2003', rarity: 'SR' },
          { characterId: 'CHAR_3001', rarity: 'R' },
          { characterId: 'CHAR_3002', rarity: 'R' },
          { characterId: 'CHAR_3003', rarity: 'R' },
          { characterId: 'CHAR_3004', rarity: 'R' },
          { characterId: 'CHAR_4001', rarity: 'N' },
          { characterId: 'CHAR_4002', rarity: 'N' },
          { characterId: 'CHAR_4003', rarity: 'N' },
          { characterId: 'CHAR_4004', rarity: 'N' },
          { characterId: 'CHAR_4005', rarity: 'N' }
        ]
      });
      
      console.log('\n=== 保底机制测试 ===');
      console.log('执行4次抽卡（SSR概率为0，不会抽到）...');
      
      // 执行4次抽卡
      for (let i = 0; i < 4; i++) {
        const result = gachaService.pull();
        console.log(`${i + 1}. ${result.characterName} (${result.rarity})`);
        // 验证不会随机抽到SSR
        expect(result.rarity).not.toBe('SSR');
      }
      
      console.log('\n第5次抽卡（应该触发保底）...');
      
      // 第5次抽卡应该触发保底
      const result = gachaService.pull();
      
      console.log(`${5}. ${result.characterName} (${result.rarity})${result.isPity ? ' [保底]' : ''}`);
      console.log(`当前抽卡计数: ${gachaService.getHistory().currentPulls}`);
      console.log('================\n');
      
      // 验证触发保底
      expect(result.isPity).toBe(true);
      expect(result.rarity).toBe('SSR');
      
      // 验证抽卡计数重置
      expect(gachaService.getHistory().currentPulls).toBe(0);
    });
  });

  describe('概率分布', () => {
    it('应该返回正确的概率分布', () => {
      const gachaService = GachaService.getInstance();
      const distribution = gachaService.getProbabilityDistribution();
      
      expect(distribution).toHaveProperty('rarities');
      expect(distribution).toHaveProperty('currentPulls');
      expect(distribution).toHaveProperty('pityThreshold');
      expect(distribution).toHaveProperty('guaranteedRarity');
      
      // 验证稀有度概率之和为100
      const totalProbability = distribution.rarities.reduce((sum, r) => sum + r.probability, 0);
      expect(totalProbability).toBe(100);
    });
  });

  describe('配置更新', () => {
    it('应该支持动态更新抽卡配置', () => {
      const gachaService = GachaService.getInstance();
      const configManager = GachaConfigManager.getInstance();
      
      // 更新配置，只保留SSR和R稀有度，各50%概率
      configManager.setConfig({
        rarities: [
          { type: 'SSR', name: 'SSR', probability: 50, rank: 4 },
          { type: 'R', name: 'R', probability: 50, rank: 2 }
        ]
      });
      
      console.log('\n=== 配置更新测试 ===');
      console.log('执行20次抽卡，配置为SSR(50%)和R(50%)...');
      
      // 执行多次抽卡，验证结果只包含SSR和R
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(gachaService.pull());
      }
      
      // 打印抽卡结果
      printGachaResults(results);
      
      const uniqueRarities = [...new Set(results.map(r => r.rarity))];
      console.log(`出现的稀有度: ${uniqueRarities.join(', ')}`);
      console.log('================\n');
      
      expect(uniqueRarities).toHaveLength(2);
      expect(uniqueRarities).toContain('SSR');
      expect(uniqueRarities).toContain('R');
    });
  });

  describe('重置功能', () => {
    it('应该正确重置抽卡历史', () => {
      const gachaService = GachaService.getInstance();
      
      console.log('\n=== 重置功能测试 ===');
      console.log('执行十连抽...');
      
      // 执行几次抽卡
      gachaService.pullTen();
      
      console.log(`重置前 - 抽卡次数: ${gachaService.getHistory().results.length}, 当前计数: ${gachaService.getHistory().currentPulls}`);
      
      // 重置历史
      gachaService.resetHistory();
      
      console.log(`重置后 - 抽卡次数: ${gachaService.getHistory().results.length}, 当前计数: ${gachaService.getHistory().currentPulls}`);
      console.log('================\n');
      
      // 验证历史已重置
      expect(gachaService.getHistory().results.length).toBe(0);
      expect(gachaService.getHistory().currentPulls).toBe(0);
    });
  });
});
/**
 * 抽卡系统配置文件
 * 支持通过CONFIG配置稀有度种类、名称和抽取概率
 */

import { GachaConfig } from '../types/definitions';

// 稀有度常量（方便使用）
export const RARITY_CONSTANTS = {
  SSR: 'SSR',
  SR: 'SR',
  R: 'R',
  N: 'N'
};

/**
 * 默认抽卡配置
 */
export const DEFAULT_GACHA_CONFIG: GachaConfig = {
  // 稀有度配置
  rarities: [
    {
      type: 'SSR',
      name: 'SSR',
      probability: 5, // 5%概率
      rank: 4 // 稀有度等级，数值越高稀有度越高
    },
    {
      type: 'SR',
      name: 'SR',
      probability: 15, // 15%概率
      rank: 3
    },
    {
      type: 'R',
      name: 'R',
      probability: 30, // 30%概率
      rank: 2
    },
    {
      type: 'N',
      name: 'N',
      probability: 50, // 50%概率
      rank: 1
    }
  ],
  
  // 保底配置
  pity: {
    threshold: 100,
    guaranteedRarity: 'SSR',
    rarityRankThreshold: 4 // 只有稀有度等级低于4的抽卡才会累积保底计数
  },
  
  // 角色池配置（示例数据）
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
};

/**
 * 抽卡配置管理器
 */
export class GachaConfigManager {
  private static instance: GachaConfigManager;
  private config: GachaConfig;
  
  private constructor() {
    this.config = DEFAULT_GACHA_CONFIG;
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): GachaConfigManager {
    if (!GachaConfigManager.instance) {
      GachaConfigManager.instance = new GachaConfigManager();
    }
    return GachaConfigManager.instance;
  }
  
  /**
   * 设置抽卡配置
   */
  public setConfig(config: Partial<GachaConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取抽卡配置
   */
  public getConfig(): GachaConfig {
    return this.config;
  }
  
  /**
   * 获取稀有度配置
   */
  public getRarityConfig() {
    return this.config.rarities;
  }
  
  /**
   * 获取保底配置
   */
  public getPityConfig() {
    return this.config.pity;
  }
  
  /**
   * 获取角色池配置
   */
  public getCharacterPool() {
    return this.config.characterPool;
  }
}
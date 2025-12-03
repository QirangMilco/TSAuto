/**
 * 抽卡服务
 * 实现抽卡核心逻辑，支持通过CONFIG配置稀有度种类、名称和抽取概率
 */

import { GachaConfigManager } from '../config/gacha';
import { RandomService } from './RandomService';
import { GachaHistory, GachaResult, Rarity } from '../types/definitions';

/**
 * 抽卡服务
 */
export class GachaService {
  private static instance: GachaService;
  private configManager: GachaConfigManager;
  private randomService: RandomService;
  private history: GachaHistory;
  
  private constructor() {
    this.configManager = GachaConfigManager.getInstance();
    this.randomService = RandomService.getInstance();
    this.history = {
      results: [],
      currentPulls: 0
    };
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): GachaService {
    if (!GachaService.instance) {
      GachaService.instance = new GachaService();
    }
    return GachaService.instance;
  }
  
  /**
   * 重置抽卡历史
   */
  public resetHistory(): void {
    this.history = {
      results: [],
      currentPulls: 0
    };
  }
  
  /**
   * 获取抽卡历史
   */
  public getHistory(): GachaHistory {
    return this.history;
  }
  
  /**
   * 单抽
   */
  public pull(): GachaResult {
    const config = this.configManager.getConfig();
    const isPity = this.checkPity();
    
    // 确定抽取的稀有度
    const rarity = isPity ? 
      config.pity!.guaranteedRarity : 
      this.rollRarity();
    
    // 从对应稀有度的角色池中随机选择一个角色
    const character = this.pickCharacterByRarity(rarity);
    
    // 创建抽卡结果
    const result: GachaResult = {
      characterId: character.characterId,
      characterName: this.getCharacterName(character.characterId),
      rarity: rarity,
      isPity: isPity
    };
    
    // 更新历史记录
    this.history.results.push(result);
    
    // 检查是否需要累积保底计数
    const shouldResetPity = this.shouldResetPity(rarity);
    
    if (isPity || shouldResetPity) {
      // 如果触发了保底或者抽中了高级稀有度，重置抽卡计数
      this.history.currentPulls = 0;
    } else {
      // 否则累积抽卡计数
      this.history.currentPulls++;
    }
    
    return result;
  }
  
  /**
   * 十连抽
   */
  public pullTen(): GachaResult[] {
    const results: GachaResult[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(this.pull());
    }
    return results;
  }
  
  /**
   * 检查是否触发保底
   */
  private checkPity(): boolean {
    const pityConfig = this.configManager.getConfig().pity;
    if (!pityConfig) return false;
    
    return this.history.currentPulls >= pityConfig.threshold - 1;
  }
  
  /**
   * 抽取稀有度
   */
  private rollRarity(): Rarity {
    const rarities = this.configManager.getConfig().rarities;
    
    // 使用权重随机选择稀有度
    const rarityTypes = rarities.map(r => r.type);
    const probabilities = rarities.map(r => r.probability);
    
    return this.randomService.weightedPick(rarityTypes, probabilities) || rarities[rarities.length - 1].type;
  }
  
  /**
   * 检查是否需要重置保底计数
   * 只有稀有度等级低于rarityRankThreshold的抽卡才会累积保底计数
   */
  private shouldResetPity(rarity: Rarity): boolean {
    const config = this.configManager.getConfig();
    const pityConfig = config.pity;
    if (!pityConfig) return false;
    
    // 获取当前稀有度的等级
    const currentRarityConfig = config.rarities.find(r => r.type === rarity);
    const currentRank = currentRarityConfig?.rank || 0;
    
    // 获取保底稀有度的等级，作为默认的rarityRankThreshold
    const guaranteedRarityConfig = config.rarities.find(r => r.type === pityConfig.guaranteedRarity);
    const guaranteedRank = guaranteedRarityConfig?.rank || 0;
    
    // 如果抽中了稀有度等级大于等于rarityRankThreshold的角色，重置保底计数
    // 只有稀有度等级低于rarityRankThreshold的抽卡才会累积保底计数
    const rarityRankThreshold = pityConfig.rarityRankThreshold || guaranteedRank;
    return currentRank >= rarityRankThreshold;
  }
  
  /**
   * 根据稀有度选择角色
   */
  private pickCharacterByRarity(rarity: Rarity): { characterId: string; rarity: Rarity } {
    const characterPool = this.configManager.getConfig().characterPool;
    const eligibleCharacters = characterPool.filter(char => char.rarity === rarity);
    
    if (eligibleCharacters.length === 0) {
      // 如果对应稀有度没有角色，返回第一个角色
      return characterPool[0];
    }
    
    return this.randomService.pick(eligibleCharacters) || characterPool[0];
  }
  
  /**
   * 获取角色名称（实际项目中应从角色服务获取）
   */
  private getCharacterName(characterId: string): string {
    // 这里简化处理，实际项目中应从角色服务或配置中获取
    return `角色${characterId.split('_')[1]}`;
  }
  
  /**
   * 获取当前抽卡概率分布
   */
  public getProbabilityDistribution() {
    const rarities = this.configManager.getConfig().rarities;
    const pityConfig = this.configManager.getConfig().pity;
    
    return {
      rarities: rarities.map(r => ({
        type: r.type,
        name: r.name,
        probability: r.probability,
        rank: r.rank
      })),
      currentPulls: this.history.currentPulls,
      pityThreshold: pityConfig?.threshold,
      guaranteedRarity: pityConfig?.guaranteedRarity,
      rarityRankThreshold: pityConfig?.rarityRankThreshold
    };
  }
}
/**
 * 随机数服务 (Seeded RNG)
 * 提供可复现的伪随机数生成，用于支持战斗回放、固定掉落等功能
 */
export class RandomService {
  private static instance: RandomService;
  private seed: number;

  private constructor() {
    // 默认使用时间戳，生产环境应由服务器下发或存档读取
    this.seed = Date.now();
  }

  public static getInstance(): RandomService {
    if (!RandomService.instance) {
      RandomService.instance = new RandomService();
    }
    return RandomService.instance;
  }

  /**
   * 设置随机种子
   */
  public setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * 获取当前种子 (用于存档/回放)
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * 生成下一个浮点数 [0, 1)
   * 算法: Mulberry32
   */
  public float(): number {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * 生成范围整数 [min, max]
   */
  public int(min: number, max: number): number {
    return Math.floor(this.float() * (max - min + 1)) + min;
  }

  /**
   * 生成范围浮点数 [min, max)
   */
  public floatRange(min: number, max: number): number {
    return this.float() * (max - min) + min;
  }

  /**
   * 从数组中随机选择一个元素
   */
  public pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.int(0, array.length - 1)];
  }

  /**
   * 权重随机
   * @param items 选项数组
   * @param weights 权重数组 (需与 items 一一对应)
   */
  public weightedPick<T>(items: T[], weights: number[]): T | undefined {
    if (items.length !== weights.length || items.length === 0) return undefined;

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.float() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) {
        return items[i];
      }
      random -= weights[i];
    }
    return items[items.length - 1];
  }
}
/**
 * 游戏资源配置文件 (SSOT - Single Source of Truth)
 * 集中管理游戏内使用的图片、音效等素材路径
 * 模组制作者可以通过替换此配置或注入新配置来修改游戏外观
 */

export interface AssetsConfig {
  // 背景图片
  backgrounds: {
    battle: string; // 战斗场景背景
    home: string;   // 主界面背景
    loading: string; // 加载界面背景
    fallbackGradient: string;
  };
  
  // 装饰元素
  decorations: {
    flowersClouds: string; // 花朵云朵装饰
    flower: string; // 花朵装饰
    bow: string; // 蝴蝶结装饰
    flame: string; // 火焰装饰
  };
  
  // 角色相关
  characters: {
    portrait: string; // 角色立绘
    avatar: string; // 角色头像
  };
  
  // 资源图标
  resources: {
    lowGrade: string; // 下品灵石
    middleGrade: string; // 中品灵石
    highGrade: string; // 上品灵石
  };
  
  // 功能按钮图标
  buttons: {
    settings: string; // 设置按钮
    wudao: string; // 悟道台按钮
    xianshen: string; // 仙神录按钮
    storage: string; // 储物袋按钮
    tianji: string; // 天机阁按钮
    trial: string; // 试炼按钮
    encyclopedia: string; // 图鉴按钮
    market: string; // 坊市按钮
    achievements: string; // 成就按钮
  };
  
  // 页面标题
  titles: {
    courtyard: string; // 宗门庭院标题
  };
  
  // UI 通用素材
  ui: {
    cardBack: string; // 卡牌/角色背面
    victoryIcon: string;
    defeatIcon: string;
  };
  
  // 音效 (示例)
  audio: {
    bgmBattle: string;
    sfxClick: string;
  };
}

/**
 * 默认资源配置
 */
export const DEFAULT_ASSETS: AssetsConfig = {
  backgrounds: {
    // 之前硬编码的路径移到这里
    battle: '/assets/bg_battle.jpg',
    home: '/assets/bg_home.jpg',
    loading: '/assets/bg_loading.jpg',
    fallbackGradient: 'linear-gradient(to bottom, #111827, #1f2937)' 
  },
  decorations: {
    flowersClouds: '/assets/images/decorations/flowers-clouds.png',
    flower: '/assets/images/decorations/flower.png',
    bow: '/assets/images/decorations/bow.png',
    flame: '/assets/images/decorations/flame.png'
  },
  characters: {
    portrait: '/assets/images/characters/portrait.png',
    avatar: '/src/assets/images/characters/201.jpg'
  },
  resources: {
    lowGrade: '/assets/images/resources/low-grade.png',
    middleGrade: '/assets/images/resources/middle-grade.png',
    highGrade: '/assets/images/resources/high-grade.png'
  },
  buttons: {
    settings: '/assets/images/icons/settings.png',
    wudao: '/assets/images/icons/wudao.png',
    xianshen: '/assets/images/icons/xianshen.png',
    storage: '/assets/images/icons/storage.png',
    tianji: '/assets/images/icons/tianji.png',
    trial: '/assets/images/icons/trial.png',
    encyclopedia: '/assets/images/icons/encyclopedia.png',
    market: '/assets/images/icons/market.png',
    achievements: '/assets/images/icons/achievements.png'
  },
  titles: {
    courtyard: '/assets/images/titles/courtyard.png'
  },
  ui: {
    cardBack: '/assets/ui/card_back.png',
    victoryIcon: '/assets/ui/victory.png',
    defeatIcon: '/assets/ui/defeat.png'
  },
  audio: {
    bgmBattle: '/assets/audio/battle_theme.mp3',
    sfxClick: '/assets/audio/click.wav'
  }
};

/**
 * 资源管理器
 */
export class AssetsManager {
  private static instance: AssetsManager;
  private currentAssets: AssetsConfig;

  private constructor() {
    this.currentAssets = DEFAULT_ASSETS;
  }

  public static getInstance(): AssetsManager {
    if (!AssetsManager.instance) {
      AssetsManager.instance = new AssetsManager();
    }
    return AssetsManager.instance;
  }

  public getAssets(): AssetsConfig {
    return this.currentAssets;
  }

  /**
   * 允许模组覆盖部分或全部资源配置
   */
  public setAssets(assets: Partial<AssetsConfig>): void {
    // 深度合并逻辑在实际项目中可能需要 Lodash.merge，这里做简单的浅层合并演示
    this.currentAssets = {
      ...this.currentAssets,
      ...assets,
      backgrounds: { ...this.currentAssets.backgrounds, ...assets.backgrounds },
      ui: { ...this.currentAssets.ui, ...assets.ui },
      audio: { ...this.currentAssets.audio, ...assets.audio }
    };
  }
}

// 导出便捷访问方法
export const getAssets = (): AssetsConfig => AssetsManager.getInstance().getAssets();
export const setAssets = (assets: Partial<AssetsConfig>): void => AssetsManager.getInstance().setAssets(assets);
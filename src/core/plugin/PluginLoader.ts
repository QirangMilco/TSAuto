import { PluginType, type PluginMetadata } from '../types/plugin';

interface PluginLoadResult {
  id: string;
  type: PluginType;
  content: any;
  metadata: PluginMetadata;
}

/**
 * 插件加载器
 * 负责动态加载各类插件模块
 * 使用Vite的import.meta.glob实现真实的插件加载
 */
export class PluginLoader {
  
  /**
   * 按类型加载所有插件
   * 使用Vite的import.meta.glob实现真实的插件加载
   */
  public async loadPluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      // 根据类型确定路径模式
      const pathPattern = this.getTypePathPattern(type);
      
      // 使用Vite的import.meta.glob加载所有匹配的插件文件
      const modules = import.meta.glob('/plugins/**/*.ts', { eager: true });
      
      // 遍历所有模块
      for (const [path, module] of Object.entries(modules)) {
        // 根据路径过滤特定类型的插件
        if (this.matchesPluginType(path, type)) {
          try {
            const result = await this.processPluginModule(path, module, type);
            if (result) {
              results.push(result);
            }
          } catch (error) {
            console.error(`Failed to process plugin: ${path}`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load plugins of type ${type}`, error);
    }
    
    return results;
  }
  
  /**
   * 加载单个插件
   */
  public async loadPlugin(path: string): Promise<PluginLoadResult | null> {
    try {
      // 确定插件类型
      const type = this.determinePluginType(path);
      
      // 使用Vite的import.meta.glob加载单个插件
      try {
        // 添加 @vite-ignore 注释并使用正确的相对路径
        const module = await import(/* @vite-ignore */ `../../../../plugins/${path}`);
        return await this.processPluginModule(path, module, type);
      } catch (importError) {
        console.error(`Failed to import plugin: /plugins/${path}`, importError);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${path}`, error);
      return null;
    }
  }
  
  /**
   * 处理插件模块
   */
  private async processPluginModule(
    path: string,
    module: any,
    type: PluginType
  ): Promise<PluginLoadResult | null> {
    try {
      // 获取插件内容（默认导出或模块本身）
      const content = module.default || module;
      
      // 验证插件内容
      if (!content || typeof content !== 'object') {
        console.warn(`Invalid plugin content at ${path}`);
        return null;
      }
      
      // 确保插件有ID
      const id = content.id || this.extractIdFromPath(path);
      
      // 获取元数据
      const metadataModule = module as { metadata?: PluginMetadata };
      const moduleMetadata = metadataModule.metadata || {};
      
      const metadata: PluginMetadata = {
        id,
        type,
        path,
        version: moduleMetadata.version || '1.0.0',
        author: moduleMetadata.author || 'Unknown',
        description: moduleMetadata.description || '',
        loadTime: Date.now()
      };
      
      return {
        id,
        type,
        content,
        metadata
      };
    } catch (error) {
      console.error(`Error processing plugin module: ${path}`, error);
      return null;
    }
  }
  
  /**
   * 根据类型获取路径模式
   */
  private getTypePathPattern(type: PluginType): string {
    switch (type) {
      case PluginType.CHARACTER:
        return '/plugins/characters/*.ts';
      case PluginType.SKILL:
        return '/plugins/skills/*.ts';
      case PluginType.EQUIPMENT:
        return '/plugins/equipment/*.ts';
      case PluginType.STATUS:
        return '/plugins/statuses/*.ts';
      default:
        return '/plugins/**/*.ts';
    }
  }
  
  /**
   * 检查路径是否匹配指定的插件类型
   */
  private matchesPluginType(path: string, type: PluginType): boolean {
    switch (type) {
      case PluginType.CHARACTER:
        return path.includes('/characters/') || path.includes('character_');
      case PluginType.SKILL:
        return path.includes('/skills/') || path.includes('skill_');
      case PluginType.EQUIPMENT:
        return path.includes('/equipment/') || path.includes('equip_');
      case PluginType.STATUS:
        return path.includes('/statuses/') || path.includes('status_');
      default:
        return true;
    }
  }
  
  /**
   * 从路径中提取插件ID
   */
  private extractIdFromPath(path: string): string {
    // 从路径中提取文件名（不含扩展名）作为ID
    const fileName = path.split('/').pop() || 'unknown';
    return fileName.replace(/\.ts$/, '');
  }
  
  /**
   * 确定插件类型
   */
  private determinePluginType(path: string): PluginType {
    if (path.includes('/characters/') || path.includes('character_')) {
      return PluginType.CHARACTER;
    } else if (path.includes('/skills/') || path.includes('skill_')) {
      return PluginType.SKILL;
    } else if (path.includes('/equipment/') || path.includes('equip_')) {
      return PluginType.EQUIPMENT;
    } else if (path.includes('/statuses/') || path.includes('status_')) {
      return PluginType.STATUS;
    }
    return PluginType.UNKNOWN;
  }
  
  /**
   * 加载所有插件类型
   */
  public async loadAllPlugins(): Promise<Record<PluginType, PluginLoadResult[]>> {
    const results: Record<PluginType, PluginLoadResult[]> = {
      [PluginType.CHARACTER]: [],
      [PluginType.SKILL]: [],
      [PluginType.EQUIPMENT]: [],
      [PluginType.STATUS]: [],
      [PluginType.UNKNOWN]: []
    };
    
    // 加载每种类型的插件
    for (const type of Object.values(PluginType)) {
      if (type !== PluginType.UNKNOWN) {
        results[type] = await this.loadPluginsByType(type);
      }
    }
    
    return results;
  }
}
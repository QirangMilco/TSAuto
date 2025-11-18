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
 */
export class PluginLoader {
  private readonly PLUGIN_DIRS: Record<PluginType, string> = {
    [PluginType.CHARACTER]: '/plugins/characters',
    [PluginType.SKILL]: '/plugins/skills',
    [PluginType.EQUIPMENT]: '/plugins/equipment',
    [PluginType.STATUS]: '/plugins/statuses',
    [PluginType.UNKNOWN]: '/plugins'
  };
  
  /**
   * 按类型加载所有插件
   */
  public async loadPluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const pluginDir = this.PLUGIN_DIRS[type];
    const results: PluginLoadResult[] = [];
    
    try {
      // 这里使用动态导入来加载插件
      // 在浏览器环境中，我们需要使用不同的策略
      // 这里提供一个基础实现，实际使用时可能需要调整
      
      // 假设我们有一个插件清单文件
      const pluginFiles = await this.getPluginFiles(pluginDir);
      
      for (const file of pluginFiles) {
        try {
          const result = await this.loadPluginFromFile(file, type);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`Failed to load plugin: ${file}`, error);
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
      
      // 加载插件文件
      return await this.loadPluginFromFile(path, type);
    } catch (error) {
      console.error(`Failed to load plugin: ${path}`, error);
      return null;
    }
  }
  
  /**
   * 从文件加载插件
   */
  private async loadPluginFromFile(filePath: string, type: PluginType): Promise<PluginLoadResult | null> {
    try {
      // 在Node.js环境中
      // const module = await import(filePath);
      // const content = module.default || module;
      
      // 在浏览器环境中，我们使用不同的策略
      // 这里提供一个模拟实现
      
      // 模拟从文件加载插件内容
      const content = await this.simulatePluginLoad(filePath);
      
      if (!content || !content.id) {
        return null;
      }
      
      const metadata: PluginMetadata = {
        id: content.id,
        type,
        path: filePath,
        version: content.version || '1.0.0',
        author: content.author || 'Unknown',
        loadTime: Date.now()
      };
      
      return {
        id: content.id,
        type,
        content,
        metadata
      };
    } catch (error) {
      console.error(`Error loading plugin from file: ${filePath}`, error);
      return null;
    }
  }
  
  /**
   * 模拟插件加载（用于浏览器环境）
   */
  private async simulatePluginLoad(filePath: string): Promise<any> {
    // 在实际应用中，这里应该是真实的加载逻辑
    // 现在返回一个模拟的空对象
    return { id: filePath.split('/').pop()?.replace('.js', '') };
  }
  
  /**
   * 获取插件文件列表
   */
  private async getPluginFiles(dir: string): Promise<string[]> {
    // 模拟获取文件列表
    // 实际应用中需要根据环境实现
    return [];
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
}
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
 * 支持多种加载方式：
 * 1. 开发环境：使用Vite的import.meta.glob实现动态加载
 * 2. 生产环境：支持静态加载和资源目录加载
 */
export class PluginLoader {
  // 静态插件映射，用于构建时打包的插件
  private staticPlugins: Record<string, any> = {};
  
  // 加载模式
  private loadMode: 'dynamic' | 'static' | 'resource' = 'dynamic';
  
  // 资源基础路径
  private resourceBasePath: string = '';
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options?: {
    mode?: 'dynamic' | 'static' | 'resource';
    staticPlugins?: Record<string, any>;
    resourceBasePath?: string;
  }) {
    if (options) {
      this.loadMode = options.mode || 'dynamic';
      this.staticPlugins = options.staticPlugins || {};
      this.resourceBasePath = options.resourceBasePath || '';
    }
  }
  
  /**
   * 按类型加载所有插件
   */
  public async loadPluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      switch (this.loadMode) {
        case 'static':
          // 静态加载模式：使用预定义的插件映射
          results.push(...await this.loadStaticPluginsByType(type));
          break;
        case 'resource':
          // 资源目录加载模式：从资源目录读取插件
          results.push(...await this.loadResourcePluginsByType(type));
          break;
        case 'dynamic':
        default:
          // 动态加载模式：使用Vite的import.meta.glob
          results.push(...await this.loadDynamicPluginsByType(type));
          break;
      }
    } catch (error) {
      console.error(`Failed to load plugins of type ${type}`, error);
    }
    
    return results;
  }
  
  /**
   * 动态加载模式：按类型加载所有插件
   */
  private async loadDynamicPluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      // 使用Vite的import.meta.glob加载所有匹配的插件文件
      // @ts-ignore - import.meta.glob is a Vite-specific feature
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
      console.error(`Failed to load dynamic plugins of type ${type}`, error);
    }
    
    return results;
  }
  
  /**
   * 静态加载模式：按类型加载所有插件
   */
  private async loadStaticPluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      // 遍历所有静态插件
      for (const [path, module] of Object.entries(this.staticPlugins)) {
        if (this.matchesPluginType(path, type)) {
          try {
            const result = await this.processPluginModule(path, module, type);
            if (result) {
              results.push(result);
            }
          } catch (error) {
            console.error(`Failed to process static plugin: ${path}`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load static plugins of type ${type}`, error);
    }
    
    return results;
  }
  
  /**
   * 资源目录加载模式：按类型加载所有插件
   */
  private async loadResourcePluginsByType(type: PluginType): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      // 这里需要根据实际平台实现资源目录读取
      // 不同平台的资源加载方式不同，需要根据实际情况调整
      console.warn('Resource loading mode is not fully implemented yet');
    } catch (error) {
      console.error(`Failed to load resource plugins of type ${type}`, error);
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
      
      switch (this.loadMode) {
        case 'static':
          // 静态加载模式
          return await this.loadStaticPlugin(path, type);
        case 'resource':
          // 资源目录加载模式
          return await this.loadResourcePlugin(path, type);
        case 'dynamic':
        default:
          // 动态加载模式
          return await this.loadDynamicPlugin(path, type);
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${path}`, error);
      return null;
    }
  }
  
  /**
   * 动态加载单个插件
   */
  private async loadDynamicPlugin(path: string, type: PluginType): Promise<PluginLoadResult | null> {
    try {
      // 添加 @vite-ignore 注释并使用正确的相对路径
      const module = await import(/* @vite-ignore */ `../../../../plugins/${path}`);
      return await this.processPluginModule(path, module, type);
    } catch (importError) {
      console.error(`Failed to import dynamic plugin: /plugins/${path}`, importError);
      return null;
    }
  }
  
  /**
   * 静态加载单个插件
   */
  private async loadStaticPlugin(path: string, type: PluginType): Promise<PluginLoadResult | null> {
    try {
      const fullPath = `/plugins/${path}`;
      const module = this.staticPlugins[fullPath];
      
      if (!module) {
        console.error(`Static plugin not found: ${fullPath}`);
        return null;
      }
      
      return await this.processPluginModule(fullPath, module, type);
    } catch (error) {
      console.error(`Failed to load static plugin: ${path}`, error);
      return null;
    }
  }
  
  /**
   * 资源目录加载单个插件
   */
  private async loadResourcePlugin(path: string, type: PluginType): Promise<PluginLoadResult | null> {
    try {
      // 这里需要根据实际平台实现资源文件读取
      // 例如在Web环境下使用fetch，在原生环境下使用平台特定的文件API
      const fullPath = `${this.resourceBasePath}/plugins/${path}`;
      
      // Web环境下的实现示例
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const response = await fetch(fullPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch plugin: ${fullPath}`);
        }
        
        // 对于JavaScript文件，可以使用eval或动态创建script标签
        // 这里简化处理，假设返回的是JSON格式的插件定义
        const content = await response.json();
        
        const metadata: PluginMetadata = {
          id: content.id || this.extractIdFromPath(path),
          type,
          path,
          version: content.metadata?.version || '1.0.0',
          author: content.metadata?.author || 'Unknown',
          loadTime: Date.now()
        };
        
        return {
          id: metadata.id,
          type,
          content,
          metadata
        };
      } else {
        console.error('Resource loading is not supported in this environment');
        return null;
      }
    } catch (error) {
      console.error(`Failed to load resource plugin: ${path}`, error);
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
      const metadataModule = module as { metadata?: { version?: string; author?: string } };
      const moduleMetadata = metadataModule.metadata || {};
      
      const metadata: PluginMetadata = {
        id,
        type,
        path,
        version: moduleMetadata.version || '1.0.0',
        author: moduleMetadata.author || 'Unknown',
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
      case PluginType.EQUIPMENT_SET:
        return path.includes('/equipment-sets/') || path.includes('set_');
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
    } else if (path.includes('/equipment-sets/') || path.includes('set_')) {
      return PluginType.EQUIPMENT_SET;
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
      [PluginType.EQUIPMENT_SET]: [],
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
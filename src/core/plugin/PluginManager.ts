import type { PluginMetadata, GameDataInterface } from '../types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition, EquipmentSetDefinition } from '../types/definitions';
import { PluginType } from '../types/plugin';
import { PluginLoader } from './PluginLoader';
import { PluginValidator } from './PluginValidator';

/**
 * 插件管理器配置选项
 */
export interface PluginManagerOptions {
  /**
   * 插件加载模式
   * - dynamic: 动态加载（开发环境）
   * - static: 静态加载（生产环境，使用预定义插件）
   * - resource: 资源目录加载（生产环境，从资源目录读取）
   */
  mode?: 'dynamic' | 'static' | 'resource';
  
  /**
   * 静态插件映射，用于static模式
   */
  staticPlugins?: Record<string, any>;
  
  /**
   * 资源基础路径，用于resource模式
   */
  resourceBasePath?: string;
}

/**
 * 插件管理器
 * 负责插件系统的整体管理和协调
 */
export class PluginManager implements GameDataInterface {
  private pluginLoader: PluginLoader;
  private pluginValidator: PluginValidator;
  private pluginRegistry: Map<string, any> = new Map(); // 插件ID -> 插件内容
  private metadataRegistry: Map<string, PluginMetadata> = new Map(); // 插件ID -> 元数据
  
  // 分类存储的插件
  private characters: Map<string, CharacterDefinition> = new Map();
  private skills: Map<string, SkillDefinition> = new Map();
  private equipment: Map<string, EquipmentDefinition> = new Map();
  private statuses: Map<string, StatusDefinition> = new Map();
  private equipmentSets: Map<string, EquipmentSetDefinition> = new Map();
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options?: PluginManagerOptions) {
    this.pluginLoader = new PluginLoader({
      mode: options?.mode,
      staticPlugins: options?.staticPlugins,
      resourceBasePath: options?.resourceBasePath
    });
    this.pluginValidator = new PluginValidator();
  }
  
  /**
   * 初始化插件系统
   */
  public async initialize(): Promise<void> {
    // 加载所有插件
    await this.loadAllPlugins();
  }

  /**
   * 手动注册插件 (用于测试或动态生成)
   */
  public registerPlugin(pluginOrId: string | { type: PluginType, definition: any }, type?: PluginType, content?: any): void {
    let id: string;
    let pType: PluginType;
    let pContent: any;

    // 处理重载: registerPlugin(pluginWrapper)
    if (typeof pluginOrId === 'object') {
      pContent = pluginOrId.definition;
      pType = pluginOrId.type;
      id = pContent.id;
    } 
    // 处理重载: registerPlugin(id, type, content)
    else {
      id = pluginOrId;
      pType = type!;
      pContent = content;
    }

    if (!id || !pType || !pContent) {
      console.warn('Register plugin failed: Invalid arguments');
      return;
    }

    // 注册到通用注册表
    this.pluginRegistry.set(id, pContent);
    
    // 创建基础元数据
    const metadata: PluginMetadata = {
      id,
      type: pType,
      path: 'manual_registration',
      version: '1.0.0',
      author: 'System',
      loadTime: Date.now()
    };
    this.metadataRegistry.set(id, metadata);

    // 分类注册
    this.registerPluginByType(id, pType, pContent);
  }
  
  /**
   * 加载所有插件
   */
  private async loadAllPlugins(): Promise<void> {
    const pluginTypes = [
      PluginType.CHARACTER, 
      PluginType.SKILL, 
      PluginType.EQUIPMENT, 
      PluginType.STATUS, 
      PluginType.EQUIPMENT_SET
    ];
    
    for (const type of pluginTypes) {
      const plugins = await this.pluginLoader.loadPluginsByType(type);
      
      for (const { id, content, metadata } of plugins) {
        // 验证插件
        if (!this.pluginValidator.validatePlugin(id, type, content)) {
          console.warn(`Invalid plugin: ${id}`);
          continue;
        }
        
        // 注册插件
        this.pluginRegistry.set(id, content);
        this.metadataRegistry.set(id, metadata);
        
        // 分类存储
        this.registerPluginByType(id, type, content);
      }
    }
  }
  
  /**
   * 根据类型注册插件
   */
  private registerPluginByType(id: string, type: PluginType, content: any): void {
    switch (type) {
      case PluginType.CHARACTER:
        this.characters.set(id, content);
        break;
      case PluginType.SKILL:
        this.skills.set(id, content);
        break;
      case PluginType.EQUIPMENT:
        this.equipment.set(id, content);
        break;
      case PluginType.STATUS:
        this.statuses.set(id, content);
        break;
      case PluginType.EQUIPMENT_SET:
        this.equipmentSets.set(id, content);
        break;
    }
  }

  /**
   * 卸载所有插件 (用于测试清理)
   */
  public unloadAllPlugins(): void {
    this.pluginRegistry.clear();
    this.metadataRegistry.clear();
    this.characters.clear();
    this.skills.clear();
    this.equipment.clear();
    this.statuses.clear();
    this.equipmentSets.clear();
  }
  
  /**
   * 动态加载单个插件
   * @param path 插件路径
   * @param pluginData 可选的插件数据，用于直接提供插件内容
   */
  public async loadPlugin(path: string, pluginData?: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      let plugin;
      
      if (pluginData) {
        // 直接使用提供的插件数据
        const type = this.determinePluginType(path);
        const id = pluginData.id || this.extractIdFromPath(path);
        
        const metadata = {
          id,
          type,
          path,
          version: pluginData.metadata?.version || '1.0.0',
          author: pluginData.metadata?.author || 'Unknown',
          loadTime: Date.now()
        };
        
        plugin = { id, type, content: pluginData, metadata };
      } else {
        // 通过路径加载插件
        plugin = await this.pluginLoader.loadPlugin(path);
      }
      
      if (!plugin) {
        return { success: false, error: 'Failed to load plugin' };
      }
      
      const { id, type, content, metadata } = plugin;
      
      // 验证插件
      if (!this.pluginValidator.validatePlugin(id, type, content)) {
        return { success: false, error: 'Invalid plugin format' };
      }
      
      // 注册插件
      this.pluginRegistry.set(id, content);
      this.metadataRegistry.set(id, metadata);
      this.registerPluginByType(id, type, content);
      
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * 批量导入插件
   * @param pluginPaths 插件路径列表
   */
  public async importPlugins(pluginPaths: string[]): Promise<{
    success: boolean;
    imported: string[];
    failed: { path: string; error: string }[];
    total: number;
  }> {
    const imported: string[] = [];
    const failed: { path: string; error: string }[] = [];
    const total = pluginPaths.length;
    
    for (const path of pluginPaths) {
      const result = await this.loadPlugin(path);
      if (result.success && result.id) {
        imported.push(result.id);
      } else {
        failed.push({ path, error: result.error || 'Unknown error' });
      }
    }
    
    return {
      success: failed.length === 0,
      imported,
      failed,
      total
    };
  }
  
  /**
   * 从数据导入单个插件
   * @param pluginData 插件数据对象
   * @param type 插件类型
   * @param customId 可选的自定义插件ID
   */
  public async importPluginFromData(
    pluginData: any,
    type: PluginType,
    customId?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // 验证插件数据
      if (!pluginData || typeof pluginData !== 'object') {
        return { success: false, error: 'Invalid plugin data' };
      }
      
      // 生成插件ID
      const id = customId || pluginData.id || `plugin_${Date.now()}`;
      
      // 创建插件元数据
      const metadata: PluginMetadata = {
        id,
        type,
        path: `dynamic_${id}`,
        version: pluginData.metadata?.version || '1.0.0',
        author: pluginData.metadata?.author || 'Unknown',
        loadTime: Date.now()
      };
      
      // 验证插件
      if (!this.pluginValidator.validatePlugin(id, type, pluginData)) {
        return { success: false, error: 'Invalid plugin format' };
      }
      
      // 注册插件
      this.pluginRegistry.set(id, pluginData);
      this.metadataRegistry.set(id, metadata);
      this.registerPluginByType(id, type, pluginData);
      
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * 批量从数据导入插件
   * @param pluginsData 插件数据数组
   */
  public async importPluginsFromData(
    pluginsData: { data: any; type: PluginType; id?: string }[]
  ): Promise<{
    success: boolean;
    imported: string[];
    failed: { index: number; error: string }[];
    total: number;
  }> {
    const imported: string[] = [];
    const failed: { index: number; error: string }[] = [];
    const total = pluginsData.length;
    
    for (let i = 0; i < pluginsData.length; i++) {
      const { data, type, id: customId } = pluginsData[i];
      const result = await this.importPluginFromData(data, type, customId);
      
      if (result.success && result.id) {
        imported.push(result.id);
      } else {
        failed.push({ index: i, error: result.error || 'Unknown error' });
      }
    }
    
    return {
      success: failed.length === 0,
      imported,
      failed,
      total
    };
  }
  
  /**
   * 获取已加载的插件统计信息
   */
  public getPluginStats(): {
    total: number;
    byType: Record<PluginType, number>;
    enabled: number;
  } {
    const stats = {
      total: this.metadataRegistry.size,
      byType: {
        [PluginType.CHARACTER]: 0,
        [PluginType.SKILL]: 0,
        [PluginType.EQUIPMENT]: 0,
        [PluginType.STATUS]: 0,
        [PluginType.EQUIPMENT_SET]: 0,
        [PluginType.UNKNOWN]: 0
      },
      enabled: this.metadataRegistry.size // 目前所有加载的插件都是启用状态
    };
    
    // 统计各类型插件数量
    for (const metadata of this.metadataRegistry.values()) {
      stats.byType[metadata.type]++;
    }
    
    return stats;
  }
  
  /**
   * 从路径中提取插件ID（内部辅助方法）
   */
  private extractIdFromPath(path: string): string {
    const fileName = path.split('/').pop() || 'unknown';
    return fileName.replace(/\.(ts|js|json)$/, '');
  }
  
  /**
   * 确定插件类型（内部辅助方法）
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
   * 卸载插件
   */
  public unloadPlugin(id: string): boolean {
    const metadata = this.metadataRegistry.get(id);
    // 如果没有元数据但有内容，尝试从所有表中移除
    if (!metadata && !this.pluginRegistry.has(id)) return false;
    
    // 从所有注册表中移除
    this.pluginRegistry.delete(id);
    this.metadataRegistry.delete(id);
    
    // 尝试从所有分类表中移除 (如果知道类型更好，不知道就全试一遍)
    if (metadata) {
        switch (metadata.type) {
        case PluginType.CHARACTER:
            this.characters.delete(id);
            break;
        case PluginType.SKILL:
            this.skills.delete(id);
            break;
        case PluginType.EQUIPMENT:
            this.equipment.delete(id);
            break;
        case PluginType.STATUS:
            this.statuses.delete(id);
            break;
        case PluginType.EQUIPMENT_SET:
            this.equipmentSets.delete(id);
            break;
        }
    } else {
        this.characters.delete(id);
        this.skills.delete(id);
        this.equipment.delete(id);
        this.statuses.delete(id);
        this.equipmentSets.delete(id);
    }
    
    return true;
  }
  
  /**
   * 获取插件元数据
   */
  public getPluginMetadata(id: string): PluginMetadata | undefined {
    return this.metadataRegistry.get(id);
  }
  
  /**
   * 获取所有已加载的插件
   */
  public getAllPlugins(): PluginMetadata[] {
    return Array.from(this.metadataRegistry.values());
  }
  
  // ===== GameDataInterface 实现 =====
  
  /**
   * 获取角色定义
   */
  public getCharacter(id: string): CharacterDefinition | undefined {
    return this.characters.get(id);
  }
  
  /**
   * 获取所有角色定义
   */
  public getAllCharacters(): CharacterDefinition[] {
    return Array.from(this.characters.values());
  }
  
  /**
   * 获取技能定义
   */
  public getSkill(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }
  
  /**
   * 获取所有技能定义
   */
  public getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * 获取装备定义
   */
  public getEquipment(id: string): EquipmentDefinition | undefined {
    return this.equipment.get(id);
  }
  
  /**
   * 获取所有装备定义
   */
  public getAllEquipment(): EquipmentDefinition[] {
    return Array.from(this.equipment.values());
  }
  
  /**
   * 获取状态定义
   */
  public getStatus(id: string): StatusDefinition | undefined {
    return this.statuses.get(id);
  }
  
  /**
   * 获取所有状态定义
   */
  public getAllStatuses(): StatusDefinition[] {
    return Array.from(this.statuses.values());
  }

  public getEquipmentSet(id: string): EquipmentSetDefinition | undefined { return this.equipmentSets.get(id); }
  public getAllEquipmentSets(): EquipmentSetDefinition[] { return Array.from(this.equipmentSets.values()); }
}
import type { PluginMetadata, GameDataInterface } from '../types/plugin';
import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition, EquipmentSetDefinition } from '../types/definitions';
import { PluginType } from '../types/plugin';
import { PluginLoader } from './PluginLoader';
import { PluginValidator } from './PluginValidator';

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
  
  constructor() {
    this.pluginLoader = new PluginLoader();
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
   */
  public async loadPlugin(path: string): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const plugin = await this.pluginLoader.loadPlugin(path);
      
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
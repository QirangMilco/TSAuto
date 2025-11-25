import type { CharacterDefinition, SkillDefinition, EquipmentDefinition, StatusDefinition, EquipmentSetDefinition } from './definitions';

/**
 * 插件类型 (修改为 Enum)
 */
export enum PluginType {
  CHARACTER = 'CHARACTER',
  SKILL = 'SKILL',
  EQUIPMENT = 'EQUIPMENT',
  STATUS = 'STATUS',
  EQUIPMENT_SET = 'EQUIPMENT_SET',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  type: PluginType;
  path: string;
  version: string;
  author: string;
  loadTime: number;
}

/**
 * 游戏数据访问接口
 */
export interface GameDataInterface {
  // 角色相关
  getCharacter(id: string): CharacterDefinition | undefined;
  getAllCharacters(): CharacterDefinition[];
  
  // 技能相关
  getSkill(id: string): SkillDefinition | undefined;
  getAllSkills(): SkillDefinition[];
  
  // 装备相关
  getEquipment(id: string): EquipmentDefinition | undefined;
  getAllEquipment(): EquipmentDefinition[];
  
  // 状态相关
  getStatus(id: string): StatusDefinition | undefined;
  getAllStatuses(): StatusDefinition[];

  // 套装查询接口
  getEquipmentSet(id: string): EquipmentSetDefinition | undefined;
  getAllEquipmentSets(): EquipmentSetDefinition[];
  
  // 初始化
  initialize(): Promise<void>;
}
import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../../../src/core/plugin/PluginManager';
import { PluginLoader } from '../../../src/core/plugin/PluginLoader';

/**
 * 插件加载测试
 * 测试真实插件文件的加载功能
 */
describe('Plugin Loading Integration Test', () => {
  let pluginManager: PluginManager;
  let pluginLoader: PluginLoader;
  
  beforeEach(() => {
    pluginManager = new PluginManager();
    pluginLoader = new PluginLoader();
  });
  
  it('should initialize plugin system and load real plugins', async () => {
    // 初始化插件系统（这会加载所有真实插件）
    await pluginManager.initialize();
    
    // 获取所有已加载的插件
    const allPlugins = pluginManager.getAllPlugins();
    
    // 应该至少加载了一些插件
    expect(allPlugins.length).toBeGreaterThan(0);
    
    console.log(`\n=== 加载的插件列表 ===`);
    allPlugins.forEach(plugin => {
      console.log(`- ${plugin.id} (${plugin.type}) - ${plugin.path}`);
    });
    console.log(`======================\n`);
  });
  
  it('should load character plugins from files', async () => {
    await pluginManager.initialize();
    
    // 获取所有角色插件
    const characters = pluginManager.getAllCharacters();
    
    // 应该至少有一个角色插件
    expect(characters.length).toBeGreaterThan(0);
    
    // 检查是否加载了特定的角色插件
    const windCharacter = pluginManager.getCharacter('CHAR_1001');
    expect(windCharacter).toBeDefined();
    expect(windCharacter?.name).toBe('风语者 艾琳');
    expect(windCharacter?.skills).toEqual(['SKILL_1001', 'SKILL_1002', 'SKILL_1003']);
    
    console.log(`\n=== 加载的角色插件 ===`);
    characters.forEach(char => {
      console.log(`- ${char.id}: ${char.name} (技能: ${char.skills.join(', ')})`);
    });
    console.log(`======================\n`);
  });
  
  it('should load skill plugins from files', async () => {
    await pluginManager.initialize();
    
    // 获取所有技能插件
    const skills = pluginManager.getAllSkills();
    
    // 应该至少有一个技能插件
    expect(skills.length).toBeGreaterThan(0);
    
    console.log(`\n=== 加载的技能插件 ===`);
    skills.forEach(skill => {
      console.log(`- ${skill.id}: ${skill.name}`);
    });
    console.log(`======================\n`);
  });
  
  it('should load equipment plugins from files', async () => {
    await pluginManager.initialize();
    
    // 获取所有装备插件
    const equipment = pluginManager.getAllEquipment();
    
    // 应该至少有一个装备插件
    expect(equipment.length).toBeGreaterThan(0);
    
    console.log(`\n=== 加载的装备插件 ===`);
    equipment.forEach(equip => {
      console.log(`- ${equip.id}: ${equip.name} (套装: ${equip.setId})`);
    });
    console.log(`======================\n`);
  });
  
  it('should load status plugins from files', async () => {
    await pluginManager.initialize();
    
    // 获取所有状态插件
    const statuses = pluginManager.getAllStatuses();
    
    // 应该至少有一个状态插件
    expect(statuses.length).toBeGreaterThan(0);
    
    console.log(`\n=== 加载的状态插件 ===`);
    statuses.forEach(status => {
      console.log(`- ${status.id}: ${status.name} (类型: ${status.type})`);
    });
    console.log(`======================\n`);
  });
  
  it('should load all plugin types correctly', async () => {
    await pluginManager.initialize();
    
    // 验证各种类型的插件都能被加载
    const characters = pluginManager.getAllCharacters();
    const skills = pluginManager.getAllSkills();
    const equipment = pluginManager.getAllEquipment();
    const statuses = pluginManager.getAllStatuses();
    
    // 打印统计信息
    console.log(`\n=== 插件加载统计 ===`);
    console.log(`角色插件: ${characters.length} 个`);
    console.log(`技能插件: ${skills.length} 个`);
    console.log(`装备插件: ${equipment.length} 个`);
    console.log(`状态插件: ${statuses.length} 个`);
    console.log(`总插件数: ${characters.length + skills.length + equipment.length + statuses.length} 个`);
    console.log(`======================\n`);
    
    // 至少有一种类型的插件被加载
    expect(characters.length + skills.length + equipment.length + statuses.length).toBeGreaterThan(0);
  });
});

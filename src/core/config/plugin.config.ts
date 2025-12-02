/**
 * 插件配置文件
 * 用于定义插件列表和加载配置
 */

import { PluginType } from '../types/plugin';

/**
 * 插件配置项
 */
export interface PluginConfigItem {
  /**
   * 插件ID
   */
  id: string;
  
  /**
   * 插件类型
   */
  type: PluginType;
  
  /**
   * 插件路径
   */
  path: string;
  
  /**
   * 是否启用该插件
   */
  enabled?: boolean;
  
  /**
   * 插件版本
   */
  version?: string;
  
  /**
   * 插件作者
   */
  author?: string;
}

/**
 * 插件系统配置
 */
export interface PluginSystemConfig {
  /**
   * 插件加载模式
   */
  mode: 'dynamic' | 'static' | 'resource';
  
  /**
   * 资源基础路径
   */
  resourceBasePath?: string;
  
  /**
   * 插件列表
   */
  plugins: PluginConfigItem[];
}

/**
 * 默认插件配置
 * 开发环境下使用动态加载模式
 */
export const defaultPluginConfig: PluginSystemConfig = {
  mode: 'dynamic',
  plugins: []
};

/**
 * 静态插件导入映射
 * 用于生产环境下的静态加载模式
 * 注意：这个映射会在构建时被填充
 */
export const staticPluginImports: Record<string, any> = {
  // 构建时自动生成的插件导入映射
  // 格式：'/plugins/[path]': () => import('/plugins/[path]')
};

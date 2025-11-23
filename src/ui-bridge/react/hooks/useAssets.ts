import { useMemo } from 'react';
import { getAssets, AssetsConfig } from '../../../core/config/assets';

/**
 * 获取当前资源配置的 Hook
 */
export const useAssets = (): AssetsConfig => {
  // 在实际生产中，如果支持运行时切换模组，
  // 这里可能需要订阅 AssetsManager 的变化事件
  // 目前阶段使用 useMemo 获取静态配置即可
  const assets = useMemo(() => getAssets(), []);
  return assets;
};
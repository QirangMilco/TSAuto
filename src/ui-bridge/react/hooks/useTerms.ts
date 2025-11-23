import { useMemo } from 'react';
import { getTerms, getTerm, TermsConfig } from '../../../core/config/terms';

/**
 * React Hook for accessing game terms
 * 提供术语管理功能的React Hook
 */
export const useTerms = (): TermsConfig => {
  // 使用useMemo缓存术语配置，避免不必要的重新渲染
  const terms = useMemo(() => getTerms(), []);
  return terms;
};

/**
 * React Hook for accessing specific game term
 * 获取特定术语的React Hook
 */
export const useTerm = (path: string): string | undefined => {
  const term = useMemo(() => getTerm(path), [path]);
  return term;
};

/**
 * 获取主要资源名称的便捷Hook
 * 用于UI中显示主要资源（如"能量"）
 */
export const usePrimaryResourceName = (): string => {
  const name = useMemo(() => getTerm('resources.primary') || '资源', []);
  return name;
};
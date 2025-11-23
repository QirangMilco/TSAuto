import React from 'react';
import { useTerms, usePrimaryResourceName } from '../../ui-bridge/react/hooks/useTerms';

/**
 * 术语展示组件
 * 展示如何在UI中使用术语管理系统
 */
export const TermsDisplay: React.FC = () => {
  const terms = useTerms();
  const primaryResourceName = usePrimaryResourceName();

  return (
    <div className="terms-display">
      <h3>术语管理示例</h3>
      <div className="term-item">
        <strong>主要资源名称:</strong> {primaryResourceName}
      </div>
      <div className="term-item">
        <strong>装备系统名称:</strong> {terms.systems.equipment}
      </div>
      <div className="term-item">
        <strong>角色系统名称:</strong> {terms.systems.character}
      </div>
      <div className="term-item">
        <strong>技能系统名称:</strong> {terms.systems.skill}
      </div>
      <div className="term-item">
        <strong>状态系统名称:</strong> {terms.systems.status}
      </div>
      {/* 这里可以添加更多术语展示 */}
    </div>
  );
};

export default TermsDisplay;
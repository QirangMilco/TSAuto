import React from 'react';
import type { CharacterInstance } from '../../core/types/battle';
import { StatType } from '../../core/types/definitions';
import { TERMS } from '../../core/config/terms';

interface CharacterAvatarProps {
  character: CharacterInstance;
  isActive: boolean;
  isEnemy: boolean;
  onClick?: (id: string) => void;
  maxActionBarValue: number; // 用于计算进度百分比
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  character,
  isActive,
  isEnemy,
  onClick,
  maxActionBarValue
}) => {
  // 计算血量百分比
  const hpPercent = Math.max(0, Math.min(100, (character.currentHp / character.maxHp) * 100));
  
  // 计算行动条进度百分比 (用于头像旁的微型指示器)
  const actionBarPercent = Math.max(0, Math.min(100, (character.actionBarPosition / maxActionBarValue) * 100));

  // 样式颜色配置
  const borderColor = isActive ? 'border-yellow-400' : isEnemy ? 'border-red-500/50' : 'border-blue-500/50';
  const glowEffect = isActive ? 'ring-4 ring-yellow-400/50 scale-105 z-10' : '';
  const barColor = isEnemy ? 'bg-red-600' : 'bg-green-600';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center transition-all duration-300 cursor-pointer w-20 h-24 md:w-28 md:h-32 ${glowEffect}`}
      onClick={() => onClick?.(character.instanceId)}
    >
      {/* 角色容器 */}
      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 overflow-hidden bg-gray-800 ${borderColor}`}>
        {/* 头像图片 (使用 placeholder 或真实资源) */}
        {/* 在实际项目中，这里应该根据 character.characterId 加载 assets 目录下的图片 */}
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-900">
           {/* 临时显示名字首字母 */}
           {character.characterId.slice(-4)}
        </div>
        
        {/* 死亡遮罩 */}
        {character.isDead && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-red-500 font-bold text-xs">DEAD</span>
          </div>
        )}
      </div>

      {/* 属性信息栏 */}
      <div className="absolute -bottom-2 w-full px-1 flex flex-col gap-1">
        {/* 血条容器 */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-900 shadow-sm">
          <div 
            className={`h-full ${barColor} transition-all duration-500 ease-out`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        
        {/* 辅助信息：HP数值 和 行动条进度 */}
        <div className="flex justify-between items-center text-[10px] md:text-xs font-mono text-white bg-black/50 rounded px-1 backdrop-blur-sm">
          <span>{Math.floor(character.currentHp)}</span>
          {/* 这里显示行动条位置，类似阴阳师里的跑条百分比 */}
          <span className="text-blue-300">
            {Math.floor(actionBarPercent)}%
          </span>
        </div>
      </div>

      {/* 当前行动者标记 (头顶箭头) */}
      {isActive && (
        <div className="absolute -top-4 animate-bounce text-yellow-400">
          ▼
        </div>
      )}
    </div>
  );
};
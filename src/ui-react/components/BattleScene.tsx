import React, { useMemo } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { useBattleStore } from '../../ui-bridge/react/hooks/useBattleStore';
import { TERMS } from '../../core/config/terms';
import type { CharacterInstance } from '../../core/types/battle';
import { useAssets } from '../../ui-bridge/react/hooks/useAssets';

/**
 * 辅助组件：全局行动条轨道
 * 修复：使用 CSS 变量 + Tailwind 响应式前缀替代 JS 宽度判断
 */
const ActionBarRail: React.FC<{ 
  players: CharacterInstance[]; 
  enemies: CharacterInstance[]; 
  maxSpeed: number 
}> = ({ players, enemies, maxSpeed }) => {
  const allChars = [...players, ...enemies];
  const activeChars = allChars.filter(c => !c.isDead);

  return (
    <div className="relative w-full h-12 md:h-full md:w-16 bg-gray-900/80 border-b md:border-l md:border-b-0 border-gray-700 flex md:flex-col items-center p-2 z-20">
      {/* 轨道标题 */}
      <div className="absolute left-2 top-0 text-[10px] text-gray-500 uppercase tracking-widest pointer-events-none">
        {TERMS.battle.actionBar}
      </div>

      {/* 轨道线 */}
      <div className="absolute left-4 right-4 top-1/2 h-1 bg-gray-600 rounded md:top-4 md:bottom-4 md:left-1/2 md:w-1 md:h-auto md:right-auto -translate-y-1/2 md:translate-y-0 md:-translate-x-1/2"></div>

      {/* 终点标记 (移动端:右侧 / PC端:底部) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 md:right-auto md:bottom-2 md:top-auto md:translate-y-0 md:left-1/2 md:-translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50 z-10"></div>

      {/* 角色头像图标 */}
      {activeChars.map((char) => {
        const percent = Math.min(100, (char.actionBarPosition / maxSpeed) * 100);
        const isEnemy = enemies.some(e => e.instanceId === char.instanceId);
        
        return (
          <div
            key={`bar-${char.instanceId}`}
            className={`
              absolute w-8 h-8 rounded-full border-2 overflow-hidden shadow-md 
              transition-all duration-300 ease-linear flex items-center justify-center 
              bg-gray-800 text-[10px] text-white font-bold z-20
              
              /* 核心修复：响应式定位逻辑 */
              /* 移动端 (默认): top居中, left跟随变量 */
              top-1/2 left-[var(--rail-pos)] 
              
              /* PC端 (md): left居中, top跟随变量 */
              md:left-1/2 md:top-[var(--rail-pos)]
              
              /* 居中修正: 向左上偏移50%以对齐中心点 */
              -translate-x-1/2 -translate-y-1/2
            `}
            style={{
              // 通过 CSS 变量传递位置，让 CSS 决定是用在 left 还是 top 上
              '--rail-pos': `${percent}%`,
              borderColor: isEnemy ? '#ef4444' : '#3b82f6'
            } as React.CSSProperties}
          >
            {char.characterId.slice(0, 2)}
          </div>
        );
      })}
    </div>
  );
};

export const BattleScene: React.FC = () => {
  // 从 Store 获取状态
  // 注意：在你的 ReactAdapter 中需要确保导出了这个 hook 或类似的访问方式
  const { battleState, executePlayerAction, isLoading } = useBattleStore();
  const assets = useAssets(); // 获取资源配置

  // 计算当前的“全场满条值” (通常是全场一速的值，或者稍微大一点)
  // 这里我们遍历所有角色，找到当前最大的 actionBarPosition 或 maxSpeed
  const maxActionBarValue = useMemo(() => {
    if (!battleState) return 100;
    const allChars = [...battleState.players, ...battleState.enemies];
    // 使用所有角色中最大的速度作为基准，或者直接使用 TurnManager 的 globalFastestSpeed 逻辑
    // 这里为了 UI 简单，我们取当前最大的 SPD 属性作为 100% 的基准
    const maxSpeed = Math.max(...allChars.map(c => c.currentStats.SPD || 100), 100);
    return maxSpeed;
  }, [battleState]);

  if (!battleState || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-spin text-4xl">⚔️</div>
        <span className="ml-4">Loading Battlefield...</span>
      </div>
    );
  }

  // 区分当前选中的技能（这里简化处理，实际需要一个本地 state 存储 selectedSkillId）
  const handleCharacterClick = (targetId: string) => {
    // 简单的逻辑：如果轮到玩家行动，且点击了敌人，则发动普通攻击
    if (battleState.activeCharacterId) {
       // 这里应该检查 activeCharacterId 是否属于 players
       // 并且结合当前选中的技能进行释放
       // 示例：默认使用第一个技能
       // executePlayerAction({ skillId: 'SKILL_1001', targetId });
       console.log("Target selected:", targetId);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-gray-900 overflow-hidden">
      
      {/* 1. 移动端：顶部行动条 / PC端：右侧行动条 */}
      {/* 我们把行动条放在 flex 布局的第一个，通过 order 或 absolute 调整位置 */}
      {/* 为了响应式简单，我们在移动端置顶，PC端置右 */}
      <div className="md:order-3 md:h-full md:w-20 w-full h-16 shrink-0 z-30">
        <ActionBarRail 
          players={battleState.players} 
          enemies={battleState.enemies} 
          maxSpeed={maxActionBarValue} 
        />
      </div>

      {/* 2. 战斗主区域 */}
      <div className="flex-1 relative flex flex-col md:flex-row items-center justify-between p-4 md:p-12 gap-8 md:gap-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url(${assets.backgrounds.battle}), ${assets.backgrounds.fallbackGradient}` 
        }}
      >
        {/* 背景遮罩，让 UI 更清晰 */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        {/* 敌方阵营 (PC: 左侧, Mobile: 上方) */}
        <div className="relative z-10 flex md:flex-col flex-row flex-wrap justify-center gap-4 w-full md:w-auto md:h-full md:justify-center p-4">
          {battleState.enemies.map((enemy) => (
            <CharacterAvatar
              key={enemy.instanceId}
              character={enemy}
              isActive={battleState.activeCharacterId === enemy.instanceId}
              isEnemy={true}
              onClick={handleCharacterClick}
              maxActionBarValue={maxActionBarValue}
            />
          ))}
        </div>

        {/* VS 标志 / 回合数 */}
        <div className="relative z-10 flex flex-col items-center justify-center opacity-50 pointer-events-none">
          <span className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">VS</span>
          <span className="text-sm text-yellow-500 font-mono">
             {TERMS.battle.turn} {battleState.round}
          </span>
        </div>

        {/* 我方阵营 (PC: 右侧, Mobile: 下方) */}
        <div className="relative z-10 flex md:flex-col flex-row flex-wrap justify-center gap-4 w-full md:w-auto md:h-full md:justify-center p-4">
          {battleState.players.map((player) => (
            <CharacterAvatar
              key={player.instanceId}
              character={player}
              isActive={battleState.activeCharacterId === player.instanceId}
              isEnemy={false}
              onClick={handleCharacterClick}
              maxActionBarValue={maxActionBarValue}
            />
          ))}
        </div>
      </div>

      {/* 3. 底部技能栏 (占位) */}
      <div className="absolute bottom-0 left-0 right-0 h-20 md:h-24 bg-gradient-to-t from-black to-transparent z-20 flex items-end justify-center pb-4 pointer-events-none">
        <div className="bg-gray-800/90 p-2 rounded-xl border border-gray-600 pointer-events-auto backdrop-blur flex gap-2">
            {/* 这里将来放置 SkillBar 组件 */}
            <div className="text-gray-400 text-xs">Waiting for SkillBar Component...</div>
        </div>
      </div>

    </div>
  );
};
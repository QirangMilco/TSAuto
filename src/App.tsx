import React, { useEffect } from 'react';
import { BattleScene } from './ui-react/components/BattleScene';
import { useBattleStore, battleAdapter } from './ui-bridge/react/hooks/useBattleStore';
import { StatType } from './core/types/definitions';
import type { BattleState, CharacterInstance } from './core/types/battle';
import './App.css'; // 确保引入了 Tailwind 的样式

// --- 辅助函数：快速生成测试角色实例 ---
const createMockCharacter = (
  id: string, 
  name: string, 
  isEnemy: boolean, 
  speed: number
): CharacterInstance => ({
  instanceId: id,
  characterId: name, // 这里暂时用名字代替 ID 显示
  currentStats: {
    [StatType.HP]: 1000,
    [StatType.ATK]: 100,
    [StatType.DEF]: 50,
    [StatType.SPD]: speed,
    [StatType.CRIT]: 0.1,
    [StatType.CRIT_DMG]: 1.5,
    [StatType.ATK_P]: 0,
    [StatType.DEF_P]: 0,
    [StatType.HP_P]: 0,
    [StatType.DMG_BONUS]: 0,
    [StatType.DMG_TAKEN_BONUS]: 0,
    [StatType.IGNORE_DEF_P]: 0,
    [StatType.IGNORE_DEF_FLAT]: 0,
    [StatType.HEAL_BONUS]: 0,
    [StatType.RECEIVE_HEAL_BONUS]: 0
  },
  maxHp: 1000,
  currentHp: isEnemy ? 800 : 1000, // 敌人稍微掉点血，演示血条效果
  actionBarPosition: Math.random() * speed, // 随机初始位置
  statuses: [],
  isDead: false,
  equipment: [],
  takeDamage: () => {},
  addStatus: () => {},
  removeStatus: () => {}
});

function App() {
  // 获取 store 中的方法
  const updateState = useBattleStore((state) => state.updateState);

  useEffect(() => {
    // --- 初始化模拟战斗数据 ---
    // 注意：这是为了预览 UI 的临时数据，实际逻辑应由 BattleEngine 生成
    
    const mockPlayers = [
      createMockCharacter('player_1', 'CHAR_1001', false, 120),
      createMockCharacter('player_2', 'CHAR_1002', false, 105),
      createMockCharacter('player_3', 'CHAR_1003', false, 110),
    ];

    const mockEnemies = [
      createMockCharacter('enemy_1', 'BOSS_01', true, 150), // Boss 速度快
      createMockCharacter('enemy_2', 'MOB_01', true, 90),
      createMockCharacter('enemy_3', 'MOB_02', true, 95),
    ];

    const initialBattleState: BattleState = {
      battleId: 'test_battle_01',
      round: 1,
      players: mockPlayers,
      enemies: mockEnemies,
      activeCharacterId: 'player_1', // 假设轮到玩家1行动
      resourceManager: {
        currentResource: 3,
        maxResource: 8,
        advance: () => {},
        consume: () => true
      },
      result: "IN_PROGRESS"
    };

    // 强制更新 UI 状态
    updateState(initialBattleState);
    
    console.log('Mock Battle Initialized', initialBattleState);
  }, [updateState]);

  return (
    <div className="w-full h-screen">
      <BattleScene />
    </div>
  );
}

export default App;
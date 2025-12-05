import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleEngine } from '../../../../src/core/battle/BattleEngine';
import type { GameDataInterface } from '../../../../src/core/types/plugin';
import type { CharacterInstance } from '../../../../src/core/types/battle';
import { StatType } from '../../../../src/core/types/definitions';

// Mock GameData
const mockGameData: GameDataInterface = {
  getCharacter: vi.fn(),
  getSkill: vi.fn(),
  getEquipment: vi.fn(),
  getStatus: vi.fn(),
  getEquipmentSet: vi.fn(),
} as any;

describe('BattleEngine Round Logic', () => {
  let engine: BattleEngine;
  let player: CharacterInstance;
  let enemy: CharacterInstance;

  beforeEach(() => {
    engine = new BattleEngine(mockGameData);
    
    // Mock characters with minimal required props
    player = { 
      instanceId: 'p1', 
      isDead: false,
      statuses: [],
      currentStats: { [StatType.HP]: 100 },
      baseStats: { [StatType.HP]: 100 },
      maxHp: 100,
      currentHp: 100
    } as CharacterInstance;
    
    enemy = { 
      instanceId: 'e1', 
      isDead: false, 
      statuses: [],
      currentStats: { [StatType.HP]: 100 },
      baseStats: { [StatType.HP]: 100 },
      maxHp: 100,
      currentHp: 100
    } as CharacterInstance;
    
    // Init battle state
    engine.initBattleState([player], [enemy]);
  });

  it('should initialize round to 1', () => {
    expect(engine.getBattleState().round).toBe(1);
  });

  it('should update round based on action count', () => {
    const engineAny = engine as any;
    
    // Initial state: 0 actions, 2 alive units
    // Round = floor(0 / 2) + 1 = 1
    engineAny.updateGlobalRound();
    expect(engine.getBattleState().round).toBe(1);
    
    // 1 action
    engineAny.totalActionCount = 1;
    engineAny.updateGlobalRound();
    // Round = floor(1 / 2) + 1 = 1
    expect(engine.getBattleState().round).toBe(1);
    
    // 2 actions (Everyone acted once approx)
    engineAny.totalActionCount = 2;
    engineAny.updateGlobalRound();
    // Round = floor(2 / 2) + 1 = 2
    expect(engine.getBattleState().round).toBe(2);
    
    // 3 actions
    engineAny.totalActionCount = 3;
    engineAny.updateGlobalRound();
    expect(engine.getBattleState().round).toBe(2);
    
    // 4 actions
    engineAny.totalActionCount = 4;
    engineAny.updateGlobalRound();
    expect(engine.getBattleState().round).toBe(3);
  });
  
  it('should handle death correctly (accelerate rounds)', () => {
    const engineAny = engine as any;
    
    // Player acts (Total 1)
    engineAny.totalActionCount = 1;
    engineAny.updateGlobalRound();
    expect(engine.getBattleState().round).toBe(1); // floor(1/2) + 1 = 1
    
    // Enemy dies
    enemy.isDead = true;
    
    // Player acts again (Total 2)
    engineAny.totalActionCount = 2;
    engineAny.updateGlobalRound();
    // Alive = 1
    // Round = floor(2 / 1) + 1 = 3
    // This logic implies that since there's only 1 person, every action is a new round for them. Correct.
    expect(engine.getBattleState().round).toBe(3);
  });
  
  it('should not decrement status duration at start of turn', () => {
    const engineAny = engine as any;
    
    // Add a status with 1 turn duration
    player.statuses.push({
      statusId: 'atk_up',
      remainingTurns: 1,
      sourceId: 'self',
      type: 'BUFF',
      stackCount: 1
    } as any);
    
    // Mock getStatus to return something
    (mockGameData.getStatus as any).mockReturnValue({
        id: 'atk_up',
        name: 'Attack Up',
        statModifiers: { [StatType.ATK_P]: 20 }
    });
    
    // Process Start of Turn
    engineAny.processTurnStartStatusEffects(player);
    
    // Duration should still be 1
    expect(player.statuses[0].remainingTurns).toBe(1);
    // Should not be removed
    expect(player.statuses.length).toBe(1);
  });
  
  it('should decrement status duration at end of turn', () => {
    const engineAny = engine as any;
    
    // Add a status with 1 turn duration
    player.statuses.push({
      statusId: 'atk_up',
      remainingTurns: 1,
      sourceId: 'self',
      type: 'BUFF',
      stackCount: 1
    } as any);
    
    // Process End of Turn
    engineAny.processTurnEndStatusEffects(player);
    
    // Duration should be 0 and removed
    expect(player.statuses.length).toBe(0);
  });
  
  it('should keep status if duration > 1 after decrement', () => {
    const engineAny = engine as any;
    
    // Add a status with 2 turn duration
    player.statuses.push({
      statusId: 'atk_up',
      remainingTurns: 2,
      sourceId: 'self',
      type: 'BUFF',
      stackCount: 1
    } as any);
    
    // Process End of Turn
    engineAny.processTurnEndStatusEffects(player);
    
    // Duration should be 1
    expect(player.statuses.length).toBe(1);
    expect(player.statuses[0].remainingTurns).toBe(1);
  });
});

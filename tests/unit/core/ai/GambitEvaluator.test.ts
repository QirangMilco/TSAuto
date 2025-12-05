import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GambitEvaluator } from '../../../../src/core/ai/GambitEvaluator';
import { GambitConditionType, GambitTargetType, GambitTargetStrategy } from '../../../../src/core/types/gambit';
import type { BattleState, CharacterInstance } from '../../../../src/core/types/battle';
import { StatType } from '../../../../src/core/types/definitions';

describe('GambitEvaluator', () => {
  let evaluator: GambitEvaluator;
  let mockGameData: any;
  let actor: CharacterInstance;
  let ally: CharacterInstance;
  let enemy1: CharacterInstance;
  let enemy2: CharacterInstance;
  let battleState: BattleState;

  beforeEach(() => {
    // Mock GameData
    mockGameData = {
      getSkill: vi.fn().mockReturnValue({ cost: { amount: 0 } }), // All skills are free and valid
    };
    evaluator = new GambitEvaluator(mockGameData);

    // Setup Characters
    actor = {
      instanceId: 'actor',
      isDead: false,
      maxHp: 100,
      currentHp: 100,
      currentStats: { [StatType.ATK]: 50 },
      baseStats: {},
    } as any;

    ally = {
      instanceId: 'ally',
      isDead: false,
      maxHp: 100,
      currentHp: 20, // Low HP
      currentStats: { [StatType.ATK]: 50 },
      baseStats: {},
    } as any;

    enemy1 = {
      instanceId: 'enemy1',
      isDead: false,
      maxHp: 100,
      currentHp: 100,
      currentStats: { [StatType.ATK]: 10 },
      baseStats: {},
    } as any;

    enemy2 = {
      instanceId: 'enemy2',
      isDead: false,
      maxHp: 100,
      currentHp: 80,
      currentStats: { [StatType.ATK]: 100 }, // High ATK
      baseStats: {},
    } as any;

    // Setup BattleState
    battleState = {
      players: [actor, ally],
      enemies: [enemy1, enemy2],
      resourceManager: { currentResource: 3 },
    } as any;
  });

  it('should select the highest priority rule that meets condition', () => {
    const gambit = {
      id: 'test',
      name: 'Test',
      rules: [
        {
          id: 'r1', name: 'Heal Low HP', priority: 1,
          condition: { type: GambitConditionType.HP_BELOW, value: 0.5 }, // Actor HP < 50% (False)
          target: { type: GambitTargetType.SELF, strategy: GambitTargetStrategy.SELF },
          actionId: 'HEAL'
        },
        {
          id: 'r2', name: 'Attack', priority: 2,
          condition: { type: GambitConditionType.ALWAYS }, // True
          target: { type: GambitTargetType.ENEMY, strategy: GambitTargetStrategy.RANDOM },
          actionId: 'ATTACK'
        }
      ]
    };

    const action = evaluator.decideAction(actor, battleState, gambit);
    expect(action).not.toBeNull();
    expect(action?.skillId).toBe('ATTACK');
  });

  it('should prioritize lower priority number', () => {
    const gambit = {
      id: 'test',
      name: 'Test',
      rules: [
        {
          id: 'r2', name: 'Low Prio', priority: 10,
          condition: { type: GambitConditionType.ALWAYS },
          target: { type: GambitTargetType.SELF, strategy: GambitTargetStrategy.SELF },
          actionId: 'WAIT'
        },
        {
          id: 'r1', name: 'High Prio', priority: 1,
          condition: { type: GambitConditionType.ALWAYS },
          target: { type: GambitTargetType.SELF, strategy: GambitTargetStrategy.SELF },
          actionId: 'ACT'
        }
      ]
    };

    const action = evaluator.decideAction(actor, battleState, gambit);
    expect(action?.skillId).toBe('ACT');
  });

  it('should target ally with lowest HP percent', () => {
    const gambit = {
      id: 'heal',
      name: 'Heal Weakest',
      rules: [{
        id: 'r1', name: 'Heal', priority: 1,
        condition: { type: GambitConditionType.ALWAYS },
        target: { type: GambitTargetType.ALLY, strategy: GambitTargetStrategy.LOWEST_HP_PERCENT },
        actionId: 'HEAL'
      }]
    };

    const action = evaluator.decideAction(actor, battleState, gambit);
    expect(action?.targetId).toBe('ally'); // Ally has 20% HP, Actor has 100%
  });

  it('should target enemy with highest ATK', () => {
    const gambit = {
      id: 'snipe',
      name: 'Snipe Strongest',
      rules: [{
        id: 'r1', name: 'Attack', priority: 1,
        condition: { type: GambitConditionType.ALWAYS },
        target: { type: GambitTargetType.ENEMY, strategy: GambitTargetStrategy.HIGHEST_ATK },
        actionId: 'ATTACK'
      }]
    };

    const action = evaluator.decideAction(actor, battleState, gambit);
    expect(action?.targetId).toBe('enemy2'); // Enemy2 has 100 ATK, Enemy1 has 10
  });
});

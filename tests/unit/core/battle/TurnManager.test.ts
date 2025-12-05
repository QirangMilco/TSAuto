import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnManager } from '../../../../src/core/battle/TurnManager';
import { TurnType, StatType } from '../../../../src/core/types/definitions';
import type { CharacterInstance } from '../../../../src/core/types/battle';

describe('TurnManager Extra Turns', () => {
  let manager: TurnManager;
  let char1: CharacterInstance;
  let char2: CharacterInstance;
  
  beforeEach(() => {
    manager = new TurnManager();
    
    char1 = {
      instanceId: 'c1',
      isDead: false,
      actionBarPosition: 0,
      currentStats: { [StatType.SPD]: 100 },
      statuses: []
    } as any;
    
    char2 = {
      instanceId: 'c2',
      isDead: false,
      actionBarPosition: 0,
      currentStats: { [StatType.SPD]: 50 },
      statuses: []
    } as any;
  });
  
  it('should process normal turns via CTB', () => {
    // c1 speed 100, c2 speed 50
    // updateActionBar calls recalculateGlobalSpeed internally
    const ready = manager.updateActionBar([char1, char2]);
    
    expect(ready.length).toBeGreaterThan(0);
    expect(ready[0].characterId).toBe('c1');
    expect(ready[0].turnType).toBe(TurnType.NORMAL);
  });
  
  it('should prioritize extra turns', () => {
    manager.grantExtraTurn('c2');
    
    const ready = manager.updateActionBar([char1, char2]);
    
    expect(ready.length).toBe(1);
    expect(ready[0].characterId).toBe('c2');
    expect(ready[0].turnType).toBe(TurnType.EXTRA);
    
    // Next update resumes normal
    const readyNext = manager.updateActionBar([char1, char2]);
    expect(readyNext.length).toBeGreaterThan(0);
    expect(readyNext[0].characterId).toBe('c1');
    expect(readyNext[0].turnType).toBe(TurnType.NORMAL);
  });
  
  it('should handle multiple extra turns in order', () => {
    manager.grantExtraTurn('c2');
    manager.grantExtraTurn('c1');
    
    const ready1 = manager.updateActionBar([char1, char2]);
    expect(ready1[0].characterId).toBe('c2');
    
    const ready2 = manager.updateActionBar([char1, char2]);
    expect(ready2[0].characterId).toBe('c1');
  });
});

import { BattleEventType, EffectType, TurnType, StatType } from '../types/definitions';
import type { CharacterInstance, BattleState, BattleEvent, PlayerAction } from '../types/battle';
import type { GameDataInterface } from '../types/plugin';
import type { SkillDefinition, Effect, StatusDefinition } from '../types/definitions';
import { TurnManager } from './TurnManager';
import { DamageCalculator } from './DamageCalculator';

/**
 * 战斗引擎
 * 负责战斗核心逻辑、状态管理和流程控制
 */
export class BattleEngine {
  private battleState: BattleState;
  private gameData: GameDataInterface;
  private turnManager: TurnManager;
  private damageCalculator: DamageCalculator;
  private eventListeners: Map<BattleEventType, ((event: BattleEvent) => void)[]>;
  private pendingEffects: Effect[] = [];
  
  constructor(gameData: GameDataInterface) {
    this.gameData = gameData;
    this.turnManager = new TurnManager([], gameData); // 传入gameData参数
    this.damageCalculator = new DamageCalculator();
    this.eventListeners = new Map();
    
    // 初始化战斗状态
    this.battleState = this.createInitialBattleState();
  }
  
  /**
   * 创建初始战斗状态
   */
  private createInitialBattleState(): BattleState {
    return {
      battleId: `battle_${Date.now()}`,
      round: 1,
      players: [],
      enemies: [],
      activeCharacterId: null,
      resourceManager: {
        currentResource: 0,
        maxResource: 100,
        advance: (turns = 1) => {
          // 每回合增加25点资源
          this.battleState.resourceManager.currentResource = Math.min(
            this.battleState.resourceManager.maxResource,
            this.battleState.resourceManager.currentResource + 25 * turns
          );
        },
        consume: (amount: number) => {
          if (this.battleState.resourceManager.currentResource >= amount) {
            this.battleState.resourceManager.currentResource -= amount;
            return true;
          }
          return false;
        }
      },
      result: "IN_PROGRESS"
    };
  }
  
  /**
   * 开始战斗
   */
  public startBattle(): void {
    // 触发战斗开始事件
    this.triggerEvent(BattleEventType.ON_BATTLE_START, {
      battleId: this.battleState.battleId
    });
    
    // 开始战斗循环
    this.battleLoop();
  }
  
  /**
   * 战斗主循环
   */
  private battleLoop(): void {
    while (this.battleState.result === "IN_PROGRESS") {
      // 获取所有角色
      const allCharacters = [...this.battleState.players, ...this.battleState.enemies];
      
      // 更新行动条
      const readyCharacters = this.turnManager.updateActionBar(allCharacters);
      
      if (readyCharacters.length > 0) {
        // 处理第一个就绪的角色行动
        const actingCharacter = readyCharacters[0];
        this.battleState.activeCharacterId = actingCharacter.instanceId;
        
        // 触发回合开始事件
        this.triggerEvent(BattleEventType.ON_TURN_START, {
          characterId: actingCharacter.instanceId,
          round: this.battleState.round
        });
        
        // 处理该角色的行动
        this.processCharacterTurn(actingCharacter);
        
        // 触发回合结束事件
        this.triggerEvent(BattleEventType.ON_TURN_END, {
          characterId: actingCharacter.instanceId,
          round: this.battleState.round
        });
        
        // 重置行动条
        this.turnManager.resetActionBar(actingCharacter);
        
        // 更新资源
        this.battleState.resourceManager.advance();
        
        // 检查战斗结果
        this.checkBattleResult();
        
        // 推进回合数
        this.battleState.round++;
      }
    }
  }
  
  /**
   * 处理角色回合
   */
  private processCharacterTurn(character: CharacterInstance): void {
    // 这里简化实现，实际应该根据AI或玩家输入决定行动
    // 处理状态效果
    this.processStatusEffects(character);
    
    // TODO: 根据角色类型执行不同的行动逻辑
    // - 玩家角色：等待玩家输入
    // - 敌方角色：执行AI决策
  }
  
  /**
   * 执行玩家动作
   */
  public executePlayerAction(action: PlayerAction): void {
    const { skillId, targetId } = action;
    
    // 查找目标角色
    const target = this.findCharacterById(targetId);
    if (!target) return;
    
    // 查找技能定义
    const skill = this.gameData.getSkill(skillId);
    if (!skill) return;
    
    // 检查资源是否足够
    if (skill.cost && !this.battleState.resourceManager.consume(skill.cost.amount)) {
      return;
    }
    
    // 触发技能使用事件
    this.triggerEvent(BattleEventType.ON_SKILL_USED, {
      skillId,
      targetId,
      casterId: this.battleState.activeCharacterId
    });
    
    // 执行技能效果
    if (skill.activeEffects) {
      for (const effect of skill.activeEffects) {
        this.executeEffect(effect, target);
      }
    }
  }
  
  /**
   * 执行效果
   */
  private executeEffect(effect: Effect, target: CharacterInstance): void {
    const caster = this.findCharacterById(this.battleState.activeCharacterId!);
    if (!caster) return;
    
    switch (effect.type) {
      case EffectType.DAMAGE:
        this.applyDamage(caster, target, effect.damageMultiplier || 1.0, effect.baseDamageStat);
        break;
        
      case EffectType.HEAL:
          this.applyHeal(caster, target, effect.healMultiplier || 1.0, effect.baseHealStat);
          break;
        
      case EffectType.APPLY_STATUS:
        if (effect.statusId) {
          target.addStatus(effect.statusId, effect.duration);
          this.triggerEvent(BattleEventType.ON_STATUS_APPLIED, {
            targetId: target.instanceId,
            statusId: effect.statusId
          });
        }
        break;
        
      case EffectType.MODIFY_ACTION_BAR:
        if (effect.amount !== undefined) {
          this.turnManager.adjustActionBar(target, effect.amount);
        }
        break;
        
      // 其他效果类型的处理...
    }
  }
  
  /**
   * 应用伤害
   */
  private applyDamage(attacker: CharacterInstance, defender: CharacterInstance, multiplier: number, baseStat?: StatType): void {
    const damageResult = this.damageCalculator.calculateDamage(attacker, defender, multiplier, baseStat);
    
    // 应用伤害
    defender.takeDamage(damageResult.damage);
    
    // 触发伤害事件
    this.triggerEvent(BattleEventType.ON_DAMAGE_DEALT, {
      attackerId: attacker.instanceId,
      defenderId: defender.instanceId,
      damage: damageResult.damage,
      isCritical: damageResult.isCritical
    });
    
    // 检查是否死亡
    if (defender.isDead) {
      this.triggerEvent(BattleEventType.ON_CHARACTER_DEATH, {
        characterId: defender.instanceId
      });
    }
  }
  
  /**
   * 应用治疗
   */
  private applyHeal(caster: CharacterInstance, target: CharacterInstance, multiplier: number = 1.0, baseStat?: StatType): void {
    const healResult = this.damageCalculator.calculateHeal(caster, target, multiplier, baseStat);
    target.currentHp = Math.min(target.maxHp, target.currentHp + healResult.healAmount);
    
    // 触发治疗事件
    this.triggerEvent(BattleEventType.ON_HEAL_RECEIVED, {
      casterId: caster.instanceId,
      targetId: target.instanceId,
      amount: healResult.healAmount,
      isCritical: healResult.isCritical
    });
  }
  
  /**
   * 处理状态效果
   */
  private processStatusEffects(character: CharacterInstance): void {
    // 简化实现，实际应该处理各种状态效果
  }
  
  /**
   * 检查战斗结果
   */
  private checkBattleResult(): void {
    const allPlayersDead = this.battleState.players.every(p => p.isDead);
    const allEnemiesDead = this.battleState.enemies.every(e => e.isDead);
    
    if (allPlayersDead) {
      this.battleState.result = "DEFEAT";
    } else if (allEnemiesDead) {
      this.battleState.result = "VICTORY";
    }
  }
  
  /**
   * 查找角色
   */
  private findCharacterById(id: string): CharacterInstance | undefined {
    return [...this.battleState.players, ...this.battleState.enemies].find(c => c.instanceId === id);
  }
  
  /**
   * 触发事件
   */
  private triggerEvent(type: BattleEventType, data: any): void {
    const event: BattleEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
  
  /**
   * 添加事件监听器
   */
  public addEventListener(type: BattleEventType, listener: (event: BattleEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }
  
  /**
   * 获取战斗状态
   */
  public getBattleState(): BattleState {
    return { ...this.battleState };
  }
}
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

  private isRunning: boolean = false;
  private battleSpeed: number = 800; // 基础动画延迟 (ms)
  private pendingPlayerInputResolve: ((action: PlayerAction) => void) | null = null; // 用于挂起等待玩家输入

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
        currentResource: 4,
        maxResource: 8,
        advance: (turns = 1) => {
          // 每回合增加25点资源
          this.battleState.resourceManager.currentResource = Math.min(
            this.battleState.resourceManager.maxResource,
            this.battleState.resourceManager.currentResource + turns
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
  * 异步等待辅助函数
  */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 等待玩家输入
   * 这会返回一个 Promise，直到外部调用 executePlayerAction 才会 resolve
   */
  private waitForPlayerInput(): Promise<PlayerAction> {
    return new Promise((resolve) => {
      this.pendingPlayerInputResolve = resolve;
    });
  }

  /**
   * 开始战斗
   */
  public async startBattle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 触发战斗开始事件
    this.triggerEvent(BattleEventType.ON_BATTLE_START, {
      battleId: this.battleState.battleId
    });

    // 等待开场动画
    await this.sleep(this.battleSpeed);

    // 开始战斗循环
    await this.battleLoop();
  }

  /**
   * 战斗主循环
   */
  private async battleLoop(): Promise<void> {
    while (this.battleState.result === "IN_PROGRESS" && this.isRunning) {
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

        // 视觉停顿：让玩家看清楚轮到谁了
        await this.sleep(this.battleSpeed * 0.5);

        // 处理该角色的行动
        await this.processCharacterTurn(actingCharacter);

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

        // 视觉停顿：回合结束稍作休息
        await this.sleep(this.battleSpeed * 0.5);

        // 推进回合数
        this.battleState.round++;
      } else {
        // 如果没有角色跑满条（理论上 TurnManager.updateActionBar 会一直跑到有人满为止）
        // 这里加个保护防止死循环
        await this.sleep(100);
      }
    }

    this.isRunning = false;
    console.log(`Battle Ended: ${this.battleState.result}`);
  }

  /**
   * 处理角色回合
   */
  private async processCharacterTurn(character: CharacterInstance): Promise<void> {
    // 这里简化实现，实际应该根据AI或玩家输入决定行动
    // 处理状态效果
    this.processStatusEffects(character);

    const isPlayer = this.battleState.players.some(p => p.instanceId === character.instanceId);

    if (isPlayer) {
        // === 玩家回合：等待UI输入 ===
        console.log(`Waiting for player input: ${character.instanceId}`);
        
        // 挂起，直到 UI 调用 executePlayerAction
        const action = await this.waitForPlayerInput();
        
        // 收到指令，执行技能逻辑
        await this.performSkillAction(action);
    } else {
        // === 敌方回合：简单的 AI 决策 ===
        console.log(`AI thinking: ${character.instanceId}`);
        
        // 模拟 AI 思考时间
        await this.sleep(this.battleSpeed); 
        
        // 简单的 AI：随机普攻一个活着的玩家
        const alivePlayers = this.battleState.players.filter(p => !p.isDead);
        if (alivePlayers.length > 0) {
            const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            // 假设所有怪物都有普通攻击 SKILL_1001 (需确保 GameData 里有)
            // 如果没有，需要 fallback 逻辑
            await this.performSkillAction({
                skillId: "SKILL_1001", 
                targetId: randomTarget.instanceId
            });
        }
    }
  }

  /**
   * 接收玩家动作指令 (由 UI 调用)
   */
  public executePlayerAction(action: PlayerAction): void {
    if (this.pendingPlayerInputResolve) {
        this.pendingPlayerInputResolve(action);
        this.pendingPlayerInputResolve = null; // 清除挂起状态
    } else {
        console.warn("Received player action but not waiting for input.");
    }
  }

  /**
   * 执行具体的技能逻辑 (通用)
   */
  private async performSkillAction(action: PlayerAction): Promise<void> {
    const { skillId, targetId } = action;
    const casterId = this.battleState.activeCharacterId!;
    const caster = this.findCharacterById(casterId);
    const target = this.findCharacterById(targetId);

    if (!caster || !target) return;

    const skill = this.gameData.getSkill(skillId);
    if (!skill) {
        console.error(`Skill not found: ${skillId}`);
        return;
    }

    // 消耗资源
    if (skill.cost && skill.cost.amount > 0) {
        this.battleState.resourceManager.consume(skill.cost.amount);
    }

    // 1. 触发技能使用事件 (UI 显示技能名、播放施法动作)
    this.triggerEvent(BattleEventType.ON_SKILL_USED, {
      skillId,
      targetId,
      casterId
    });
    
    // 施法前摇延迟
    await this.sleep(this.battleSpeed * 0.8);

    // 2. 执行技能效果
    if (skill.activeEffects) {
      for (const effect of skill.activeEffects) {
        this.executeEffect(effect, caster, target);
        // 多个效果之间稍微间隔一点，防止数字重叠
        await this.sleep(200); 
      }
    }
    
    // 技能后摇延迟
    await this.sleep(this.battleSpeed * 0.5);
  }

  /**
   * 执行效果
   */
  private executeEffect(effect: Effect, caster: CharacterInstance, target: CharacterInstance): void {
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
    // 简化实现：减少所有状态的持续时间
    character.statuses.forEach(status => {
        status.remainingTurns--;
    });
    // 移除过期状态
    character.statuses = character.statuses.filter(s => s.remainingTurns > 0);
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
    this.isRunning = false;
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
   * 初始化战斗状态 (允许外部注入数据)
   */
  public initBattleState(players: CharacterInstance[], enemies: CharacterInstance[]): void {
      this.battleState.players = players;
      this.battleState.enemies = enemies;
      // 重置资源
      this.battleState.resourceManager.currentResource = 4;
  }

  /**
   * 获取战斗状态
   */
  public getBattleState(): BattleState {
    return { ...this.battleState };
  }
}
import { BattleEventType, EffectType, TurnType, StatType, SetEffectContext, SkillMechanicContext } from '../types/definitions';
import type { CharacterInstance, BattleState, BattleEvent, PlayerAction } from '../types/battle';
import type { GameDataInterface } from '../types/plugin';
import type { SkillDefinition, Effect, StatusDefinition } from '../types/definitions';
import { TurnManager } from './TurnManager';
import { DamageCalculator } from './DamageCalculator';
import { SetEffectRegistry } from './SetEffectRegistry';
import { SkillMechanicRegistry } from './SkillMechanicRegistry';
import { EQUIPMENT_SETS } from '../config/equipmentSets';

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
        resourceBar: 0, // 鬼火条进度，0-5
        advance: (turns = 1, turnType: TurnType = TurnType.NORMAL) => {
          // 只有真回合才推进鬼火条
          if (turnType === TurnType.NORMAL) {
            // 推进鬼火条
            this.battleState.resourceManager.resourceBar += 1;
            
            // 鬼火条满5格时，回复1点鬼火
            if (this.battleState.resourceManager.resourceBar >= 5) {
              this.battleState.resourceManager.currentResource = Math.min(
                this.battleState.resourceManager.maxResource,
                this.battleState.resourceManager.currentResource + 1
              );
              // 重置鬼火条
              this.battleState.resourceManager.resourceBar = 0;
            }
          }
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

        // 触发御魂效果（回合结束时）
        this.triggerSoulEffects(actingCharacter, BattleEventType.ON_TURN_END);
        
        // 触发回合结束事件
        this.triggerEvent(BattleEventType.ON_TURN_END, {
          characterId: actingCharacter.instanceId,
          round: this.battleState.round
        });

        // 重置行动条
        this.turnManager.resetActionBar(actingCharacter);

        // 更新资源（默认是真回合）
        this.battleState.resourceManager.advance(1, TurnType.NORMAL);

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

    // 2. 触发技能机制 (如果有)
    const mechanicResults: any[] = [];
    if (skill.mechanicId) {
      const registry = SkillMechanicRegistry.getInstance();
      const mechanicContext: SkillMechanicContext = {
        caster,
        targets: [target],
        battleState: this.battleState,
        battleEngine: this,
        skill,
        skillId
      };
      
      const mechanicResult = registry.executeMechanic(skill.mechanicId, mechanicContext);
      if (mechanicResult) {
        mechanicResults.push(mechanicResult);
        
        // 处理机制结果
        this.handleMechanicResult(mechanicResult, caster, [target], skill);
        
        // 如果有消息，打印日志
        if (mechanicResult.message) {
          console.log(mechanicResult.message);
        }
      }
    }

    // 3. 执行技能效果
    if (skill.activeEffects) {
      for (const effect of skill.activeEffects) {
        this.executeEffect(effect, caster, target);
        // 多个效果之间稍微间隔一点，防止数字重叠
        await this.sleep(200); 
      }
    }
    
    // 4. 技能后处理：再次检查机制结果（如协战）
    for (const mechanicResult of mechanicResults) {
      if (mechanicResult.assist) {
        // 处理协战
        await this.handleAssistMechanic(mechanicResult.assist, caster);
      }
    }
    
    // 技能后摇延迟
    await this.sleep(this.battleSpeed * 0.5);
  }
  
  /**
   * 处理技能机制结果
   */
  private handleMechanicResult(result: any, caster: CharacterInstance, targets: CharacterInstance[], skill: SkillDefinition): void {
    // 处理多段伤害
    if (result.multiHit && result.multiHit > 1) {
      // 这里可以实现多段伤害逻辑
      console.log(`${caster.name}的技能造成了${result.multiHit}段伤害`);
    }
    
    // 处理生命偷取
    if (result.lifeSteal && result.lifeSteal > 0) {
      const newHp = Math.min(caster.maxHp, caster.currentHp + result.lifeSteal);
      caster.currentHp = newHp;
      console.log(`${caster.name}偷取了${result.lifeSteal}点生命值，当前生命值: ${newHp}/${caster.maxHp}`);
    }
    
    // 处理伤害反弹
    if (result.reflectDamage && result.reflectDamage > 0) {
      // 这里可以实现伤害反弹逻辑
      console.log(`${caster.name}反弹了${result.reflectDamage}点伤害`);
    }
    
    // 处理状态扩散
    if (result.spreadStatus) {
      // 这里可以实现状态扩散逻辑
      console.log(`${caster.name}扩散了${result.spreadStatus.name}状态`);
    }
    
    // 处理伤害倍率
    if (result.damageMultiplier) {
      // 这里可以保存伤害倍率，用于后续伤害计算
      console.log(`${caster.name}获得了${(result.damageMultiplier - 1) * 100}%的伤害提升`);
    }
  }
  
  /**
   * 处理协战机制
   */
  private async handleAssistMechanic(assistData: any, caster: CharacterInstance): Promise<void> {
    const { character, skillId } = assistData;
    if (!character || !skillId) return;
    
    // 找到一个合适的目标
    const targets = [...this.battleState.enemies].filter(e => !e.isDead);
    if (targets.length === 0) return;
    
    const assistTarget = targets[Math.floor(Math.random() * targets.length)];
    
    // 触发协战攻击
    await this.sleep(this.battleSpeed * 0.5);
    
    const skill = this.gameData.getSkill(skillId);
    if (skill && skill.activeEffects) {
      for (const effect of skill.activeEffects) {
        this.executeEffect(effect, character, assistTarget);
        await this.sleep(150);
      }
    }
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
    let damageResult = this.damageCalculator.calculateDamage(attacker, defender, multiplier, baseStat);
    let finalDamage = damageResult.damage;
    
    // 触发伤害相关的技能机制
    const registry = SkillMechanicRegistry.getInstance();
    const mechanicContext = {
      caster: attacker,
      targets: [defender],
      battleState: this.battleState,
      battleEngine: this,
      skill: null as any, // 这里简化处理，实际应该传递技能信息
      skillId: 'UNKNOWN',
      damageResult
    };
    
    // 检查攻击者是否有伤害相关的技能机制
    // 这里简化处理，实际应该检查攻击者的技能列表
    
    // 触发伤害相关的套装效果
    const damageContext = {
      target: defender,
      damage: finalDamage,
      isCrit: damageResult.isCritical,
      rawDamage: damageResult.rawDamage
    };
    
    const effectResults = this.triggerSoulEffects(attacker, BattleEventType.ON_DAMAGE_DEALT, damageContext);
    
    // 处理套装效果结果
    for (const result of effectResults) {
      // 处理伤害倍率
      if (result.damageMultiplier) {
        finalDamage *= result.damageMultiplier;
      }
      
      // 处理额外伤害
      if (result.extraDamage) {
        finalDamage += result.extraDamage;
        
        // 如果是无视防御的额外伤害，直接加到最终伤害
        if (result.ignoreDefense) {
          // 这里简化处理，实际应该重新计算伤害
          finalDamage += result.extraDamage;
        }
      }
      
      // 处理其他效果（如状态加成、额外回合等）
      // 可以根据需要扩展
    }
    
    // 确保伤害值为正数
    finalDamage = Math.max(1, Math.floor(finalDamage));
    
    // 应用最终伤害
    defender.takeDamage(finalDamage);

    // 触发伤害事件
    this.triggerEvent(BattleEventType.ON_DAMAGE_DEALT, {
      attackerId: attacker.instanceId,
      defenderId: defender.instanceId,
      damage: finalDamage,
      isCritical: damageResult.isCritical
    });
    
    // 触发受伤害者的被动技能机制
    this.triggerPassiveMechanics(defender, BattleEventType.ON_DAMAGE_RECEIVED, {
      attacker,
      damageResult,
      finalDamage
    });

    // 检查是否死亡
    if (defender.isDead) {
      this.triggerEvent(BattleEventType.ON_CHARACTER_DEATH, {
        characterId: defender.instanceId
      });
    }
  }
  
  /**
   * 触发被动技能机制
   */
  private triggerPassiveMechanics(character: CharacterInstance, eventType: BattleEventType, context: any): void {
    // 这里简化处理，实际应该获取角色的技能列表，检查是否有被动技能
    // 并触发相应的被动技能机制
    
    // 示例：检查角色是否有伤害反弹技能
    const registry = SkillMechanicRegistry.getInstance();
    const mechanicContext = {
      caster: character,
      targets: [],
      battleState: this.battleState,
      battleEngine: this,
      skill: null as any,
      skillId: 'UNKNOWN',
      eventType,
      ...context
    };
    
    // 这里可以根据角色的技能列表触发相应的被动机制
    // 示例：触发伤害反弹机制
    const result = registry.executeMechanic('MECH_DAMAGE_REFLECT', mechanicContext);
    if (result && result.reflectDamage) {
      // 处理伤害反弹
      const attacker = context.attacker;
      if (attacker) {
        attacker.takeDamage(result.reflectDamage);
        console.log(result.message);
      }
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
   * 触发御魂效果
   * @param character 角色实例
   * @param eventType 事件类型
   * @param context 额外上下文信息（如目标、伤害值等）
   */
  private triggerSoulEffects(character: CharacterInstance, eventType: BattleEventType, context?: any): any {
    // 结果汇总
    const results: any[] = [];
    
    // 统计套装数量
    const setCounts: Map<string, number> = new Map();
    
    // 遍历角色装备，获取每个装备的setId
    for (const equipId of character.equipment) {
      try {
        // 从装备实例ID获取装备实例
        // 这里我们通过装备服务获取装备定义，实际应该有装备实例管理系统
        // 先尝试从插件系统获取装备定义
        const equipmentDef = this.gameData?.getEquipment(equipId);
        
        if (equipmentDef && equipmentDef.setId) {
          // 使用装备定义中的setId
          const setId = equipmentDef.setId;
          setCounts.set(setId, (setCounts.get(setId) || 0) + 1);
        } else {
          // 备选方案：如果无法获取装备定义，使用装备ID的前缀作为setId
          // 这是一个兼容性处理，确保即使装备定义不存在也能正常运行
          const setId = equipId.split('_')[0] || 'DEFAULT_SET';
          setCounts.set(setId, (setCounts.get(setId) || 0) + 1);
        }
      } catch (error) {
        console.warn(`Failed to get setId for equipment ${equipId}:`, error);
        // 错误处理：使用默认值，确保系统不会崩溃
        const setId = 'DEFAULT_SET';
        setCounts.set(setId, (setCounts.get(setId) || 0) + 1);
      }
    }
    
    // 触发套装效果
    for (const [setId, count] of setCounts.entries()) {
      // 获取套装定义
      const setDef = EQUIPMENT_SETS[setId];
      if (!setDef) {
        console.warn(`Equipment set definition not found for setId: ${setId}`);
        continue;
      }
      
      // 获取该套装所有可用的效果件数，并按从大到小排序
      const availablePieces = Object.keys(setDef.effects)
        .map(Number)
        .filter(piece => piece <= count)
        .sort((a, b) => b - a);
      
      // 遍历所有已达到的效果件数，应用对应的效果
      for (const piece of availablePieces) {
        const effect = setDef.effects[piece];
        if (!effect) continue;
        
        // 如果有effectId，触发特殊效果
        if (effect.effectId) {
          try {
            const registry = SetEffectRegistry.getInstance();
            const effectContext: SetEffectContext = {
              character,
              battleState: this.battleState,
              eventType,
              battleEngine: this,
              ...context
            };
            
            // 执行效果并收集结果
            const result = registry.executeEffect(effect.effectId, effectContext);
            if (result) {
              results.push(result);
              
              // 如果有消息，打印日志
              if (result.message) {
                console.log(result.message);
              }
            }
          } catch (error) {
            console.error(`Failed to execute effect ${effect.effectId} for set ${setId}:`, error);
          }
        }
      }
    }
    
    // 返回所有效果结果
    return results;
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
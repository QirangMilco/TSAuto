import type { BattleState, CharacterInstance, PlayerAction } from '../types/battle';
import { Gambit, GambitConditionType, GambitTarget, GambitTargetType, GambitTargetStrategy } from '../types/gambit';
import { StatType } from '../types/definitions';
import type { GameDataInterface } from '../types/plugin';

/**
 * Gambit AI 评估器
 * 根据角色的 Gambit 规则和当前游戏状态，决定角色的下一步行动。
 */
export class GambitEvaluator {
  constructor(private gameData: GameDataInterface) {}

  /**
   * 根据角色的 Gambit 决定最佳行动
   */
  public decideAction(actor: CharacterInstance, battleState: BattleState, gambit: Gambit): PlayerAction | null {
    // 按优先级排序规则 (以防万一)
    const sortedRules = [...gambit.rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      // 1. 检查条件
      if (!this.evaluateCondition(rule.condition, actor, battleState)) {
        continue;
      }

      // 2. 解析目标
      const target = this.resolveTarget(rule.target, actor, battleState);
      if (!target) {
        continue;
      }

      // 3. 验证行动 (基本检查：是否存在且消耗足够)
      // 注意：更复杂的验证（冷却时间、沉默等）应在此处或 BattleEngine 中进行
      const skill = this.gameData.getSkill(rule.actionId);
      if (!skill) {
        continue;
      }

      // 检查消耗
      if (skill.cost && skill.cost.amount > 0) {
        if (battleState.resourceManager.currentResource < skill.cost.amount) {
            continue;
        }
      }

      // 规则匹配成功！
      return {
        skillId: rule.actionId,
        targetId: target.instanceId
      };
    }

    // 没有规则匹配
    return null;
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: any, actor: CharacterInstance, battleState: BattleState): boolean {
    switch (condition.type) {
      case GambitConditionType.ALWAYS:
        return true;

      case GambitConditionType.HP_BELOW:
        // 检查谁的生命值？
        // 在 v1 版本中，为了简化，HP_BELOW 默认检查 ACTOR (自身) 的状态，
        // 或者如果规则隐含了目标选择，这部分逻辑可能需要扩展。
        // 目前我们遵循：Condition 检查环境或自身，Target 负责选择目标。
        // 例如："治疗生命值 < 50% 的队友"，可以通过 TargetStrategy.LOWEST_HP_PERCENT 配合 ALWAYS 条件来实现。
        
        const threshold = condition.value || 1;
        return (actor.currentHp / actor.maxHp) < threshold;

      case GambitConditionType.HP_ABOVE:
        const thresholdAbove = condition.value || 0;
        return (actor.currentHp / actor.maxHp) > thresholdAbove;

      case GambitConditionType.MP_BELOW:
         // 使用全局资源 (类似阴阳师鬼火)
         return battleState.resourceManager.currentResource < (condition.value || 0);
         
      case GambitConditionType.ENEMY_COUNT_ABOVE:
         const enemies = battleState.enemies.filter(e => !e.isDead);
         return enemies.length > (condition.value || 0);

      default:
        return true;
    }
  }

  /**
   * 根据策略查找最佳目标
   */
  private resolveTarget(targetDef: GambitTarget, actor: CharacterInstance, battleState: BattleState): CharacterInstance | null {
    let candidates: CharacterInstance[] = [];

    // 1. 根据类型筛选候选者
    if (targetDef.type === GambitTargetType.SELF) {
      return actor;
    } else if (targetDef.type === GambitTargetType.ALLY) {
      // 如果 Actor 是玩家，Ally 就是 Players；如果 Actor 是敌人，Ally 就是 Enemies
      const isPlayer = battleState.players.some(p => p.instanceId === actor.instanceId);
      candidates = isPlayer ? battleState.players : battleState.enemies;
    } else if (targetDef.type === GambitTargetType.ENEMY) {
      const isPlayer = battleState.players.some(p => p.instanceId === actor.instanceId);
      candidates = isPlayer ? battleState.enemies : battleState.players;
    }

    // 过滤死亡单位 (除非策略明确针对死者，如复活 - 稍后添加)
    candidates = candidates.filter(c => !c.isDead);

    if (candidates.length === 0) return null;

    // 2. 应用选择策略
    switch (targetDef.strategy) {
      case GambitTargetStrategy.SELF:
        return actor;

      case GambitTargetStrategy.RANDOM:
      case GambitTargetStrategy.ANY:
        return candidates[Math.floor(Math.random() * candidates.length)];

      case GambitTargetStrategy.LOWEST_HP_PERCENT:
        return candidates.reduce((prev, curr) => {
          return (curr.currentHp / curr.maxHp) < (prev.currentHp / prev.maxHp) ? curr : prev;
        });

      case GambitTargetStrategy.HIGHEST_ATK:
        return candidates.reduce((prev, curr) => {
           const prevAtk = prev.currentStats[StatType.ATK] || 0;
           const currAtk = curr.currentStats[StatType.ATK] || 0;
           return currAtk > prevAtk ? curr : prev;
        });

      default:
        return candidates[0];
    }
  }
}

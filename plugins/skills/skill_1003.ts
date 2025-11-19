/**
 * 风卷残云 - 终极技能插件
 */
import { EffectType, TargetType } from '../../src/core/types/definitions';

export default {
  id: "SKILL_1003",
  name: "风卷残云",
  
  cost: {
    type: "BATTLE_RESOURCE",
    amount: 100 // 消耗100点资源
  },
  
  activeEffects: [
    {
      type: EffectType.DAMAGE,
      target: TargetType.ALL_ENEMIES,
      damageMultiplier: 1.5 // 对所有敌人造成150%攻击力伤害
    },
    {
      type: EffectType.MODIFY_ACTION_BAR,
      target: TargetType.ALL_ENEMIES,
      amount: -0.2 // 推条20%
    },
    {
      type: EffectType.TRIGGER_PSEUDO_TURN,
      target: TargetType.SELF,
      pseudoTurnSkillId: "SKILL_1001" // 触发伪回合，可以再次行动
    }
  ],
  
  description: "释放强大的风元素力量，对所有敌人造成150%攻击力的伤害，降低他们20%行动条，并立即获得一次行动机会。"
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "终极技能插件"
};
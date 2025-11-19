/**
 * 风切 - 普通攻击技能插件
 */
import { EffectType, TargetType, BattleEventType } from '../../src/core/types/definitions';

export default {
  id: "SKILL_1001",
  name: "风切",
  
  cost: {
    type: "BATTLE_RESOURCE",
    amount: 0 // 普通攻击无消耗
  },
  
  activeEffects: [
    {
      type: EffectType.DAMAGE,
      target: TargetType.TARGET,
      damageMultiplier: 1.0 // 100%攻击力伤害
    }
  ],
  
  passiveListeners: [
    {
      event: BattleEventType.ON_SKILL_USED,
      effects: [
        {
          type: EffectType.MODIFY_ACTION_BAR,
          target: TargetType.SELF,
          amount: 0.1 // 使用后拉条10%
        }
      ]
    }
  ],
  
  description: "基础的风元素攻击，对单个目标造成100%攻击力的伤害，并获得10%行动条提升。"
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "基础攻击技能插件"
};
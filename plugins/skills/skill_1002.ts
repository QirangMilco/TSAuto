/**
 * 风之屏障 - 防御技能插件
 */
import { EffectType, TargetType, BattleEventType } from '../../core/types/definitions';

export default {
  id: "SKILL_1002",
  name: "风之屏障",
  
  cost: {
    type: "BATTLE_RESOURCE",
    amount: 25 // 消耗25点资源
  },
  
  activeEffects: [
    {
      type: EffectType.APPLY_STATUS,
      target: TargetType.SELF,
      statusId: "STATUS_1001", // 施加风盾状态
      duration: 2 // 持续2回合
    },
    {
      type: EffectType.HEAL,
      target: TargetType.SELF,
      healAmount: 200 // 基础治疗200点
    }
  ],
  
  passiveListeners: [
    {
      event: BattleEventType.ON_RECEIVE_DAMAGE,
      effects: [
        {
          type: EffectType.MODIFY_RESOURCE,
          target: TargetType.SELF,
          amount: 10 // 受到伤害时获得10点资源
        }
      ]
    }
  ],
  
  description: "创造风之屏障保护自身，施加风盾状态持续2回合，并恢复200点生命值。受到伤害时会获得10点资源。"
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "防御技能插件"
};
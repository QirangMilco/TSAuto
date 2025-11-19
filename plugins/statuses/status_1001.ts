/**
 * 风盾 - 状态插件
 */
import { BuffType, StatType, EffectType, TargetType } from '../../src/core/types/definitions';

export default {
  id: "STATUS_1001",
  name: "风盾",
  type: BuffType.DEF_UP,
  
  duration: 2, // 持续2回合
  
  // 状态效果
  statModifiers: {
    [StatType.DEF_P]: 30, // 防御提升30%
    [StatType.ATK_P]: 10  // 攻击提升10%
  },
  
  // 特殊行为
  onTurnStart: [
    {
      type: EffectType.MODIFY_ACTION_BAR,
      target: TargetType.SELF,
      amount: 0.1 // 回合开始时拉条10%
    }
  ],
  
  onReceiveDamage: [
    {
      type: EffectType.MODIFY_RESOURCE,
      target: TargetType.SELF,
      amount: 5 // 受到伤害时获得5点资源
    }
  ]
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "防御增益状态插件"
};
import { StatType } from '../../../src/core/types/definitions';
import type { EquipmentSetDefinition } from '../../../src/core/types/definitions';

/**
 * 破势套装插件
 */
export default <EquipmentSetDefinition>{
  id: "PO_SHI",
  name: "破势",
  
  // 2件套: 暴击 +15%
  piece2: {
    stat: StatType.CRIT,
    value: 15
  },
  
  // 4件套: 造成额外伤害 (机制逻辑在 Effect 系统中实现，这里只定义 ID)
  piece4: {
    description: "对生命值高于70%的单位造成额外40%伤害",
    effectId: "EFF_POSHI_BONUS"
  }
};

export const metadata = {
  version: "1.0.0",
  author: "System",
  description: "暴击型输出套装"
};
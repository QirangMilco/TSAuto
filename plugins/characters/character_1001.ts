/**
 * 风元素战士 - 角色插件
 */

export default {
  id: "CHAR_1001",
  name: "风语者 艾琳",
  
  assets: {
    avatar: "/assets/characters/avatar_char_1001.png",
    portrait: "/assets/characters/portrait_char_1001.png"
  },
  
  growthValues: {
    hp: 1000,     // 生命成长值
    atk: 200,     // 攻击成长值
    def: 150,     // 防御成长值
    spd: 120,     // 速度
    crit: 0.05,   // 暴击率成长
    critDmg: 0.5  // 暴击伤害成长
  },
  
  skills: ["SKILL_1001", "SKILL_1002", "SKILL_1003"] // 技能ID数组
};

// 插件元数据
export const metadata = {
  version: "1.0.0",
  author: "TSAuto Team",
  description: "风元素战士角色插件"
};
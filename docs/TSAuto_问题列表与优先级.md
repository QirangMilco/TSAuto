# TSAuto 问题列表与优先级 (v1.7 更新版)

**最后更新时间**：2025-12-05
**更新说明**：**P2-13 速度计算与 Buff 叠加问题** 已修复。`StatsCalculator` 现在实现了基于 Group 的 Buff 叠加规则（同组取最大，异组叠加），`TurnManager` 也已简化为直接从 `currentStats.SPD` 读取速度，消除了计算逻辑冗余。

## 优先级说明
- **P0**：紧急，严重阻碍核心战斗逻辑正确运行，必须立即修复
- **P1**：高优先级，影响核心玩法体验或架构可维护性
- **P2**：中优先级，影响系统稳定性、平衡性或扩展性
- **P3**：低优先级，功能缺失或优化建议

---

## 问题列表

### P0 - 紧急问题 (Must Fix Immediately)
(所有 P0 问题已修复 ✅)

### P1 - 高优先级问题 (Core Experience)
(所有 P1 问题已修复 ✅)

### P2 - 中优先级问题 (Stability & Polish)

10.  **资源（鬼火）系统对伪回合处理不当**
    -   **修复状态**：已修复 ✅

11. **御魂随机数分布算法未使用 (Irwin-Hall)**
    -   **修复状态**：已修复 ✅

12. **DamageCalculator 计算逻辑精度问题**
    -   **修复状态**：已修复 ✅

13. **TurnManager 速度计算逻辑简单**
    -   **修复状态**：已修复 ✅
    -   **验证**：
        -   `StatsCalculator` 实现了分组堆叠逻辑 (`calculateStatusEffectsBonus`)。
        -   `StatusDefinition` 和 `CharacterStatus` 增加了 `group` 字段。
        -   `TurnManager` 移除了 `getSpeedBuffs` 方法，不再重复计算速度加成，而是直接使用计算好的面板速度。
        -   单元测试通过。

### P3 - 低优先级问题 / 待定 (Feature Missing)

14. **灵玉五行系统实现与文档不符** (降级为配置调整)
15. **缺少 Roguelike 无尽之塔玩法** (Feature)
16. **缺少御魂重铸与保底系统** (Feature)
17. **目录结构优化** (Refactor)

---

## 下一步工作建议

1.  **P3 Features**: 核心机制已稳定，建议开始实现 **Roguelike 玩法**（地图生成、事件节点）。
2.  **Content**: 补充更多角色和技能数据，验证 Gambit 系统的实际表现。
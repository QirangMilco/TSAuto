# TSAuto 问题列表与优先级 (v1.1 更新版)

**最后更新时间**：2025-12-03
**更新说明**：基于代码库深度审查，新增了行动条重置错误、逻辑表现未分离等关键技术债，并调整了部分问题的优先级。

## 优先级说明
- **P0**：紧急，严重阻碍核心战斗逻辑正确运行，必须立即修复
- **P1**：高优先级，影响核心玩法体验或架构可维护性
- **P2**：中优先级，影响系统稳定性、平衡性或扩展性
- **P3**：低优先级，功能缺失或优化建议

---

## 问题列表

### P0 - 紧急问题 (Must Fix Immediately)

1.  **缺少统一的属性计算管道 (CharacterStats Pipeline)**
    -   **原级**：P2 -> **升级为 P0**
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   创建了 `StatsCalculator` 服务，提供统一的 `getFinalStat(unit, StatType)` 接口
        -   实现了 `recalculateAllStats` 和 `applyStatBoosts` 方法，用于重新计算和应用属性加成
        -   更新了 `BattleEngine` 中的 `processStatusEffects` 方法，实际应用 Buff 数值而非仅打印日志
    -   **影响**：战斗系统的地基已建立。Buff 加攻、御魂套装加成、五行加成可以正确叠加生效，伤害计算和速度计算基于正确数值。

2.  **行动条重置逻辑错误 (CTB Mechanics)**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/battle/TurnManager.ts:153` (`resetActionBar`)
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   修改了 `resetActionBar` 方法，将直接重置为0改为减去全场一速值：`position -= globalFastestSpeed`
        -   保留了角色行动条溢出的部分，符合CTB战斗机制
    -   **问题**：角色行动后，行动条位置直接被重置为 0 (`character.actionBarPosition = 0`)。
    -   **正确逻辑**：在类阴阳师的 CTB 战斗中，角色跑条溢出（如跑到 120%）的部分应该保留。重置逻辑应为 `position -= MAX_ACTION_BAR`。
    -   **影响**：严重损害高速度角色和拉条技能的收益，导致战斗乱速。

3.  **BattleEngine 战斗结果处理逻辑中断**
    -   **原级**：P0
    -   **位置**：`src/core/battle/BattleEngine.ts:682`
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   在 `BattleEventType` 枚举中添加了 `ON_BATTLE_END` 事件类型
        -   修改了 `checkBattleResult` 方法，在战斗结束时触发 `ON_BATTLE_END` 事件，传递战斗结果和战斗ID
        -   仅在战斗真正结束时（胜负已分时）触发事件，避免不必要的通知
    -   **问题**：`checkBattleResult` 在设置结果后仅将 `isRunning` 设为 `false`，但没有通过 Promise 或回调通知 UI 层战斗已结束。
    -   **影响**：UI 层无法感知战斗结束，无法弹出结算画面，游戏流程卡死。

4.  **状态效果属性加成未实际应用**
    -   **原级**：P0
    -   **位置**：`src/core/battle/BattleEngine.ts:553` (`processStatusEffects`)
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   修复了 `StatsCalculator` 中的 `calculateStatusEffectsBonus` 方法，使其能够正确根据状态类型计算属性加成
        -   更新了 `processStatusEffects` 方法，添加了使用 `StatsCalculator.recalculateAllStats` 重新计算所有属性的逻辑
        -   修复了 `processStatusEffects` 方法中错误使用 `this.statsCalculator` 的问题，改为直接使用 `StatsCalculator` 静态调用
        -   优化了状态效果处理逻辑，确保在状态过期移除后再次重新计算属性
        -   添加了生命值按比例调整的逻辑，确保状态移除后生命值正确更新
    -   **影响**：所有 Buff/Debuff (如攻击提升、防御降低) 现在可以正确生效，属性加成会实时反映在角色面板上。

### P1 - 高优先级问题 (Core Experience)

5.  **BattleEngine 包含硬编码 Sleep (逻辑表现未分离)**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/battle/BattleEngine.ts` (多处调用 `await this.sleep`)
    -   **问题**：核心战斗循环中硬编码了 `this.battleSpeed` 的等待时间。
    -   **影响**：
        -   违背了文档中“UI-Logic Separation”的架构原则。
        -   无法实现“跳过战斗”、“极速运算”或“后端验算”功能。
        -   导致单元测试运行缓慢。

5.  **BattleEngine 包含硬编码 Sleep (逻辑表现未分离)**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/battle/BattleEngine.ts` (多处调用 `await this.sleep`)
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   删除了 `sleep` 方法的定义
        -   移除了所有 `await this.sleep` 调用，包括开场动画、视觉停顿、AI思考时间、施法前后摇等
        -   删除了 `battleSpeed` 属性，不再依赖硬编码的动画延迟
    -   **影响**：
        -   实现了真正的逻辑-表现分离，符合架构原则
        -   战斗引擎可以以最大速度运行，支持"跳过战斗"和"后端验算"功能
        -   单元测试运行速度显著提升
        -   为后续实现不同战斗速度和战斗跳过功能打下基础

6.  **StatsCalculator 缺少状态定义和装备实例管理**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/services/StatsCalculator.ts`
    -   **修复状态**：已修复 ✅
    -   **修复内容**：
        -   添加了 `setGameData` 静态方法，用于设置游戏数据访问接口
        -   更新了 `calculateStatusEffectsBonus` 方法，使其能够从 `gameData` 中获取完整的状态定义
        -   优化了状态效果加成计算逻辑，优先使用状态定义中的 `statModifiers`
        -   添加了装备加成计算的基础框架，为后续实现装备实例管理打下基础
        -   在 `BattleEngine` 构造函数中设置 `StatsCalculator` 的 `gameData`
    -   **影响**：
        -   状态效果属性加成能够正确从状态定义中获取，提高了系统的扩展性和灵活性
        -   为后续实现装备实例管理和装备加成计算打下了基础
        -   统一了属性计算的逻辑，使系统更加模块化和可维护

7.  **BattleEngine 回合数 (Round) 计算定义错误**
    -   **原级**：P1
    -   **位置**：`src/core/battle/BattleEngine.ts:168`
    -   **问题**：每有一个角色行动，`round` 就 +1。这实际上是 "Action Count" 而非 "Round"。
    -   **影响**：回合数增长极快，导致持续 N 回合的 Buff/状态瞬间过期。

8.  **缺少 Gambit 自定义AI系统**
    -   **原级**：P1
    -   **问题**：缺少文档中列为核心玩法的 Gambit 系统，目前仅实现了随机普攻的 AI。
    -   **影响**：无法实现核心策略玩法，AI 行为不可控。

9.  **插件加载器路径脆弱**
    -   **原级**：P1
    -   **位置**：`src/core/plugin/PluginLoader.ts:180`
    -   **问题**：使用了 `../../../../plugins/` 这种极度脆弱的相对路径。
    -   **影响**：项目目录结构稍有变动，插件加载即失效，扩展性差。

### P2 - 中优先级问题 (Stability & Polish)

10.  **资源（鬼火）系统对伪回合处理不当**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/battle/BattleEngine.ts` (battleLoop)
    -   **问题**：调用 `resourceManager.advance(1, TurnType.NORMAL)` 时硬编码了 `NORMAL` 类型。
    -   **影响**：伪回合（额外行动）也会推进鬼火条回复鬼火，破坏了“再动”类技能的平衡性。

11. **御魂随机数分布算法隐患**
    -   **来源**：新增 (Code Review)
    -   **位置**：`src/core/services/EquipmentService.ts` (`rollIrwinHall`)
    -   **问题**：使用 Irwin-Hall 算法生成副属性时，未对结果进行 Clamp (钳制) 处理。
    -   **影响**：极低概率下可能生成超出配置范围的数值，存在数据一致性隐患。

12. **DamageCalculator 计算逻辑精度问题**
    -   **原级**：P2
    -   **位置**：`src/core/battle/DamageCalculator.ts`
    -   **问题**：使用 `Math.round` 而非 `Math.floor`，且属性计算分散。
    -   **影响**：伤害数值与策划公式存在偏差，可能导致“剩 1 血不死”等体验问题。

13. **TurnManager 速度计算逻辑简单**
    -   **原级**：P2
    -   **位置**：`src/core/battle/TurnManager.ts`
    -   **问题**：`getSpeedBuffs` 仅简单的遍历查找，未处理同类 Buff 叠加/互斥规则。

### P3 - 低优先级问题 / 待定 (Feature Missing)

14. **灵玉五行系统实现与文档不符**
    -   **原级**：P2 -> **降级 P3**
    -   **说明**：代码审查发现 `FiveElementsService.ts` 实际上已经较好地实现了文档中的“压力/流转”模型（包含 Suppressed/Starved 状态）。
    -   **建议**：仅需微调数值配置，无需重构。

15. **缺少 Roguelike 无尽之塔玩法**
    -   需等待核心战斗系统稳定后再开发。

16. **缺少御魂重铸与保底系统**
    -   属于养成外围系统，优先级较低。

17. **目录结构优化**
    -   `src/ui` 和 `src/ui-react` 并存，结构稍显混乱，建议后期统一整理。

---

## 建议修复顺序

1.  **Phase 1 (Core Fixes)**: 修复 P0 问题 (1, 2, 3, 4)。这是让战斗系统“能跑且数值正确”的前提。
2.  **Phase 2 (Logic Polish)**: 修复 P1 问题 (5, 6)。移除 Sleep 实现真正的逻辑分离，修正回合计数。
3.  **Phase 3 (Feature Impl)**: 实现 P1 问题 (7, 8)。实装 Gambit AI 和健壮的插件加载。
4.  **Phase 4 (Refinement)**: 处理 P2 问题。优化伪回合资源逻辑和随机数算法。
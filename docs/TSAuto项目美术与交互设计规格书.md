# TSAuto 项目美术与交互设计规格书 (v2.0)

**版本**：2.0 (Art & UI Overhaul)
**核心变动**：从传统的“6格御魂”重构为“5格五行灵玉”；确立“新中式赛璐璐”美术风格。

-----

## 1\. 美术风格总纲 (Art Direction)

### 1.1 核心基调

  * **风格定义**：**新中式赛璐璐 (Neo-Chinese Cel-Shaded)** + **柔和二次元 (Soft Anime)**。
  * **视觉关键词**：通透玉质 (Translucent Jade)、悬浮法器 (Floating Artifacts)、流苏与结绳 (Tassels)、粉彩光影 (Pastel Lighting)。
  * **禁忌**：拒绝科幻/赛博朋克元素，拒绝厚重阴暗的传统水墨，拒绝廉价手游的塑料质感。

### 1.2 颜色规范 (Color Palette)

采用低饱和度的高级色系，对应五行属性：

  * **金 (Metal)**：白金 / 辉光黄 (Platinum Gold)
  * **木 (Wood)**：祖母绿 / 薄荷绿 (Emerald / Mint)
  * **水 (Water)**：天青色 / 湛蓝 (Azure Blue)
  * **火 (Fire)**：绯红 / 珊瑚红 (Crimson / Coral)
  * **土 (Earth)**：琥珀色 / 赭石 (Amber / Ocher)

-----

## 2\. 核心系统重构：五行灵玉 (The Five Spirit Jades)

基于《TSAuto》的策略构筑核心，将装备系统重构为五行体系。

### 2.1 槽位定义

  * **数量**：5个（对应五行）。
  * **布局逻辑**：
      * **横屏 (PC)**：围绕角色的**正五边形**阵列。
      * **竖屏 (Mobile)**：位于屏幕下方的**半弧形**阵列（适应拇指操作）。
  * **视觉表现**：**悬浮流苏底座**。槽位不是死板的格子，而是漂浮在角色身边的玉石底座，带有随风飘动的流苏和光晕拖尾。

### 2.2 属性图标映射 (Iconography)

为了直观表达属性，采用具象化的中式意象：

  * **攻击 (Attack)**：**宝剑 (Chinese Jian)**
  * **生命 (HP)**：**药葫芦 (Wu Lou Gourd)**
  * **防御 (Def)**：**兽面吞头肩甲 (General Armor)** / **金钟罩 (Golden Bell)**
  * **速度 (Spd)**：**流云纹 (Flowing Cloud)**
  * **暴击 (Crit)**：**金色闪电 (Lightning)**
  * **爆伤 (Cdmg)**：**爆炸纹 (Explosion)**
  * **抵抗 (Res)**：**金钟罩/屏障 (Barrier)**
  * **命中 (Hit)**：**靶心 (Bullseye)**

-----

## 3\. 界面交互设计 (UI/UX Design)

### 3.1 主界面：云端庭院 (Scene-based Menu)

  * **设计理念**：去UI化。取消传统底部导航栏，采用“场景交互”。
  * **场景描述**：漂浮在云海之上的仙岛庭院，视野开阔。

### 3.2 角色详情页 (Character Detail)

  * **核心布局**：
      * **背景**：纯净的立绘展示区。
      * **五行命盘**：5个悬浮槽位环绕角色，槽位之间有隐约的灵力连线。
  * **Gambit入口**：显眼的“悟道台”按钮，引导玩家进行AI配置。

此页面采用**悬浮式HUD**设计，保持背景通透，不使用全屏遮挡底板。

#### 3.2.1 导航交互 (Navigation)
* **角色切换 (左侧栏)**：
    * **PC端**：屏幕左侧常驻竖向**“画卷/名牌列表”**。未选中角色为半透明玉牌，选中角色高亮放大。
    * **移动端**：屏幕顶部横向滑动列表，或收纳在左下角的“列表按钮”中。
* **视图切换 (右侧栏)**：
    * 位置：屏幕右侧边缘。
    * 样式：悬浮的**法器印章**。
    * **按钮A [玉]**：切换至灵玉配置模式（默认）。
    * **按钮B [技]**：切换至技能升级模式。
    * **按钮C [道]**：切换至详细属性/故事模式。

#### 3.2.2 视图状态 (View States)
* **状态一：灵玉视图 (Jade View)**
    * 显示围绕角色的**五行悬浮槽位**。
    * 点击槽位弹出左侧/底部的装备选择面板。
* **状态二：技能视图 (Skill View)**
    * 五行槽位隐去（淡出）。
    * 角色脚下或侧边浮现 **3 个圆形技能图标**（普攻/被动/大招）。
    * 点击图标显示技能详情与升级按钮。
* **公共入口**：右下角始终保留**“悟道台 (Gambit AI)”**的大按钮。

### 3.3 战斗界面 (Battle HUD)

  * **行动条**：**日晷/罗盘**样式的圆形进度条，头像在圆环上转动。
  * **战术反馈**：屏幕一侧设置\*\*“战术日志浮窗”\*\*。当角色自动释放技能时，高亮显示触发该技能的Gambit逻辑（如：`[HP<30%] -> [治疗]`），强化策略成就感。
  * **技能图标**：圆形墨迹或灵珠样式。冷却时呈灰色石头质感，就绪时呈发光玉石质感。

### 3.4 悟道台 (Gambit Editor)

  * **视觉风格**：**竹简与符箓**。
      * **条件块**：青色竹简样式。
      * **动作块**：朱砂红令牌样式。
      * **连线**：金色的灵力流光。

### 3.5 无尽之塔 (Roguelike)

  * **地图结构**：**登天梯**（纵向卷轴）。
  * **节点图标**：
      * 战斗：妖气团（黑雾透红）。
      * 精英：鬼面。
      * 奇遇：问号灯笼。
      * 休息：莲花台。

-----

## 4\. 美术资产生成指南 (Asset Generation)

使用 Midjourney (Niji 6) 或 Stable Diffusion 生成资产时的核心指令集。

### 4.1 通用风格词 (Style LoRA)

> `Neo-Chinese fantasy style, soft anime style, cel shaded, pastel color palette, translucent jade texture, clean vector illustration, white background --niji 6`

### 4.2 关键资产 Prompt 备忘

  * **五行悬浮槽位 (Sprite Sheet)**：

    > `Game UI assets, sprite sheet, set of 5 floating equipment slots, decorative jade frame with long hanging tassel and magical trail, 5 distinct color variations (Platinum Gold, Emerald Green, Azure Blue, Crimson Red, Amber Brown), consistent shape, empty center`

  * **基础UI图集 (Base Atlas)**：

    > `Game UI icon set, 4x4 grid... [Row 1] Gold coin with square hole, Glowing Spirit Stone Crystal... [Row 2] Attack Sword, HP Gourd, Def Armor, Speed Cloud...`

  * **主界面背景**：

    > `Anime scenery, environmental concept art, mystical floating island garden... --no text, ui, buttons`

-----

## 5\. 技术实现建议 (Dev Implementation)

  * **图集处理 (Sprite Sheet)**：所有小图标（UI\_Base\_Atlas）生成为 4x4 网格图、
  * **悬浮动效**：不要让槽位静止。使用一些前端的技术实现呼吸浮动效果
  * **布局适配**：
      * 使用 React/Vue 组件判断 `isMobile`。
      * PC端渲染为 `position: absolute` 的五边形坐标。
      * 移动端渲染为 Flex/Grid 的底部弧形布局。
  * **逻辑与表现分离**：继续遵循《TSAuto设计》原则，核心战斗逻辑（Core Logic）不依赖任何 UI 图片，仅输出数据状态。
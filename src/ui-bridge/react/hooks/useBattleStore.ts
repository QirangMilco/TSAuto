import { create } from 'zustand';
import { ReactAdapter } from '../../../ui/adapters/ReactAdapter';
import { PluginManager } from '../../../core/plugin/PluginManager';

// 1. 初始化核心依赖 (单例模式)
// 在真实应用中，这些可能在 main.tsx 或单独的 Context 中初始化
const pluginManager = new PluginManager();
const reactAdapter = new ReactAdapter(pluginManager);

// 2. 导出可以直接使用的 Hook
// ReactAdapter 内部已经创建了 zustand store，我们直接暴露它
export const useBattleStore = reactAdapter.useBattleStore();

// 3. 导出 adapter 实例，以便我们在 App.tsx 中调用它的方法（如 updateState）
export const battleAdapter = reactAdapter;
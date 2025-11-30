import React from 'react';
import SmartImage from './SmartImage';

// 主页组件，支持横屏和竖屏布局
const HomePage: React.FC = () => {
  // Mock Data
  const playerData = {
    name: "渡劫期",
    level: 60,
    resources: {
      coins: "12w",
      jade: 800,
      stamina: "50"
    }
  };

  // 横屏布局
  const DesktopLayout = () => (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 font-sans text-white select-none">
      {/* ================= BACKGROUND LAYER ================= */}
      <div className="absolute inset-0 z-0">
        {/* PC/Landscape Background */}
        <SmartImage width={1920} height={1080} alt="云端庭院背景" imageKey="background-cloud-courtyard" className="w-full h-full opacity-80" />
        
        {/* Atmospheric Overlay (Jade/Cloud tint) */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-slate-900/10 pointer-events-none" />
      </div>

      {/* ================= TOP HUD ================= */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
        {/* Player Info (Left) */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2 pr-6 rounded-full border border-amber-500/30 shadow-lg">
          <div className="relative">
            <SmartImage width={80} height={80} alt="角色头像" imageKey="character-avatar" className="w-16 h-16 border-2 border-amber-400 rounded-full" />
            <div className="absolute -bottom-1 -right-1 bg-amber-600 text-xs px-2 py-0.5 rounded-full border border-white/20">
              Lv.{playerData.level}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-amber-100 font-bold text-lg tracking-widest">{playerData.name}</span>
            <div className="w-24 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-[80%] bg-gradient-to-r from-amber-600 to-amber-300" />
            </div>
          </div>
        </div>

        {/* Resources & Settings (Right) */}
        <div className="flex flex-col items-end gap-2">
          {/* Resource Bar */}
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg">
            {/* Coins */}
            <div className="flex items-center gap-2">
              <SmartImage width={40} height={40} alt="下品灵石图标" imageKey="resource-low-grade" className="w-6 h-6 rounded-full" />
              <span className="text-slate-200 font-mono text-sm">{playerData.resources.coins}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            {/* Jade */}
            <div className="flex items-center gap-2">
              <SmartImage width={40} height={40} alt="中品灵石图标" imageKey="resource-middle-grade" className="w-6 h-6 rounded-full" />
              <span className="text-emerald-300 font-mono text-sm">{playerData.resources.jade}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            {/* Stamina */}
            <div className="flex items-center gap-2">
              <SmartImage width={40} height={40} alt="上品灵石图标" imageKey="resource-high-grade" className="w-6 h-6 rounded-full" />
              <span className="text-rose-300 font-mono text-sm">{playerData.resources.stamina}</span>
            </div>
          </div>

          {/* Settings Icon */}
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur transition-all">
            <SmartImage width={24} height={24} alt="设置按钮图标" imageKey="button-settings" className="w-6 h-6 text-slate-300" />
          </button>
        </div>
      </header>

      {/* ================= CHARACTER STAGE (CENTER) ================= */}
      <main className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start pl-32 pt-0">
        <div className="relative w-[45%] h-[85%] animate-fade-in-up">
          <SmartImage 
            width={800} 
            height={1200} 
            alt="角色立绘" 
            imageKey="character-portrait" 
            className="w-full h-full object-contain drop-shadow-2xl pointer-events-auto hover:scale-[1.02] transition-transform duration-500" 
          />
          {/* Interaction Trigger Area */}
          <div className="absolute inset-0 cursor-pointer" title="点击互动" />
        </div>
      </main>

      {/* ================= RIGHT SIDE MENU (FLOATING) ================= */}
      <aside className="absolute z-20 right-4 top-32 flex flex-col items-end gap-4 w-48 pointer-events-auto">
        {/* 1. Gambit / Daoist Platform (Highlight Feature) */}
        <div className="group relative w-full flex justify-end">
          <button className="relative w-48 h-20 bg-indigo-900/90 hover:bg-indigo-800 border-2 border-indigo-400/50 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-between px-4 transition-all transform group-hover:-translate-x-2">
            <div className="flex flex-col items-start">
              <span className="text-indigo-100 font-bold text-xl">悟道台</span>
              <span className="text-indigo-300 text-xs">AI 策略配置</span>
            </div>
            <SmartImage width={64} height={64} alt="悟道台图标" imageKey="button-wudao" className="w-12 h-12 opacity-80 rounded-lg" />
          </button>
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-white animate-pulse" />
        </div>

        {/* 2. Shikigami Record */}
        <button className="w-44 h-16 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-4 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold">仙神录</span>
          <SmartImage width={50} height={50} alt="仙神录图标" imageKey="button-xianshen" className="w-8 h-8 opacity-70" />
        </button>

        {/* 3. Storage Bag */}
        <button className="w-44 h-16 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-4 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold">储物袋</span>
          <SmartImage width={50} height={50} alt="储物袋图标" imageKey="button-storage" className="w-8 h-8 opacity-70" />
        </button>

        {/* 4. Heavenly Pavilion (Shop/Gacha) */}
        <button className="w-44 h-16 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-4 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold">天机阁</span>
          <SmartImage width={50} height={50} alt="天机阁图标" imageKey="button-tianji" className="w-8 h-8 opacity-70" />
        </button>
      </aside>

      {/* ================= BOTTOM BAR (UTILS) ================= */}
      <div className="absolute bottom-6 left-6 z-20 flex gap-6 pointer-events-auto">
        {[
          { label: '图鉴', iconKey: 'button-encyclopedia' },
          { label: '坊市', iconKey: 'button-market' },
          { label: '成就', iconKey: 'button-achievements' },
        ].map((item, idx) => (
          <button key={idx} className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-white/10 group-hover:bg-amber-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm transition-all group-hover:scale-110">
              <SmartImage width={40} height={40} alt={item.label} imageKey={item.iconKey} className="w-6 h-6 rounded-full" />
            </div>
            <span className="text-xs text-slate-300 shadow-black drop-shadow-md">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ================= BATTLE BUTTON (TRIAL) ================= */}
      <div className="absolute bottom-8 right-6 z-30 pointer-events-auto">
        <button className="group relative w-32 h-32 rounded-full bg-gradient-to-br from-red-900 to-red-700 border-4 border-amber-500/50 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95">
          {/* Inner Ring */}
          <div className="absolute inset-2 rounded-full border border-red-400/30 border-dashed animate-spin-slow" />
          
          <SmartImage width={64} height={64} alt="试炼装饰：火焰" imageKey="decoration-flame" className="w-14 h-14 mb-1 rounded-full" />
          <span className="text-white font-bold text-2xl drop-shadow-md tracking-widest group-hover:text-amber-200">试 炼</span>
          
          {/* Decorative Particles (Static representation) */}
          <div className="absolute -top-2 -right-2 text-xl">✨</div>
        </button>
      </div>

      {/* ================= DEBUG / INFO OVERLAY ================= */}
      <div className="absolute bottom-2 right-2 text-[10px] text-white/20 pointer-events-none">
         TSAuto v0.1.0 • Neo-Chinese Style • React Preview
      </div>
    </div>
  );

  // 竖屏布局
  const MobileLayout = () => (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 font-sans text-white select-none">
      {/* ================= BACKGROUND LAYER ================= */}
      <div className="absolute inset-0 z-0">
        {/* Mobile/Portrait Background */}
        <SmartImage width={1080} height={1920} alt="云端庭院背景" imageKey="background-cloud-courtyard" className="w-full h-full opacity-80" />
        
        {/* Atmospheric Overlay (Jade/Cloud tint) */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-slate-900/10 pointer-events-none" />
      </div>

      {/* ================= TOP HUD ================= */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
        {/* Player Info (Left) */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2 pr-6 rounded-full border border-amber-500/30 shadow-lg">
          <div className="relative">
            <SmartImage width={60} height={60} alt="角色头像" imageKey="character-avatar" className="w-12 h-12 border-2 border-amber-400 rounded-full" />
            <div className="absolute -bottom-1 -right-1 bg-amber-600 text-xs px-2 py-0.5 rounded-full border border-white/20">
              Lv.{playerData.level}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-amber-100 font-bold text-base tracking-widest">{playerData.name}</span>
            <div className="w-16 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-[80%] bg-gradient-to-r from-amber-600 to-amber-300" />
            </div>
          </div>
        </div>

        {/* Resources & Settings (Right) */}
        <div className="flex flex-col items-end gap-2">
          {/* Resource Bar */}
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
            {/* Coins */}
            <div className="flex items-center gap-1">
              <SmartImage width={30} height={30} alt="下品灵石图标" imageKey="resource-low-grade" className="w-5 h-5 rounded-full" />
              <span className="text-slate-200 font-mono text-xs">{playerData.resources.coins}</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            {/* Jade */}
            <div className="flex items-center gap-1">
              <SmartImage width={30} height={30} alt="中品灵石图标" imageKey="resource-middle-grade" className="w-5 h-5 rounded-full" />
              <span className="text-emerald-300 font-mono text-xs">{playerData.resources.jade}</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            {/* Stamina */}
            <div className="flex items-center gap-1">
              <SmartImage width={30} height={30} alt="上品灵石图标" imageKey="resource-high-grade" className="w-5 h-5 rounded-full" />
              <span className="text-rose-300 font-mono text-xs">{playerData.resources.stamina}</span>
            </div>
          </div>

          {/* Settings Icon */}
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur transition-all">
            <SmartImage width={20} height={20} alt="设置按钮图标" imageKey="button-settings" className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* ================= CHARACTER STAGE (CENTER) ================= */}
      <main className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center pt-20">
        <div className="relative w-[90%] h-[70%] animate-fade-in-up">
          <SmartImage 
            width={600} 
            height={900} 
            alt="角色立绘" 
            imageKey="character-portrait" 
            className="w-full h-full object-contain drop-shadow-2xl pointer-events-auto hover:scale-[1.02] transition-transform duration-500" 
          />
          {/* Interaction Trigger Area */}
          <div className="absolute inset-0 cursor-pointer" title="点击互动" />
        </div>
      </main>

      {/* ================= RIGHT SIDE MENU (FLOATING) ================= */}
      <aside className="absolute z-20 right-4 top-32 flex flex-col items-end gap-3 w-36 pointer-events-auto">
        {/* 1. Gambit / Daoist Platform (Highlight Feature) */}
        <div className="group relative w-full flex justify-end">
          <button className="relative w-36 h-14 bg-indigo-900/90 hover:bg-indigo-800 border-2 border-indigo-400/50 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-between px-3 transition-all transform group-hover:-translate-x-2">
            <div className="flex flex-col items-start">
              <span className="text-indigo-100 font-bold text-lg">悟道台</span>
              <span className="text-indigo-300 text-xs">AI 策略配置</span>
            </div>
            <SmartImage width={50} height={50} alt="悟道台图标" imageKey="button-wudao" className="w-10 h-10 opacity-80 rounded-lg" />
          </button>
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse" />
        </div>

        {/* 2. Shikigami Record */}
        <button className="w-32 h-12 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-3 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold text-sm">仙神录</span>
          <SmartImage width={40} height={40} alt="仙神录图标" imageKey="button-xianshen" className="w-7 h-7 opacity-70" />
        </button>

        {/* 3. Storage Bag */}
        <button className="w-32 h-12 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-3 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold text-sm">储物袋</span>
          <SmartImage width={40} height={40} alt="储物袋图标" imageKey="button-storage" className="w-7 h-7 opacity-70" />
        </button>

        {/* 4. Heavenly Pavilion (Shop/Gacha) */}
        <button className="w-32 h-12 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between px-3 transition-all hover:-translate-x-1">
          <span className="text-slate-200 font-bold text-sm">天机阁</span>
          <SmartImage width={40} height={40} alt="天机阁图标" imageKey="button-tianji" className="w-7 h-7 opacity-70" />
        </button>
      </aside>

      {/* ================= BOTTOM BAR (UTILS) ================= */}
      <div className="absolute bottom-6 left-6 z-20 flex gap-4 pointer-events-auto">
        {[
          { label: '图鉴', iconKey: 'button-encyclopedia' },
          { label: '坊市', iconKey: 'button-market' },
          { label: '成就', iconKey: 'button-achievements' },
        ].map((item, idx) => (
          <button key={idx} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 bg-white/10 group-hover:bg-amber-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm transition-all group-hover:scale-110">
              <SmartImage width={30} height={30} alt={item.label} imageKey={item.iconKey} className="w-5 h-5 rounded-full" />
            </div>
            <span className="text-xs text-slate-300 shadow-black drop-shadow-md">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ================= BATTLE BUTTON (TRIAL) ================= */}
      <div className="absolute bottom-8 right-6 z-30 pointer-events-auto">
        <button className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-red-900 to-red-700 border-4 border-amber-500/50 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95">
          {/* Inner Ring */}
          <div className="absolute inset-2 rounded-full border border-red-400/30 border-dashed animate-spin-slow" />
          
          <SmartImage width={50} height={50} alt="试炼装饰：火焰" imageKey="decoration-flame" className="w-10 h-10 mb-1 rounded-full" />
          <span className="text-white font-bold text-xl drop-shadow-md tracking-widest group-hover:text-amber-200">试 炼</span>
          
          {/* Decorative Particles (Static representation) */}
          <div className="absolute -top-2 -right-2 text-lg">✨</div>
        </button>
      </div>

      {/* ================= DEBUG / INFO OVERLAY ================= */}
      <div className="absolute bottom-2 right-2 text-[10px] text-white/20 pointer-events-none">
         TSAuto v0.1.0 • Neo-Chinese Style • React Preview
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen">
      {/* 使用CSS媒体查询处理响应式布局 */}
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
      <div className="block md:hidden">
        <MobileLayout />
      </div>
    </div>
  );
};

export default HomePage;
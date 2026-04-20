'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Settings, Search, X, LayoutGrid, ChevronLeft, ChevronRight, Pin, PinOff } from 'lucide-react';
import { tools, ToolDef } from '@/components/toolbox/tools';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import pkg from '../package.json';
import { useStore } from '@/lib/store';

const DashboardView = ({ tools, searchQuery, setSearchQuery, onSelect, mounted }: { 
  tools: ToolDef[], 
  searchQuery: string,
  setSearchQuery: (val: string) => void,
  onSelect: (id: string) => void,
  mounted: boolean
}) => {
  const toolStats = useStore((state) => state.toolStats);
  const togglePin = useStore((state) => state.togglePin);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-6 pt-4 pb-10 sm:px-10 sm:pt-6">
      <div className="mb-6 flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-mono font-bold tracking-tight text-foreground/90 sm:text-2xl">浮云工具箱</h2>
            <span className="rounded bg-surface-hover px-2 py-0.5 font-mono text-[9px] font-bold text-muted-foreground/50 border border-border/50">v{pkg.version}</span>
          </div>
          <div className="text-[9px] font-mono opacity-40 uppercase tracking-[0.3em] tabular-nums">
            共计 {tools.length} 个实用工具组件
          </div>
        </div>

        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text"
            placeholder="按名称或功能检索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-11 pr-6 font-mono text-xs outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all shadow-sm focus:shadow-md"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10 pr-2 scrollbar-none sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const stats = toolStats[tool.id];
          const clicks = stats?.clickCount || 0;
          const isPinned = stats?.isPinned || false;

          return (
            <div key={tool.id} className="group relative aspect-[1.4/1]">
              <button
                onClick={() => onSelect(tool.id)}
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface/30 p-4 transition-all hover:border-foreground hover:bg-surface-hover"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm transition-transform group-hover:scale-110">
                  <Icon size={24} className="text-muted-foreground group-hover:text-foreground" />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-center line-clamp-1 opacity-90 group-hover:opacity-100">
                    {tool.label}
                  </span>
                  
                  {/* Reserved space for click count to keep alignment consistent */}
                  <div className="flex h-4 items-center justify-center">
                    {(mounted && clicks > 0) && (
                      <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-surface/50 px-2 py-0.5 font-mono text-[8px] text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground/60 transition-colors">
                        <div className="h-1 w-1 rounded-full bg-foreground/20 group-hover:bg-foreground/40" />
                        {clicks}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(tool.id);
                }}
                className={cn(
                  "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background transition-all",
                  isPinned 
                    ? "border-foreground text-foreground" 
                    : "text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                <Pin size={10} fill={isPinned ? "currentColor" : "none"} className={cn(isPinned ? "rotate-45" : "")} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ToolboxPage() {
  const toolStats = useStore((state) => state.toolStats);
  const incrementClickCount = useStore((state) => state.incrementClickCount);

  const [activeTool, setActiveTool] = useState(tools[0].id);
  const [viewMode, setViewMode] = useState<'tool' | 'dashboard'>('dashboard');
  const [history, setHistory] = useState<Array<{ mode: 'tool' | 'dashboard'; id: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Making it async to satisfy the linter's cascading render check
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const sortedTools = useMemo(() => {
    const ts = [...tools].sort((a, b) => {
      const pinA = toolStats[a.id]?.isPinned ? 1 : 0;
      const pinB = toolStats[b.id]?.isPinned ? 1 : 0;
      
      if (pinA !== pinB) return pinB - pinA;

      const clickA = toolStats[a.id]?.clickCount || 0;
      const clickB = toolStats[b.id]?.clickCount || 0;
      return clickB - clickA;
    });
    return ts;
  }, [toolStats]);

  const filteredTools = useMemo(() => {
    const list = sortedTools;
    if (!searchQuery.trim()) return list;
    return list.filter(tool => 
      tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sortedTools]);

  const activeToolDef = tools.find(t => t.id === activeTool);
  const ActiveComponent = (activeToolDef && activeToolDef.component) ? activeToolDef.component : tools[0].component;

  const handleSelectTool = (id: string) => {
    incrementClickCount(id);
    if (viewMode === 'tool' && activeTool === id) return;
    setHistory(prev => [...prev, { mode: viewMode, id: activeTool }]);
    setActiveTool(id);
    setViewMode('tool');
  };

  const handleGoDashboard = () => {
    if (viewMode === 'dashboard') return;
    setHistory(prev => [...prev, { mode: viewMode, id: activeTool }]);
    setViewMode('dashboard');
  };

  const handleBack = () => {
    if (history.length === 0) {
      setViewMode('dashboard');
      return;
    }
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setViewMode(last.mode);
    setActiveTool(last.id);
  };

  if (!ActiveComponent && viewMode === 'tool') return null;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-surface p-2 sm:p-4">
      {/* Outer Shell - macOS / Hardware aesthetic */}
      <div className="flex h-full w-full overflow-hidden rounded-[1rem] border border-border bg-background shadow-xl">
        
        {/* Left Sidebar - Extremely Dense Icon Grid */}
        <div className="flex w-16 flex-col items-center border-r border-border bg-surface/50 py-4">
          
          {/* Drag Handle / Dashboard Toggle */}
          <div className="mb-4 flex shrink-0 items-center justify-center">
             <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleGoDashboard}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                    viewMode === 'dashboard' ? "text-foreground opacity-100" : "text-muted-foreground opacity-50 hover:opacity-100"
                  )}
                >
                  <LayoutGrid size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">仪表盘首页</TooltipContent>
            </Tooltip>
          </div>

          {/* Search Toggle */}
          <div className="mb-4 px-2 w-full">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={cn(
                "flex h-10 w-10 mx-auto items-center justify-center rounded-lg border transition-all duration-200",
                isSearchOpen 
                  ? "border-foreground bg-foreground/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {isSearchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
            
            {isSearchOpen && (
              <div className="mt-2 flex flex-col items-center animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  autoFocus
                  type="text"
                  placeholder="筛选..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-12 rounded border bg-background px-1 py-1 text-[10px] font-mono focus:border-foreground focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Tools Grid */}
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 scrollbar-none">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => {
                const isActive = activeTool === tool.id;
                const Icon = tool.icon;
                if (!Icon) return null;
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSelectTool(tool.id)}
                        className={cn(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                          isActive 
                            ? "border-foreground bg-foreground text-background shadow-md"
                            : "border-transparent bg-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                        )}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        {/* Active Indicator dot */}
                        {isActive && (
                          <span className="absolute -left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {tool.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })
            ) : (
              <div className="mt-4 text-center opacity-20">
                <Search size={14} className="mx-auto" />
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-border/50 pt-4 px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all duration-200"
                >
                  {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                切换主题
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all duration-200"
                >
                  <Settings size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                设置
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col bg-background overflow-hidden">
          
          {/* Header - Breadcrumbs & Back Button */}
          {viewMode === 'tool' && (
            <div className="flex h-12 w-full shrink-0 items-center border-b border-border/50 bg-background/50 px-4 backdrop-blur-md">
              <button 
                onClick={handleBack}
                className="mr-3 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <nav className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <button 
                  onClick={handleGoDashboard}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  浮云工具箱
                </button>
                <ChevronRight size={10} className="text-muted-foreground/30" />
                <span className="text-foreground font-bold">
                  {activeToolDef?.label}
                </span>
              </nav>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {viewMode === 'dashboard' ? (
              <DashboardView 
                tools={filteredTools} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={handleSelectTool} 
                mounted={mounted}
              />
            ) : (
              <ActiveComponent />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

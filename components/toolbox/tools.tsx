import { 
  Braces, Binary, Palette, QrCode, Hash, TextSearch, 
  Link as LinkIcon, Key, Timer, Calculator, FileDiff, 
  FileText, Type, CaseSensitive, Replace, Clock, Check,
  Network, LayoutGrid, Workflow, Copy, Wand2, ArrowUpCircle, ArrowDownCircle, X,
  History, Star, Trash2, Eraser, Filter, Pin, PinOff, Search, FileSearch, Table as TableIcon,
  Settings2, ArrowUpDown, ChevronDown, Upload, Terminal, AlertCircle, Combine
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChainProcessor } from './ChainProcessor';

export type ToolDef = {
  id: string;
  icon: React.ElementType;
  label: string;
  component: React.FC;
};

// 1. JSON Formatter
const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase">JSON 格式化</h2>
        <button 
          onClick={format} 
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-surface-hover transition-all shadow-sm"
          title="格式化"
        >
          <Wand2 size={14} />
        </button>
      </div>
      <div className="flex h-full gap-4">
        <textarea 
          className="h-full w-1/2 resize-none rounded-md border bg-background p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
          placeholder="在此处粘贴原始 JSON..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="relative h-full w-1/2">
          <textarea
            readOnly
            className={cn(
              "h-full w-full resize-none rounded-md border bg-surface p-2 font-mono text-xs focus:outline-none",
              error ? "border-red-500/50 text-red-500" : "text-foreground"
            )}
            value={error ? error : output}
            placeholder="格式化输出..."
          />
        </div>
      </div>
    </div>
  );
};

// 2. Base64
const Base64Converter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode'|'decode'>('encode');

  const process = (val: string, currentMode: 'encode'|'decode') => {
    setInput(val);
    try {
      if (!val) { setOutput(''); return; }
      if (currentMode === 'encode') {
        setOutput(btoa(val));
      } else {
        setOutput(atob(val));
      }
    } catch (e) {
      setOutput('无效的解码输入');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase">Base64 编解码</h2>
        <div className="flex rounded-md border bg-background overflow-hidden">
          <button 
            className={cn("flex h-8 w-10 items-center justify-center transition-all", mode === 'encode' ? "bg-foreground text-background" : "hover:bg-surface-hover")}
            onClick={() => { setMode('encode'); process(input, 'encode'); }}
            title="编码"
          >
            <ArrowUpCircle size={14} />
          </button>
          <div className="w-[1px] bg-border" />
          <button 
            className={cn("flex h-8 w-10 items-center justify-center transition-all", mode === 'decode' ? "bg-foreground text-background" : "hover:bg-surface-hover")}
            onClick={() => { setMode('decode'); process(input, 'decode'); }}
            title="解码"
          >
            <ArrowDownCircle size={14} />
          </button>
        </div>
      </div>
      <textarea 
        className="h-1/2 resize-none rounded-md border bg-background p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
        placeholder="输入内容..."
        value={input}
        onChange={(e) => process(e.target.value, mode)}
      />
      <textarea
        readOnly
        className="h-1/2 resize-none rounded-md border bg-surface p-2 font-mono text-xs focus:outline-none"
        value={output}
        placeholder="输出结果..."
      />
    </div>
  );
};

// 3. Color Converter
const ColorConverter = () => {
  const [hex, setHex] = useState('#111110');

  const hexToRgb = (h: string) => {
    let r = 0, g = 0, b = 0;
    if (h.length === 4) {
      r = parseInt(h[1] + h[1], 16);
      g = parseInt(h[2] + h[2], 16);
      b = parseInt(h[3] + h[3], 16);
    } else if (h.length === 7) {
      r = parseInt(h[1] + h[2], 16);
      g = parseInt(h[3] + h[4], 16);
      b = parseInt(h[5] + h[6], 16);
    }
    return isNaN(r) ? 'Invalid' : `rgb(${r}, ${g}, ${b})`;
  };

  const hexToHsl = (h: string) => {
    let r = 0, g = 0, b = 0;
    if (h.length === 4) {
      r = parseInt(h[1] + h[1], 16) / 255;
      g = parseInt(h[2] + h[2], 16) / 255;
      b = parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 7) {
      r = parseInt(h[1] + h[2], 16) / 255;
      g = parseInt(h[3] + h[4], 16) / 255;
      b = parseInt(h[5] + h[6], 16) / 255;
    } else {
      return 'Invalid';
    }

    if (isNaN(r)) return 'Invalid';

    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        hVal = 0,
        sVal = 0,
        lVal = 0;

    if (delta == 0) hVal = 0;
    else if (cmax == r) hVal = ((g - b) / delta) % 6;
    else if (cmax == g) hVal = (b - r) / delta + 2;
    else hVal = (r - g) / delta + 4;

    hVal = Math.round(hVal * 60);
    if (hVal < 0) hVal += 360;

    lVal = (cmax + cmin) / 2;
    sVal = delta == 0 ? 0 : delta / (1 - Math.abs(2 * lVal - 1));
    sVal = +(sVal * 100).toFixed(1);
    lVal = +(lVal * 100).toFixed(1);

    return `hsl(${hVal}, ${sVal}%, ${lVal}%)`;
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase">颜色转换器</h2>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">选择器</label>
          <input 
            type="color" 
            value={hex.length === 7 ? hex : '#000000'}
            onChange={(e) => setHex(e.target.value)}
            className="h-32 w-full cursor-pointer rounded-md border-0 bg-transparent p-0"
          />
        </div>
        <div className="flex flex-1 flex-col gap-4 pr-10">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">HEX</label>
            <input 
              type="text" 
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="rounded-md border bg-surface p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">RGB</label>
            <input 
              readOnly
              value={hexToRgb(hex)}
              className="rounded-md border bg-surface/50 p-2 font-mono text-sm focus:outline-none text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">HSL</label>
            <input 
              readOnly
              value={hexToHsl(hex)}
              className="rounded-md border bg-surface/50 p-2 font-mono text-sm focus:outline-none text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. SMB Converter
type SmbHistoryItem = {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  isFavorite: boolean;
  isPinned: boolean;
};

const SmbConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState<SmbHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('smb_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Wrap in a microtask to satisfy strict linter about sync setState in effect
          Promise.resolve().then(() => {
            setHistory(parsed);
          });
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('smb_history', JSON.stringify(history));
    }
  }, [history]);

  const handleInput = (val: string) => {
    setInput(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('\\\\')) {
      setOutput(trimmed.replace(/\\/g, '/').replace(/^\/\//, 'smb://'));
    } else if (trimmed.startsWith('smb://')) {
      setOutput(trimmed.replace(/^smb:\/\//, '\\\\').replace(/\//g, '\\'));
    } else if (trimmed.includes('\\')) {
        setOutput(trimmed.replace(/\\/g, '/'));
    } else {
      setOutput('');
    }
  };

  const handleOutputInput = (val: string) => {
    setOutput(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('smb://')) {
      setInput(trimmed.replace(/^smb:\/\//, '\\\\').replace(/\//g, '\\'));
    } else if (trimmed.startsWith('\\\\')) {
      setInput(trimmed.replace(/\\/g, '/').replace(/^\/\//, 'smb://'));
    } else {
      // Basic separator swap fallback
      if (val.includes('/')) {
        setInput(val.replace(/\//g, '\\'));
      } else if (val.includes('\\')) {
        setInput(val.replace(/\\/g, '/'));
      }
    }
  };

  const addToHistory = (i: string, o: string) => {
    if (!i.trim() || !o.trim()) return;
    setHistory(prev => {
      // Avoid duplicate recent entries
      const exists = prev.find(h => h.input === i && h.output === o);
      if (exists) return prev; 
      
      const newItem: SmbHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        input: i,
        output: o,
        timestamp: Date.now(),
        isFavorite: false,
        isPinned: false,
      };
      return [newItem, ...prev];
    });
  };

  const copyAll = () => {
    const text = `${input}\n${output}`;
    navigator.clipboard.writeText(text);
    addToHistory(input, output);
    handleInput('');
  };

  const clearInput = () => {
    handleInput('');
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorite: !h.isFavorite } : h));
  };

  const togglePin = (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, isPinned: !h.isPinned } : h));
  };

  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearAllHistory = () => {
    // Keep favorites as requested: "收藏后一键清除不会清除收藏的内容"
    setHistory(prev => prev.filter(h => h.isFavorite));
  };

  const sortedHistory = [...history].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  }).filter(h => {
    return h.input.toLowerCase().includes(searchTerm.toLowerCase()) || 
           h.output.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase italic">SMB 路径转换器</h2>
      </div>

      {/* Main Converter Card */}
      <div className="relative group/container w-full max-w-3xl rounded-2xl border border-border bg-surface/20 p-8 shadow-sm">
        <div className="flex flex-col divide-y divide-border border border-border rounded-lg bg-background overflow-hidden shadow-sm">
          <div className="relative group/input">
            <input 
              type="text" 
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="输入 UNC 或 SMB 路径..."
              className="w-full bg-transparent px-4 py-3 font-mono text-xs focus:bg-surface/5 outline-none transition-all pr-24"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {input && (
                <>
                  <button 
                    onClick={clearInput}
                    className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-all hover:text-red-500 hover:border-red-500/50"
                  >
                    <X size={10} />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(input);
                      addToHistory(input, output || input);
                      // Clear and focus back
                      handleInput('');
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-foreground"
                    title="复制并清空"
                  >
                    <Copy size={10} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative group/output">
            <input 
              value={output}
              onChange={(e) => handleOutputInput(e.target.value)}
              placeholder="转换结果..."
              className="w-full bg-transparent px-4 py-3 font-mono text-xs outline-none pr-12 focus:bg-surface/5 transition-all"
            />
            {output && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  addToHistory(input || output, output);
                  // Clear
                  handleInput('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-foreground"
                title="复制并清空"
              >
                <Copy size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 flex-1">
            <History size={14} className="opacity-40" />
            <div className="relative flex items-center flex-1 max-w-xs">
              <Search size={10} className="absolute left-2 opacity-30" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索历史..."
                className="h-6 w-full rounded-md border border-border/50 bg-background/50 pl-7 pr-2 font-mono text-[10px] outline-none focus:border-border transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={clearAllHistory}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-hover hover:text-red-500 transition-all"
              title="清除历史 (保留收藏)"
            >
              <Eraser size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "group/item flex items-center justify-between rounded-lg border border-border/50 bg-surface/5 px-3 py-2 transition-all hover:bg-surface/10",
                  item.isPinned && "border-foreground/20 bg-foreground/[0.02]"
                )}
              >
                <button 
                  onClick={() => {
                    setInput(item.input);
                    setOutput(item.output);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex flex-1 flex-col gap-0.5 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground truncate">
                    <span className="opacity-50">IN</span>
                    <span className="truncate">{item.input}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-foreground truncate">
                    <span className="opacity-50 text-[10px]">OUT</span>
                    <span className="truncate">{item.output}</span>
                  </div>
                </button>

                <div className="flex items-center gap-1 ml-4">
                  <button 
                    onClick={() => togglePin(item.id)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded transition-all",
                      item.isPinned ? "text-foreground" : "text-muted-foreground hover:bg-surface-hover"
                    )}
                  >
                    {item.isPinned ? <Pin size={10} fill="currentColor" className="rotate-45" /> : <Pin size={10} />}
                  </button>
                  <button 
                    onClick={() => toggleFavorite(item.id)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded transition-all",
                      item.isFavorite ? "text-amber-500" : "text-muted-foreground hover:bg-surface-hover"
                    )}
                  >
                    {item.isFavorite ? <Star size={10} fill="currentColor" /> : <Star size={10} />}
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${item.input}\n${item.output}`)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground"
                  >
                    <Copy size={10} />
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface-hover hover:text-red-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border/40 opacity-30">
              <History size={24} strokeWidth={1} />
              <p className="mt-2 text-[10px] font-mono uppercase tracking-widest italic">无历史记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LOG_PATTERNS = [
  {
    name: 'Log4j / Logback (Standard)',
    regex: /^(\d{4}[/.-]\d{2}[/.-]\d{2}[ T]\d{2}:\d{2}:\d{2}[.,]\d{3,6})\s+\[([^\]]+)\]\s+([A-Z]+)\s+([\w\.]+)\s+-\s+(.*)$/,
    headers: ['时间', '线程', '级别', '类名', '消息']
  },
  {
    name: 'Log4j (Simple)',
    regex: /^(\d{4}[/.-]\d{2}[/.-]\d{2}[ T]\d{2}:\d{2}:\d{2})\s+([A-Z]+)\s+([\w\.-]+):\s+(.*)$/,
    headers: ['时间', '级别', '类名', '消息']
  },
  {
    name: 'Common Web Log',
    regex: /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d{3})\s+(\d+|-)$/,
    headers: ['IP', '时间', '请求', '状态', '大小']
  }
];

// Smart Log Splitter - Handles brackets and quotes like a shell argument parser
const smartSplit = (line: string): string[] => {
  let rest = line.trim();
  if (!rest) return [];
  
  const tokens: string[] = [];

  // 1. Try to extract common timestamp at the beginning
  const tsMatch = rest.match(/^(\d{4}[/.-]\d{2}[/.-]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+/i);
  if (tsMatch) {
     tokens.push(tsMatch[1]);
     rest = rest.substring(tsMatch[0].length);
  }

  // 2. Tokenize the rest by space, respecting brackets and quotes
  let currentToken = '';
  let inParens = 0; // ()
  let inBrackets = 0; // []
  let inBraces = 0; // {}
  let inQuotes = false; // ""
  let inSingleQuotes = false; // ''

  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    
    // Handle state changes
    if (char === '(' && !inQuotes && !inSingleQuotes) inParens++;
    else if (char === ')' && !inQuotes && !inSingleQuotes && inParens > 0) inParens--;
    else if (char === '[' && !inQuotes && !inSingleQuotes) inBrackets++;
    else if (char === ']' && !inQuotes && !inSingleQuotes && inBrackets > 0) inBrackets--;
    else if (char === '{' && !inQuotes && !inSingleQuotes) inBraces++;
    else if (char === '}' && !inQuotes && !inSingleQuotes && inBraces > 0) inBraces--;
    else if (char === '"' && !inSingleQuotes) inQuotes = !inQuotes;
    else if (char === "'" && !inQuotes) inSingleQuotes = !inSingleQuotes;
    
    // Check for split
    if (char === ' ' || char === '\t') {
      if (inParens === 0 && inBrackets === 0 && inBraces === 0 && !inQuotes && !inSingleQuotes) {
        if (currentToken.length > 0) {
          tokens.push(currentToken);
          currentToken = '';
        }
        continue;
      }
    }
    
    currentToken += char;
  }
  
  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }
  
  return tokens;
};

// 5. Log Parser
const LogParser = () => {
  const [rawText, setRawText] = useState('');
  const [parserMode, setParserMode] = useState<'delimiter' | 'pattern'>('delimiter');
  const [delimiter, setDelimiter] = useState('');
  const deferredDelimiter = useDeferredValue(delimiter);
  const [autoDetectFailed, setAutoDetectFailed] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');
  const deferredFilterText = useDeferredValue(filterText);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [mergeFrom, setMergeFrom] = useState<number | null>(null);
  
  // Virtualization state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const ROW_HEIGHT = 28; // Fixed height in px
  const BUFFER = 10; // Extra rows above and below

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    if (scrollContainerRef.current) {
      observer.observe(scrollContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Smart Pattern/Delimiter Detection
  const detectBestParser = useCallback((text: string) => {
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 5);
    if (lines.length === 0) return { mode: 'delimiter' as const, value: '' };

    // Check regex patterns first
    for (const pattern of LOG_PATTERNS) {
      const matchCount = lines.filter(l => pattern.regex.test(l)).length;
      if (matchCount >= lines.length * 0.8) {
        return { mode: 'pattern' as const, value: pattern.name };
      }
    }

    // Fallback to delimiter - Pass 1: Strict Consistency
    const candidates = [',', '\t', '|', ';', ':', ' '];
    let bestDelimiter = '';
    let maxConsistencyCount = 0;

    candidates.forEach(cand => {
      const counts = lines.map(line => line.split(cand).length);
      const isConsistent = counts.every(c => c > 1 && c === counts[0]);
      if (isConsistent && counts[0] > maxConsistencyCount) {
        maxConsistencyCount = counts[0];
        bestDelimiter = cand;
      }
    });

    if (bestDelimiter) return { mode: 'delimiter' as const, value: bestDelimiter };

    // Pass 2: Most frequent common character (Best Guess Fallback)
    let bestGuess = '';
    let maxAverage = 0;

    candidates.forEach(cand => {
      const counts = lines.map(line => line.split(cand).length - 1);
      const total = counts.reduce((a, b) => a + b, 0);
      const average = total / lines.length;
      
      // We only consider it a guess if it appears in majority of lines
      const presence = counts.filter(c => c > 0).length;
      if (presence >= lines.length * 0.6 && average > maxAverage) {
        maxAverage = average;
        bestGuess = cand;
      }
    });

    return { mode: 'delimiter' as const, value: bestGuess };
  }, []);

  useEffect(() => {
    if (rawText && !delimiter && parserMode === 'delimiter') {
      const detection = detectBestParser(rawText);
      if (detection.mode === 'pattern') {
        Promise.resolve().then(() => {
          setParserMode('pattern');
          setAutoDetectFailed(false);
        });
      } else if (detection.value) {
        Promise.resolve().then(() => {
          setDelimiter(detection.value);
          setAutoDetectFailed(false);
        });
      } else {
        Promise.resolve().then(() => setAutoDetectFailed(true));
      }
    } else if (!rawText) {
      Promise.resolve().then(() => setAutoDetectFailed(false));
    }
  }, [rawText, delimiter, parserMode, detectBestParser]);

  // Derived Data & Headers (Base raw split)
  const { baseData, baseHeaders } = useMemo(() => {
    if (!rawText.trim()) return { baseData: [], baseHeaders: [] };
    const lines = rawText.trim().split('\n');

    if (parserMode === 'pattern') {
      // Improved voting-based pattern selection for strict matched
      const samples = lines.filter(l => l.trim()).slice(0, 10);
      let matchedPattern = null;
      
      for (const p of LOG_PATTERNS) {
        const matches = samples.filter(s => p.regex.test(s)).length;
        if (matches >= samples.length * 0.8) {
          matchedPattern = p;
          break;
        }
      }
      
      if (matchedPattern) {
        // Precise Exact Match
        const rows = lines.map((line, idx) => {
          const match = line.match(matchedPattern.regex);
          return {
            idx: idx + 1,
            cells: match ? match.slice(1).map(s => s.trim()) : smartSplit(line) // Fallback to smart split
          };
        });
        return { baseData: rows, baseHeaders: matchedPattern.headers };
      } else {
        // Smart Tokenizer Split
        const rows = lines.map((line, idx) => ({
          idx: idx + 1,
          cells: smartSplit(line)
        }));
        
        // Compute optimal headers based on max columns
        let maxCols = 0;
        const validRows = rows.slice(0, 50).filter(r => r.cells.length > 0);
        for (const row of validRows) {
          if (row.cells.length > maxCols) maxCols = row.cells.length;
        }
        
        let dynamicHeaders = Array.from({ length: maxCols }).map((_, i) => `COL_${i + 1}`);
        if (validRows.length > 0 && validRows[0].cells[0]?.match(/^\d{4}[/.-]\d{2}/)) {
          dynamicHeaders[0] = '时间';
        }

        return { baseData: rows, baseHeaders: dynamicHeaders };
      }
    } else {
      const sep = deferredDelimiter || ',';
      const rows = lines.map((line, idx) => ({
        idx: idx + 1,
        cells: line.split(sep).map(col => col.trim())
      }));
      
      const firstRowCells = rows[0]?.cells || [];
      const heads = firstRowCells.map((_, i) => `COL_${i + 1}`);
      return { baseData: rows, baseHeaders: heads };
    }
  }, [rawText, deferredDelimiter, parserMode]);

  // Apply Merge to End Logic
  const { data, headers } = useMemo(() => {
    if (mergeFrom !== null && mergeFrom >= 0 && mergeFrom < baseHeaders.length) {
      const newHeaders = baseHeaders.slice(0, mergeFrom);
      newHeaders.push(`${baseHeaders[mergeFrom]} (合并部分)`);

      const sep = parserMode === 'delimiter' ? (deferredDelimiter || ',') : ' ';
      
      const newData = baseData.map(row => {
        const newCells = row.cells.slice(0, mergeFrom);
        const tail = row.cells.slice(mergeFrom).filter(c => c !== undefined && c !== null).join(sep);
        newCells.push(tail);
        return { ...row, cells: newCells };
      });

      return { data: newData, headers: newHeaders };
    }
    return { data: baseData, headers: baseHeaders };
  }, [baseData, baseHeaders, mergeFrom, parserMode, deferredDelimiter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setRawText(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setRawText(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (deferredFilterText) {
      const lower = deferredFilterText.toLowerCase();
      result = result.filter(row => 
        row.cells.some(cell => cell.toLowerCase().includes(lower))
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a.cells[sortConfig.key] || '';
        const valB = b.cells[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, deferredFilterText, sortConfig]);

  // Virtualization calculations
  const totalRows = processedData.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIndex = Math.min(totalRows, Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);
  const visibleRows = processedData.slice(startIndex, endIndex);

  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (totalRows - endIndex) * ROW_HEIGHT);

  const toggleColumn = (idx: number) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSort = (idx: number) => {
    setSortConfig(prev => {
      if (prev?.key === idx) {
        return prev.direction === 'asc' ? { key: idx, direction: 'desc' } : null;
      }
      return { key: idx, direction: 'asc' };
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase italic">日志解析器</h2>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Input Area */}
        <div 
          className={cn(
            "relative shrink-0 flex flex-col gap-2 rounded-xl border border-border p-3 transition-all",
            isDragActive ? "bg-foreground/5 border-foreground/50 scale-[0.99]" : "bg-surface/10"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={onDrop}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase opacity-40">原始文本 (支持日志/CSV拖拽)</span>
            <div className="flex items-center gap-3">
              <label className="flex h-5 w-5 items-center justify-center cursor-pointer rounded border border-border bg-background text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all" title="导入文件">
                <Upload size={10} />
                <input type="file" className="hidden" accept=".txt,.log,.csv,.tsv" onChange={handleFileUpload} />
              </label>
              
              <div className="flex items-center gap-1 bg-surface/20 rounded-lg p-0.5 border border-border">
                <button 
                  onClick={() => setParserMode('delimiter')}
                  className={cn(
                    "px-2 py-0.5 text-[9px] font-mono rounded transition-all",
                    parserMode === 'delimiter' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  分割符
                </button>
                <button 
                  onClick={() => setParserMode('pattern')}
                  className={cn(
                    "px-2 py-0.5 text-[9px] font-mono rounded transition-all",
                    parserMode === 'pattern' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  智能分词
                </button>
              </div>

              {parserMode === 'delimiter' ? (
                <div className="relative flex items-center gap-2">
                  <span className="text-[10px] font-mono opacity-40">分隔符:</span>
                  <input 
                    type="text" 
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    placeholder="自动/输入"
                    className="h-5 w-12 rounded border border-border bg-background px-1 text-center font-mono text-[10px] outline-none focus:border-foreground"
                  />
                  {autoDetectFailed && !delimiter && (
                    <div className="absolute right-0 -bottom-5 flex items-center gap-1 text-[8px] text-amber-500 animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                      <AlertCircle size={9} />
                      未识别出分隔符
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface/30 text-[9px] font-mono text-foreground/60">
                  <Terminal size={10} />
                  <span>自动匹配与智能断句</span>
                </div>
              )}

              <button onClick={() => setRawText('')} className="text-muted-foreground hover:text-red-500 transition-all">
                <X size={12} />
              </button>
            </div>
          </div>
          <textarea 
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="在此粘贴日志内容或拖入文件..."
            className="h-32 w-full resize-none bg-transparent font-mono text-[11px] leading-relaxed outline-none scrollbar-none"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4 shrink-0 px-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="全量过滤..."
              className="h-9 w-full rounded-xl border border-border bg-surface/30 pl-9 pr-4 font-mono text-xs outline-none focus:border-foreground transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface/30 transition-all hover:bg-surface-hover",
                  showColumnSettings && "border-foreground bg-foreground/5 text-foreground"
                )}
                title="显示/隐藏列"
              >
                <Settings2 size={16} />
              </button>
              
              {showColumnSettings && (
                <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-border bg-background p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                  <div className="mb-2 px-2 pt-1 text-[10px] font-mono uppercase opacity-40 tracking-wider">隐藏列设置</div>
                  <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {headers.map((h, i) => (
                      <button 
                        key={i}
                        onClick={() => toggleColumn(i)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                          hiddenColumns.has(i) ? "text-muted-foreground opacity-40" : "bg-surface/50 text-foreground"
                        )}
                      >
                        <div className={cn("h-1.5 w-1.5 rounded-full", hiddenColumns.has(i) ? "bg-muted-foreground/30" : "bg-green-500")} />
                        <span className="font-mono">{h}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-4 w-[1px] bg-border mx-1" />
            
            <div className="text-[10px] font-mono opacity-40 uppercase tabular-nums">
              共 {processedData.length} 行 / {headers.length} 列
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto rounded-xl border border-border bg-surface/5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {data.length > 0 ? (
            <table className="min-w-full w-max border-collapse text-left font-mono text-[11px]">
              <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr className="h-9">
                  <th className="w-12 border-b border-border bg-surface/10 px-3 text-center text-[10px] opacity-30">#</th>
                  {headers.map((h, i) => !hiddenColumns.has(i) && (
                    <th 
                      key={i}
                      className="group/th border-b border-border px-4 hover:bg-surface/20 transition-all min-w-[120px]"
                    >
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <span 
                          onClick={() => toggleSort(i)} 
                          className="uppercase tracking-wider font-bold opacity-70 truncate cursor-pointer hover:opacity-100 transition-all"
                        >
                          {h}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/th:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMergeFrom(mergeFrom === i ? null : i);
                            }}
                            title={mergeFrom === i ? "取消合并" : "从此列向右合并至末尾"}
                            className="p-1 rounded hover:bg-foreground/10 text-muted-foreground transition-all"
                          >
                            <Combine size={11} className={cn(mergeFrom === i && "text-blue-500")} />
                          </button>
                          <button onClick={() => toggleSort(i)} className="p-1 rounded hover:bg-foreground/10 text-muted-foreground">
                            <ArrowUpDown 
                              size={10} 
                              className={cn(sortConfig?.key === i && "text-foreground")} 
                            />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }} aria-hidden="true"><td colSpan={99} /></tr>}
                {visibleRows.map((row) => (
                  <tr key={row.idx} className="group/tr hover:bg-surface/10 transition-colors" style={{ height: `${ROW_HEIGHT}px` }}>
                    <td className="w-12 px-3 py-0 text-center text-[10px] opacity-30 group-hover/tr:opacity-60 tabular-nums">
                      {row.idx}
                    </td>
                    {row.cells.map((cell, cellIndex) => !hiddenColumns.has(cellIndex) && (
                      <td key={cellIndex} className="px-4 py-0 truncate max-w-[400px] min-w-[120px]" title={cell}>
                        {cell || <span className="opacity-20 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }} aria-hidden="true"><td colSpan={99} /></tr>}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 opacity-20">
              <TableIcon size={48} strokeWidth={1} />
              <p className="mt-4 text-sm font-mono uppercase tracking-widest italic">等待数据解析...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder for other tools to show density
const GenericTool = ({ name }: { name: string }) => (
  <div className="flex h-full flex-col items-center justify-center p-4">
    <h2 className="text-sm font-mono tracking-wider opacity-50 uppercase">{name}</h2>
    <p className="mt-4 text-xs text-muted-foreground font-mono italic">请选择其他工具或等待此工具实现。</p>
  </div>
);

export const tools: ToolDef[] = [
  { id: 'json', icon: Braces, label: 'JSON 格式化', component: JsonFormatter },
  { id: 'log', icon: FileSearch, label: '日志解析', component: LogParser },
  { id: 'base64', icon: Binary, label: 'Base64 编解码', component: Base64Converter },
  { id: 'smb', icon: Network, label: 'SMB 路径转换', component: SmbConverter },
  { id: 'qr', icon: QrCode, label: 'QR 二维码生成', component: () => <GenericTool name="QR 二维码生成" /> },
  { id: 'color', icon: Palette, label: '取色器', component: ColorConverter },
  { id: 'hash', icon: Hash, label: '哈希生成', component: () => <GenericTool name="哈希生成" /> },
  { id: 'regex', icon: TextSearch, label: '正则测试', component: () => <GenericTool name="正则测试" /> },
  { id: 'url', icon: LinkIcon, label: 'URL 编解码', component: () => <GenericTool name="URL 编解码" /> },
  { id: 'jwt', icon: Key, label: 'JWT 解码', component: () => <GenericTool name="JWT 解码" /> },
  { id: 'timer', icon: Timer, label: '秒表', component: () => <GenericTool name="秒表" /> },
  { id: 'calc', icon: Calculator, label: '计算器', component: () => <GenericTool name="计算器" /> },
  { id: 'diff', icon: FileDiff, label: '文本对比', component: () => <GenericTool name="文本对比" /> },
  { id: 'markdown', icon: FileText, label: 'Markdown 预览', component: () => <GenericTool name="Markdown 预览" /> },
  { id: 'lorem', icon: Type, label: '乱码生成', component: () => <GenericTool name="乱码生成" /> },
  { id: 'case', icon: CaseSensitive, label: '大小写转换', component: () => <GenericTool name="大小写转换" /> },
  { id: 'replace', icon: Replace, label: '查找替换', component: () => <GenericTool name="查找替换" /> },
  { id: 'epoch', icon: Clock, label: '时间戳转换', component: () => <GenericTool name="时间戳转换" /> },
  { id: 'chain', icon: Workflow, label: '链式文本处理', component: ChainProcessor },
];

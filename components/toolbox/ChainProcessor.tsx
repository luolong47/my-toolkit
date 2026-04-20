'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Play, ChevronDown, ChevronUp, Eye, EyeOff, 
  Settings2, ArrowDown, Copy, Check, AlertCircle, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

// --- Types ---

type StepType = 
  | 'jsonpath' 
  | 'regex-replace' 
  | 'base64-encode' 
  | 'base64-decode'
  | 'js-script' 
  | 'upper-case' 
  | 'lower-case' 
  | 'trim' 
  | 'json-to-csv';

interface Step {
  id: string;
  type: StepType;
  value: string;
  active: boolean;
  byline?: boolean;
}

interface StepDefinition {
  type: StepType;
  label: string;
  description: string;
  supportsByLine: boolean;
  defaultValue: string;
}

// --- Constants ---

const STEP_DEFINITIONS: Record<StepType, StepDefinition> = {
  'jsonpath': {
    type: 'jsonpath',
    label: 'JSONPath',
    description: '使用 JSONPath 提取数据 (支持 ||)',
    supportsByLine: true,
    defaultValue: '$.data'
  },
  'regex-replace': {
    type: 'regex-replace',
    label: '正则替换',
    description: '使用正则表达式替换文本 (JSON 配置)',
    supportsByLine: true,
    defaultValue: '{"pattern": "\\\\d+", "flags": "g", "replacement": "*"}'
  },
  'base64-encode': {
    type: 'base64-encode',
    label: 'Base64 编码',
    description: '将文本转换为 Base64',
    supportsByLine: true,
    defaultValue: ''
  },
  'base64-decode': {
    type: 'base64-decode',
    label: 'Base64 解码',
    description: '将 Base64 转换为文本',
    supportsByLine: true,
    defaultValue: ''
  },
  'js-script': {
    type: 'js-script',
    label: 'JS 脚本',
    description: '运行自定义 JavaScript 脚本 (input 变量)',
    supportsByLine: true,
    defaultValue: 'return input.toUpperCase();'
  },
  'upper-case': {
    type: 'upper-case',
    label: '转大写',
    description: '将文本转换为大写',
    supportsByLine: true,
    defaultValue: ''
  },
  'lower-case': {
    type: 'lower-case',
    label: '转小写',
    description: '将文本转换为小写',
    supportsByLine: true,
    defaultValue: ''
  },
  'trim': {
    type: 'trim',
    label: '修剪空格',
    description: '移除首尾空格',
    supportsByLine: true,
    defaultValue: ''
  },
  'json-to-csv': {
    type: 'json-to-csv',
    label: 'JSON 转 CSV',
    description: '将 JSON 数组转换为 CSV 格式',
    supportsByLine: false,
    defaultValue: ''
  }
};

// --- Execution Helpers ---

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const executeStep = (input: string, step: Step): string => {
  if (!step.active) return input;

  const execute = (text: string, type: StepType, value: string): string => {
    switch (type) {
      case 'upper-case': return text.toUpperCase();
      case 'lower-case': return text.toLowerCase();
      case 'trim': return text.trim();
      case 'base64-encode': return btoa(unescape(encodeURIComponent(text)));
      case 'base64-decode': 
        try {
          return decodeURIComponent(escape(atob(text)));
        } catch {
          return 'Invalid Base64';
        }
      case 'regex-replace': {
        try {
          const config = JSON.parse(value);
          const regex = new RegExp(config.pattern, config.flags || 'g');
          let replacement = config.replacement || '';
          // Handle \n in replacement
          replacement = replacement.replace(/\\n/g, '\n');
          return text.replace(regex, replacement);
        } catch {
          return text;
        }
      }
      case 'js-script': {
        try {
          let data: any = text;
          try { data = JSON.parse(text); } catch {}
          
          const fn = new Function('input', value);
          const result = fn(data);
          
          if (typeof result === 'object' && result !== null) {
            return JSON.stringify(result, null, 2);
          }
          return String(result);
        } catch (e: any) {
          return `JS Error: ${e.message}`;
        }
      }
      case 'json-to-csv': {
        try {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) return 'Input must be a JSON array';
          if (data.length === 0) return '';
          
          const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
          const rows = data.map(obj => 
            headers.map(header => {
              const val = obj[header] === undefined || obj[header] === null ? '' : String(obj[header]);
              if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            }).join(',')
          );
          
          return [headers.join(','), ...rows].join('\n');
        } catch {
          return 'Invalid JSON array';
        }
      }
      case 'jsonpath': {
          // Simple JSONPath surrogate for the sake of no external heavy deps
          // Real apps would use jsonpath-plus
          try {
            const data = JSON.parse(text);
            const paths = value.split('||').map(p => p.trim());
            
            for (const path of paths) {
              // Basic support for $.property
              if (path === '$') return JSON.stringify(data, null, 2);
              if (path.startsWith('$.')) {
                const parts = path.substring(2).split('.');
                let current = data;
                for (const part of parts) {
                  current = current?.[part];
                }
                if (current !== undefined) {
                   return typeof current === 'object' ? JSON.stringify(current, null, 2) : String(current);
                }
              }
            }
            return '';
          } catch {
            return 'Invalid JSON';
          }
      }
      default: return text;
    }
  };

  const isByLine = step.byline && STEP_DEFINITIONS[step.type].supportsByLine;

  if (isByLine) {
    const lines = input.split(/\r?\n/);
    return lines.map(line => execute(line, step.type, step.value)).join('\n');
  }

  return execute(input, step.type, step.value);
};

// --- Component ---

export const ChainProcessor = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', type: 'trim', value: '', active: true, byline: true }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorStepId, setErrorStepId] = useState<string | null>(null);

  const processPipeline = useCallback(() => {
    setErrorStepId(null);
    let currentResult = input;
    try {
      for (const step of steps) {
        if (!step.active) continue;
        try {
          currentResult = executeStep(currentResult, step);
        } catch (e) {
          setErrorStepId(step.id);
          throw e;
        }
      }
      setOutput(currentResult);
    } catch (e) {
      console.error(e);
    }
  }, [input, steps]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProcessing(true);
      processPipeline();
      setIsProcessing(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [input, steps, processPipeline]);

  const addStep = (type: StepType) => {
    const newStep: Step = {
      id: generateId(),
      type,
      value: STEP_DEFINITIONS[type].defaultValue,
      active: true,
      byline: STEP_DEFINITIONS[type].supportsByLine
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Tool Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 bg-surface/30 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground/80">链式文本处理</h2>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-[10px] font-mono text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/40" />
              自动处理中...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Input & Steps */}
        <div className="flex w-[400px] flex-col border-r border-border overflow-hidden bg-surface/10">
          
          {/* Input Area */}
          <div className="flex flex-col border-b border-border">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-surface/50">
               <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">输入内容</span>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在此输入需要处理的原始文本..."
              className="h-32 w-full resize-none bg-transparent p-4 font-mono text-[11px] leading-relaxed focus:outline-none"
            />
          </div>

          {/* Steps List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-surface/50">
               <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">处理步骤 ({steps.length})</span>
               <div className="group relative">
                  <button className="flex items-center gap-1 rounded bg-foreground/5 px-2 py-0.5 text-[9px] font-bold uppercase hover:bg-foreground hover:text-background transition-colors">
                    <Plus size={10} />
                    添加步骤
                  </button>
                  <div className="absolute right-0 top-full z-50 mt-1 hidden w-48 flex-col rounded-lg border border-border bg-background p-1 shadow-xl group-hover:flex">
                    {Object.values(STEP_DEFINITIONS).map((def) => (
                      <button 
                        key={def.type}
                        onClick={() => addStep(def.type)}
                        className="flex flex-col rounded px-2 py-1.5 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tight">{def.label}</span>
                        <span className="text-[8px] text-muted-foreground">{def.description}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-none">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={cn(
                    "group flex flex-col rounded-xl border p-3 transition-all",
                    step.active ? "border-border bg-surface/30" : "border-border/40 bg-surface/10 opacity-60",
                    errorStepId === step.id && "border-red-500/50 bg-red-500/5"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/5 text-[9px] font-mono tabular-nums">{index + 1}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{STEP_DEFINITIONS[step.type].label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateStep(step.id, { active: !step.active })}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        {step.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button 
                         onClick={() => moveStep(index, 'up')}
                         disabled={index === 0}
                         className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                         onClick={() => moveStep(index, 'down')}
                         disabled={index === steps.length - 1}
                         className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="p-1 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {STEP_DEFINITIONS[step.type].defaultValue !== undefined && step.type !== 'upper-case' && step.type !== 'lower-case' && step.type !== 'trim' && step.type !== 'json-to-csv' && (
                    <div className="mb-3">
                       <textarea 
                          value={step.value}
                          onChange={(e) => updateStep(step.id, { value: e.target.value })}
                          placeholder="配置值..."
                          className="w-full rounded border border-border/50 bg-background/50 p-2 font-mono text-[10px] focus:outline-none focus:border-foreground"
                          rows={2}
                       />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {STEP_DEFINITIONS[step.type].supportsByLine && (
                        <label className="flex cursor-pointer items-center gap-1.5 group/toggle">
                          <input 
                            type="checkbox"
                            checked={step.byline}
                            onChange={(e) => updateStep(step.id, { byline: e.target.checked })}
                            className="h-3 w-3 rounded border-border bg-background checked:bg-foreground"
                          />
                          <span className="text-[9px] font-mono uppercase tracking-tighter text-muted-foreground group-hover/toggle:text-foreground">逐行处理</span>
                        </label>
                      )}
                    </div>
                    {errorStepId === step.id && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-red-500">
                        <AlertCircle size={10} /> 执行出错
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center">
                   <ArrowDown className="animate-bounce opacity-20" />
                   <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40">请添加第一个处理算子</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Result Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
          <div className="flex shrink-0 items-center justify-between border-b border-border/30 bg-surface/50 px-4 py-2">
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">处理结果</span>
                {isProcessing && <div className="h-1.5 w-1.5 animate-ping rounded-full bg-foreground" />}
             </div>
             <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={copyResult}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background transition-all hover:bg-foreground/90 active:scale-95"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-[9px] uppercase tracking-wider">
                    {copied ? "已复制" : "复制处理结果"}
                  </TooltipContent>
                </Tooltip>
             </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6 scrollbar-thin">
            <pre className="font-mono text-xs leading-relaxed text-foreground/80 selection:bg-foreground selection:text-background whitespace-pre-wrap break-all">
              {output || <span className="opacity-20 italic">等待执行输出...</span>}
            </pre>
          </div>

          {/* Grid Background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      </div>
    </div>
  );
};

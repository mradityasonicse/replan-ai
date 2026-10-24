import React from 'react'
import {
  Zap,
  Download,
  Plus,
  RotateCcw,
  MessageSquare,
  Layers,
  Calendar,
  Waves,
  Sliders,
  Home,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import type { WeekCapacityMetrics } from '../types'
import { PRESET_SCENARIOS, BLANK_WORKSPACE } from '../utils/presets'
import type { PresetScenario } from '../utils/presets'
import { sound } from '../utils/sound'

export type NavView = 'dash' | 'plan' | 'sim' | 'tasks' | 'set'

interface HeaderProps {
  currentPresetId: string
  onSelectPreset: (preset: PresetScenario) => void
  metrics: WeekCapacityMetrics
  activeView: NavView
  onChangeView: (view: NavView) => void
  onOpenRecovery: () => void
  onOpenAddModal: () => void
  onOpenExportModal: () => void
  onOpenCoach: () => void
  onUndo: () => void
  canUndo: boolean
  onToggleHero: () => void
  showHero: boolean
  hasDisplacedBlocks: boolean
  onRebalancePlan?: () => void
  onOpenStudio?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  metrics,
  activeView,
  onChangeView,
  onOpenRecovery,
  onOpenAddModal,
  onOpenExportModal,
  onOpenCoach,
  onUndo,
  canUndo,
  onToggleHero,
  showHero,
  hasDisplacedBlocks,
  onRebalancePlan,
  onOpenStudio,
}) => {
  const allProfiles = [BLANK_WORKSPACE, ...PRESET_SCENARIOS]

  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'dash', label: 'Dashboard', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'plan', label: 'Week Planner', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'sim', label: 'Ripple Simulator', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'My Tasks', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'set', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" /> },
  ]

  return (
    <header className="relative z-30 border-b border-white/[0.08] bg-[#050812]/90 backdrop-blur-2xl px-4 lg:px-8 py-2.5 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Technical Spec */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick()
                onToggleHero()
              }}
              className="flex items-center gap-2 text-left cursor-pointer group"
              title="Toggle Landing Hero"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
                <span className="text-sm">◉</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-black tracking-tight text-white uppercase">
                    RePlan <span className="text-sky-400">AI</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 font-bold tracking-wide">
                    AWARD v3.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  Your Life Changes. Your Plan Adapts.
                </p>
              </div>
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={currentPresetId}
              onChange={(e) => {
                sound.playClick()
                const found = allProfiles.find((p) => p.id === e.target.value)
                if (found) onSelectPreset(found)
              }}
              className="bg-[#0a0f1d] text-slate-200 text-xs font-mono border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Primary Navigation Tabs */}
        {!showHero && (
          <div className="flex items-center gap-1 p-1 bg-[#06080e] rounded-xl border border-white/[0.08] text-xs font-mono overflow-x-auto max-w-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick()
                  onChangeView(item.id)
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeView === item.id
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Telemetry Actions Strip */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Burnout Risk Pill */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono">
            <span className="text-slate-400">Burnout:</span>
            <span className={metrics.overallBurnoutIndex >= 60 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {metrics.overallBurnoutIndex}%
            </span>
          </div>

          {/* Undo Action */}
          <button
            onClick={() => {
              if (canUndo) {
                sound.playClick()
                onUndo()
              }
            }}
            disabled={!canUndo}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
              canUndo
                ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10 cursor-pointer'
                : 'bg-white/[0.02] text-slate-600 border-white/[0.04] cursor-not-allowed'
            }`}
            title="Undo last modification"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Auto Re-balance Schedule */}
          {onRebalancePlan && (
            <button
              onClick={() => {
                sound.playSuccessChime()
                onRebalancePlan()
              }}
              className="px-2.5 py-1.5 rounded-lg border bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Re-balance study blocks to deadlines"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Re-solve</span>
            </button>
          )}

          {/* AI Coach Drawer Button */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenCoach()
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Coach</span>
          </button>

          {/* AI Engineering Studio Button */}
          {onOpenStudio && (
            <button
              onClick={() => {
                sound.playClick()
                onOpenStudio()
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Open RAG, Agent Memory, Context & Evals Studio [S]"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>
          )}

          {/* Life Happened / Recovery Button */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenRecovery()
            }}
            className={`group px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              hasDisplacedBlocks
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 shadow-md shadow-sky-500/20'
            }`}
            title="Press [R] to trigger recovery"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{hasDisplacedBlocks ? 'Recover Plan' : 'Life Happened?'}</span>
          </button>

          {/* Quick Add CTA */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Ingest task or lecture [N]"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export CTA */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenExportModal()
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Export iCalendar (.ics)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

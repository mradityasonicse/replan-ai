import React from 'react'
import {
  Zap,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import type { WeekCapacityMetrics } from '../types'
import { PRESET_SCENARIOS } from '../utils/presets'
import type { PresetScenario } from '../utils/presets'
import { sound } from '../utils/sound'

interface HeaderProps {
  currentPresetId: string
  onSelectPreset: (preset: PresetScenario) => void
  metrics: WeekCapacityMetrics
  onOpenRecovery: () => void
  onOpenAddModal: () => void
  onOpenExportModal: () => void
  onRebalancePlan: () => void
  hasDisplacedBlocks: boolean
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  metrics,
  onOpenRecovery,
  onOpenAddModal,
  onOpenExportModal,
  onRebalancePlan,
  hasDisplacedBlocks,
}) => {
  const isBurnoutHigh = metrics.overallBurnoutIndex >= 60

  return (
    <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white font-bold">
              <Zap className="w-5 h-5 text-sky-100" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  CHRONO<span className="text-sky-400">FLOW</span>
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                  Academic Resilience
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Turns overwhelming course loads into recoverable reality
              </p>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 hidden lg:inline-block">Profile:</label>
            <select
              value={currentPresetId}
              onChange={(e) => {
                sound.playClick()
                const found = PRESET_SCENARIOS.find((p) => p.id === e.target.value)
                if (found) onSelectPreset(found)
              }}
              className="bg-slate-900 text-slate-200 text-xs font-medium border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              {PRESET_SCENARIOS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Burnout & Health Telemetry */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            {isBurnoutHigh ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Burnout Risk:</span>
              <span
                className={`font-semibold ${
                  isBurnoutHigh ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {metrics.overallBurnoutIndex}%{' '}
                {isBurnoutHigh ? '(High Crunch)' : '(Optimal)'}
              </span>
            </div>
          </div>

          {/* Life Happened / Emergency Recovery CTA */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenRecovery()
            }}
            className={`relative group px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
              hasDisplacedBlocks
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{hasDisplacedBlocks ? 'Recover Disrupted Plan!' : 'Life Happened? Recover'}</span>
            <span className="bg-white/20 px-1 py-0.2 rounded text-[10px]">1-Click</span>
          </button>

          {/* Quick Add / Syllabus Parser */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">+ Ingest / Add</span>
          </button>

          {/* Export Plan */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenExportModal()
            }}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Calendar (.ics)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Auto Re-balance */}
          <button
            onClick={() => {
              sound.playClick()
              onRebalancePlan()
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Re-balance entire weekly schedule"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

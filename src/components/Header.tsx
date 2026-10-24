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
import { PRESET_SCENARIOS, BLANK_WORKSPACE } from '../utils/presets'
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
  const allProfiles = [BLANK_WORKSPACE, ...PRESET_SCENARIOS]

  return (
    <header className="relative z-20 border-b border-white/[0.07] bg-[#060709]/80 backdrop-blur-xl px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Technical Spec */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-black tracking-tight text-white uppercase">
                  CHRONO<span className="text-sky-400">FLOW</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 font-bold tracking-wide">
                  v2.4 RESILIENT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Autonomous Recovery & Capacity Solver
              </p>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden lg:inline">Profile:</span>
            <select
              value={currentPresetId}
              onChange={(e) => {
                sound.playClick()
                const found = allProfiles.find((p) => p.id === e.target.value)
                if (found) onSelectPreset(found)
              }}
              className="bg-[#0e1118] text-slate-200 text-xs font-mono border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Telemetry Actions Strip */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Burnout Status Pill */}
          <div className="flex items-center gap-2 bg-[#0c0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono">
            {isBurnoutHigh ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="text-slate-400 hidden sm:inline">Burnout Risk:</span>
            <span
              className={`font-semibold ${
                isBurnoutHigh ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {metrics.overallBurnoutIndex}%
            </span>
          </div>

          {/* Life Happened / Emergency Recovery CTA */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenRecovery()
            }}
            className={`group px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hasDisplacedBlocks
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]'
            }`}
            title="Press [R] to trigger recovery"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{hasDisplacedBlocks ? 'Recover Plan' : 'Life Happened?'}</span>
            <kbd className="hidden sm:inline bg-black/20 text-[10px] px-1 rounded font-mono">
              R
            </kbd>
          </button>

          {/* Quick Add */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#0e1118] hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Press [N] to add"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">+ Ingest</span>
            <kbd className="hidden sm:inline bg-white/5 text-[10px] px-1 rounded text-slate-400 font-mono">
              N
            </kbd>
          </button>

          {/* Export Plan */}
          <button
            onClick={() => {
              sound.playClick()
              onOpenExportModal()
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#0e1118] hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className="p-1.5 rounded-lg bg-[#0e1118] hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Re-balance entire weekly schedule"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

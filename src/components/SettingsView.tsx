import React from 'react'
import {
  Sliders,
  Shield,
  Battery,
  RotateCcw,
  Trash2,
  Mail,
} from 'lucide-react'
import type { StudentPreferences, DayOfWeek } from '../types'
import { DAYS_OF_WEEK } from '../types'
import { sound } from '../utils/sound'

interface SettingsViewProps {
  preferences: StudentPreferences
  onUpdatePreferences: (updated: Partial<StudentPreferences>) => void
  onLoadSampleWeek: () => void
  onClearAll: () => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onLoadSampleWeek,
  onClearAll,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      {/* Left Card: Planning Limits & Cognitive Thresholds */}
      <div className="lg:col-span-6 specular-card rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold font-display text-white">Planning Limits & Guardrails</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
            Cognitive Guard
          </span>
        </div>

        {/* Study Limit Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span>Daily Study Cap:</span>
            <span className="font-bold text-sky-400 text-sm">{preferences.maxDailyDeepWorkHours} hours / day</span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={preferences.maxDailyDeepWorkHours}
            onChange={(e) => {
              onUpdatePreferences({ maxDailyDeepWorkHours: parseFloat(e.target.value) })
            }}
            className="w-full accent-sky-400"
          />
          <p className="text-[11px] font-mono text-slate-500">
            The scheduler will never schedule more than this many hours in a single day.
          </p>
        </div>

        {/* Energy Today */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-amber-400" />
            <span>Energy State Today:</span>
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#06080e] rounded-xl border border-white/[0.08] text-xs font-mono">
            {(['drained', 'okay', 'fresh'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  sound.playClick()
                  onUpdatePreferences({ energyLevel: lvl })
                }}
                className={`py-2 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  (preferences.energyLevel || 'okay') === lvl
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'drained' ? '⚡ Drained (-2h)' : lvl === 'okay' ? '● Okay' : '✨ Fresh (+1h)'}
              </button>
            ))}
          </div>
        </div>

        {/* Today is */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <label className="text-xs font-mono text-slate-400 block">Today is Anchor:</label>
          <select
            value={preferences.currentDay || 'Mon'}
            onChange={(e) => {
              sound.playClick()
              onUpdatePreferences({ currentDay: e.target.value as DayOfWeek })
            }}
            className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Card: Comfort, Health & Storage */}
      <div className="lg:col-span-6 specular-card rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold font-display text-white">Sleep Hygiene & Privacy</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Local Only
          </span>
        </div>

        {/* Sleep Anchors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Wake Time Anchor</label>
            <input
              type="time"
              value={preferences.wakeTime}
              onChange={(e) => onUpdatePreferences({ wakeTime: e.target.value })}
              className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Bedtime Anchor (Guarded)</label>
            <input
              type="time"
              value={preferences.bedTime}
              onChange={(e) => onUpdatePreferences({ bedTime: e.target.value })}
              className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white"
            />
          </div>
        </div>

        {/* Campus Email Setting */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
          <label className="text-xs font-mono text-slate-400 block">Campus Helpdesk / Advisor Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              value={preferences.helpDeskEmail || ''}
              onChange={(e) => onUpdatePreferences({ helpDeskEmail: e.target.value })}
              placeholder="advisor@university.edu"
              className="w-full bg-[#06080e] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
            />
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Used when drafting in-person support requests. Never leaves this browser.
          </p>
        </div>

        {/* Data Actions */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              sound.playClick()
              onLoadSampleWeek()
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Week</span>
          </button>

          <button
            onClick={() => {
              sound.playAlert()
              onClearAll()
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Everything</span>
          </button>
        </div>
      </div>
    </div>
  )
}

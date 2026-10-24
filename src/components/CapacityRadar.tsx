import React from 'react'
import {
  Clock,
  ShieldAlert,
  Moon,
  Activity,
} from 'lucide-react'
import type {
  ScheduledBlock,
  AcademicDeadline,
  StudentPreferences,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import { computeDailyCapacity, computeWeekCapacityMetrics } from '../utils/capacity'

interface CapacityRadarProps {
  blocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
  preferences: StudentPreferences
}

export const CapacityRadar: React.FC<CapacityRadarProps> = ({
  blocks,
  deadlines,
  preferences,
}) => {
  const metrics = computeWeekCapacityMetrics(blocks, deadlines, preferences)
  const dailyCapacities = DAYS_OF_WEEK.map((day) =>
    computeDailyCapacity(day, blocks, deadlines, preferences)
  )

  const hasDeficits = metrics.daysWithDeficit.length > 0

  return (
    <section className="hairline-card rounded-2xl p-4 lg:p-5 mb-6">
      {/* Telemetry Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Cognitive Load Telemetry & Guardrails
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              ● Sleep Guard Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balancing of cognitive focus limits (max {preferences.maxDailyDeepWorkHours}h/day), transition buffers, and sleep hygiene.
          </p>
        </div>

        {/* Precision Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#080a0f] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Study Needed vs Planned</div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {metrics.totalStudyHoursScheduled}h{' '}
                <span className="text-slate-500 font-normal">/ {metrics.totalStudyHoursNeeded}h needed</span>
              </div>
            </div>
          </div>

          <div className="bg-[#080a0f] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Guarded Sleep</div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {preferences.targetSleepHours}h/night{' '}
                <span className="text-emerald-400 font-normal">({preferences.bedTime})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deficit Alert Banner */}
      {hasDeficits && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-300 font-mono">CAPACITY DEFICIT: </span>
            {metrics.daysWithDeficit.join(', ')} {metrics.daysWithDeficit.length === 1 ? 'is' : 'are'} overloaded. Fixed lectures and study sprints exceed safe limits. Use{' '}
            <strong className="text-amber-100 underline decoration-amber-400 cursor-pointer">Life Happened / Recovery Tool</strong> to rebalance without sleep deprivation.
          </div>
        </div>
      )}

      {/* 7-Day Precision Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4">
        {dailyCapacities.map((cap) => {
          const totalLogged = cap.fixedCommitmentHours + cap.studyPlannedHours + cap.personalHours
          const pct = Math.min(100, Math.round((totalLogged / cap.totalAwakeHours) * 100))

          const isCritical = cap.burnoutRisk === 'critical'
          const isModerate = cap.burnoutRisk === 'moderate'

          return (
            <div
              key={cap.day}
              className={`rounded-xl p-2.5 border transition-all ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : isModerate
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-[#080a0f] border-white/[0.07] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-slate-200">{cap.day}</span>
                <span
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isModerate
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isCritical ? 'Deficit' : isModerate ? 'Dense' : 'Optimal'}
                </span>
              </div>

              {/* High-precision micro bar */}
              <div className="w-full bg-slate-900 rounded-full h-1 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCritical
                      ? 'bg-rose-500'
                      : isModerate
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Data Breakdown */}
              <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 font-mono">
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="text-slate-300">{cap.fixedCommitmentHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Study:</span>
                  <span className="text-sky-300 font-semibold">{cap.studyPlannedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Buffer:</span>
                  <span className={cap.freeBufferHours < 1 ? 'text-amber-400' : 'text-emerald-400'}>
                    {cap.freeBufferHours}h
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

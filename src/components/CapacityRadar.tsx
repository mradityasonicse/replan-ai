import React from 'react'
import {
  Clock,
  BatteryCharging,
  ShieldAlert,
  Moon,
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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 backdrop-blur-md shadow-xl mb-6">
      {/* Top Telemetry Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300 font-mono flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-sky-400" />
              Cognitive Capacity & Sanity Guardrails
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Active Protection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balancing of cognitive focus limits, mandatory buffers, and sleep hygiene
          </p>
        </div>

        {/* High Level Numbers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Study Needed vs Planned</div>
              <div className="text-xs font-bold text-slate-100">
                {metrics.totalStudyHoursScheduled}h{' '}
                <span className="text-slate-500 font-normal">/ {metrics.totalStudyHoursNeeded}h needed</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Guarded Sleep</div>
              <div className="text-xs font-bold text-slate-100">
                {preferences.targetSleepHours}h/night{' '}
                <span className="text-emerald-400 font-normal">({preferences.bedTime})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deficit Alert Banner if any day exceeds capacity */}
      {hasDeficits && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-300">Workload Capacity Warning: </span>
            {metrics.daysWithDeficit.join(', ')} {metrics.daysWithDeficit.length === 1 ? 'is' : 'are'} in deficit. 
            Fixed lectures, commitments, and deadline sprints exceed recommended daily limits. Use the{' '}
            <strong className="text-amber-100 underline decoration-amber-400">Life Happened / Recovery Tool</strong> to re-distribute sessions before burnout hits.
          </div>
        </div>
      )}

      {/* 7-Day Capacity Bars */}
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
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-950/50'
                  : isModerate
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-slate-200">{cap.day}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isModerate
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isCritical ? 'Deficit' : isModerate ? 'Busy' : 'Balanced'}
                </span>
              </div>

              {/* Mini load bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCritical
                      ? 'bg-rose-500'
                      : isModerate
                      ? 'bg-amber-500'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Hours Breakdown */}
              <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 font-mono">
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
    </div>
  )
}

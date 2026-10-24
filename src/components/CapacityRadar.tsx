import React, { useRef, useState } from 'react'
import {
  Clock,
  ShieldAlert,
  Moon,
  Activity,
  Zap,
  BatteryCharging,
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

interface DayCapacityCardProps {
  cap: ReturnType<typeof computeDailyCapacity>
}

const DayCapacityCard: React.FC<DayCapacityCardProps> = ({ cap }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false })

  const totalLogged = cap.fixedCommitmentHours + cap.studyPlannedHours + cap.personalHours
  const pct = Math.min(100, Math.round((totalLogged / cap.totalAwakeHours) * 100))

  const isCritical = cap.burnoutRisk === 'critical'
  const isModerate = cap.burnoutRisk === 'moderate'

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -5
    const rotateY = ((x - centerX) / centerX) * 5
    setTilt({ x: rotateX, y: rotateY, mouseX: x, mouseY: y, isHovered: true })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl p-3 border transition-all duration-150 overflow-hidden select-none ${
        isCritical
          ? 'bg-rose-950/25 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
          : isModerate
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-[#080c14]/90 border-white/[0.08] hover:border-white/20'
      }`}
      style={{
        transform: tilt.isHovered
          ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
          : 'perspective(700px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: tilt.isHovered ? 'transform 0.08s ease-out' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Cursor spotlight */}
      {tilt.isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle 120px at ${tilt.mouseX}px ${tilt.mouseY}px, rgba(255, 255, 255, 0.08), transparent 70%)`,
          }}
        />
      )}

      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-xs font-bold font-mono text-white">{cap.day}</span>
        <span
          className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded uppercase ${
            isCritical
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : isModerate
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isCritical ? 'Deficit' : isModerate ? 'Dense' : 'Optimal'}
        </span>
      </div>

      {/* High-precision micro bar */}
      <div className="w-full bg-slate-900/90 rounded-full h-1.5 mb-2.5 overflow-hidden border border-white/5 relative z-10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCritical
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
              : isModerate
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Data Breakdown */}
      <div className="text-[10px] text-slate-400 flex flex-col gap-1 font-mono relative z-10">
        <div className="flex justify-between">
          <span>Lectures:</span>
          <span className="text-slate-300">{cap.fixedCommitmentHours}h</span>
        </div>
        <div className="flex justify-between">
          <span>Study:</span>
          <span className="text-sky-300 font-semibold">{cap.studyPlannedHours}h</span>
        </div>
        <div className="flex justify-between">
          <span>Buffer:</span>
          <span className={cap.freeBufferHours < 1 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {cap.freeBufferHours}h
          </span>
        </div>
      </div>
    </div>
  )
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
  const totalFreeBufferHours = dailyCapacities.reduce((acc, c) => acc + c.freeBufferHours, 0)

  return (
    <section className="specular-card rounded-2xl p-4 lg:p-5 mb-6">
      {/* Telemetry Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Cognitive Load Telemetry & Guardrails
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Sleep Guard Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Real-time balancing of cognitive focus limits (max {preferences.maxDailyDeepWorkHours}h/day), transition buffers, and sleep hygiene.
          </p>
        </div>

        {/* Precision Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#06080e] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-md">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase font-mono text-slate-400">Study Needed vs Planned</div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {metrics.totalStudyHoursScheduled}h{' '}
                <span className="text-slate-500 font-normal">/ {metrics.totalStudyHoursNeeded}h needed</span>
              </div>
            </div>
          </div>

          <div className="bg-[#06080e] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-md">
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase font-mono text-slate-400">Guarded Sleep</div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {preferences.targetSleepHours}h/night{' '}
                <span className="text-emerald-400 font-normal font-mono">({preferences.bedTime})</span>
              </div>
            </div>
          </div>

          <div className="bg-[#06080e] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-md hidden sm:flex">
            <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase font-mono text-slate-400">Resilience Buffer</div>
              <div className="text-xs font-bold font-mono text-emerald-300">
                {totalFreeBufferHours.toFixed(1)}h reserve
              </div>
            </div>
          </div>

          <div className="bg-[#06080e] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-md hidden sm:flex">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase font-mono text-slate-400">Daily Focus Limit</div>
              <div className="text-xs font-bold font-mono text-amber-300">
                {preferences.maxDailyDeepWorkHours}h/day cap
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
        {dailyCapacities.map((cap) => (
          <DayCapacityCard key={cap.day} cap={cap} />
        ))}
      </div>
    </section>
  )
}

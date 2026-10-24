import React from 'react'
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Play,
} from 'lucide-react'
import type { ScheduledBlock, AcademicDeadline, StudentPreferences } from '../types'
import { sound } from '../utils/sound'

interface DashboardViewProps {
  blocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
  preferences: StudentPreferences
  bounceBacks: number
  onToggleComplete: (blockId: string) => void
  onMarkMissed: (blockId: string) => void
  onOpenFocusMode: (block: ScheduledBlock) => void
  onOpenAddModal: () => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  blocks,
  deadlines,
  preferences,
  bounceBacks,
  onToggleComplete,
  onMarkMissed,
  onOpenFocusMode,
  onOpenAddModal,
}) => {
  const currentDay = preferences.currentDay || 'Mon'

  // Calculations
  const totalHoursNeeded = deadlines.reduce((acc, d) => acc + d.estimatedHours, 0)
  const totalHoursDone = deadlines.reduce((acc, d) => acc + d.completedHours, 0)
  const progressPct = totalHoursNeeded > 0
    ? Math.min(100, Math.round((totalHoursDone / totalHoursNeeded) * 100))
    : 0

  // Free study time left
  const studyBlocks = blocks.filter((b) => b.type === 'study_sprint' && b.status !== 'displaced')
  const totalStudyScheduledHours = studyBlocks.reduce((acc, b) => acc + b.durationMinutes / 60, 0)
  const freeStudyCapacity = Math.max(0, Number((preferences.maxDailyDeepWorkHours * 7 - totalStudyScheduledHours).toFixed(1)))

  // Today's blocks
  const todayBlocks = blocks.filter((b) => b.dayOfWeek === currentDay)

  return (
    <div className="space-y-6 select-none">
      {/* Top Bento Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Circular Progress */}
        <div className="specular-card rounded-2xl p-5 flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-white/[0.08]"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-sky-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - progressPct / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute font-mono font-bold text-lg text-white">
              {progressPct}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Academic Progress</span>
            <h3 className="text-xl font-bold font-display text-white">{totalHoursDone.toFixed(1)} of {totalHoursNeeded.toFixed(1)}h</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">Deliverable effort completed</p>
          </div>
        </div>

        {/* Card 2: Free Study Capacity */}
        <div className="specular-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Headroom Buffer</span>
            <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{freeStudyCapacity}h Free</h3>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Available study capacity within your {preferences.maxDailyDeepWorkHours}h daily limit.
          </p>
        </div>

        {/* Card 3: Bounce-Backs */}
        <div className="specular-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Resilience Score</span>
            <h3 className="text-2xl font-bold font-mono text-amber-400 mt-0.5">{bounceBacks} Bounce-Backs</h3>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Times a missed session was auto-rescheduled without touching sleep.
          </p>
        </div>
      </div>

      {/* Middle Row: Today's Plan & Workload Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Plan Stream */}
        <div className="lg:col-span-8 specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold font-display text-white">Today’s Schedule · {currentDay}</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {todayBlocks.length} Blocks
            </span>
          </div>

          {todayBlocks.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-slate-500">
              No sessions scheduled for today. Enjoy the breathing room or ingest a new task.
            </div>
          ) : (
            <div className="space-y-2">
              {todayBlocks.map((block) => {
                const isStudy = block.type === 'study_sprint'
                const isDone = block.status === 'completed'

                return (
                  <div
                    key={block.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isDone
                        ? 'bg-slate-950/40 border-white/[0.04] opacity-50'
                        : isStudy
                        ? 'bg-[#080d18] border-sky-500/20 hover:border-sky-500/40'
                        : 'bg-[#080a12] border-white/[0.08]'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-slate-400">{block.startTime} - {block.endTime}</span>
                        {block.courseCode && (
                          <span className="text-sky-400 font-bold uppercase">[{block.courseCode}]</span>
                        )}
                      </div>
                      <h4 className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                        {block.title}
                      </h4>
                    </div>

                    {isStudy && !isDone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            sound.playClick()
                            onOpenFocusMode(block)
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Focus</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playComplete()
                            onToggleComplete(block.id)
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold transition-all cursor-pointer"
                        >
                          Done
                        </button>

                        <button
                          onClick={() => {
                            sound.playAlert()
                            onMarkMissed(block.id)
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-mono transition-all cursor-pointer"
                          title="Missed this block — reschedule automatically"
                        >
                          Missed
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Workload Alerts */}
        <div className="lg:col-span-4 specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-display text-white">Workload Alerts</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">All Clear:</strong>
                <span>Your week is realistic and sleep schedule is guarded.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-slate-400">
              <span className="text-slate-200 font-bold block mb-1">Guarded Rest:</span>
              Sleep anchor starts at <strong>{preferences.bedTime}</strong> every night.
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Academic Deadlines */}
      <div className="specular-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold font-display text-white">Upcoming Academic Deadlines</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            + Quick Add
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {deadlines.map((dl) => (
            <div
              key={dl.id}
              className="p-3.5 rounded-xl bg-[#06080e]/90 border border-white/[0.08] hover:border-white/20 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                  {dl.courseCode}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  Due {dl.dueDay}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{dl.title}</h4>
              <div className="text-[11px] font-mono text-slate-400">
                {dl.completedHours.toFixed(1)} / {dl.estimatedHours.toFixed(1)}h done
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

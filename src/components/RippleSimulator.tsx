import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import {
  Waves,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react'
import type {
  DayOfWeek,
  ClassCommitment,
  PersonalCommitment,
  AcademicDeadline,
  StudentPreferences,
  RippleSimulation,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import { runRippleSimulation } from '../utils/rippleSimulator'
import { sound } from '../utils/sound'

interface RippleSimulatorProps {
  classes: ClassCommitment[]
  personal: PersonalCommitment[]
  deadlines: AcademicDeadline[]
  preferences: StudentPreferences
  onApplyRevisedPlan: (newDeadlines: AcademicDeadline[], newPersonal: PersonalCommitment[]) => void
}

export const RippleSimulator: React.FC<RippleSimulatorProps> = ({
  classes,
  personal,
  deadlines,
  preferences,
  onApplyRevisedPlan,
}) => {
  const [disruptionType, setDisruptionType] = useState<'lost' | 'task'>('lost')

  // Disruption inputs
  const [lostDay, setLostDay] = useState<DayOfWeek>('Tue')
  const [lostStartTime, setLostStartTime] = useState<string>('14:00')
  const [lostHours, setLostHours] = useState<number>(2.5)

  const [taskTitle, setTaskTitle] = useState<string>('Surprise Problem Set 4')
  const [taskDueDay, setTaskDueDay] = useState<DayOfWeek>('Fri')
  const [taskHours, setTaskHours] = useState<number>(4.0)

  // Simulation State
  const [simulation, setSimulation] = useState<RippleSimulation | null>(null)
  const [activeTimelineView, setActiveTimelineView] = useState<'revised' | 'original'>('revised')
  const [isWaving, setIsWaving] = useState(false)

  const handleRunRipple = () => {
    sound.playAlert()
    setIsWaving(true)
    setTimeout(() => setIsWaving(false), 1200)

    const result = runRippleSimulation(
      {
        type: disruptionType,
        lostDay,
        lostStartTime,
        lostHours,
        taskTitle,
        taskDueDay,
        taskHours,
      },
      classes,
      personal,
      deadlines,
      preferences
    )

    setSimulation(result)
    setActiveTimelineView('revised')
  }

  const handleApply = () => {
    if (!simulation) return
    sound.playSuccessChime()
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#34d399', '#fbbf24', '#818cf8'],
    })

    if (disruptionType === 'task') {
      const newDl: AcademicDeadline = {
        id: `dl-${Date.now()}`,
        courseCode: 'ACAD',
        title: taskTitle.trim() || 'New Assignment',
        dueDay: taskDueDay,
        dueTime: '23:59',
        estimatedHours: taskHours,
        completedHours: 0,
        priority: 'critical',
        energyRequirement: 'deep_work',
        weightPercentage: 15,
      }
      onApplyRevisedPlan([...deadlines, newDl], personal)
    } else {
      const startMin = parseInt(lostStartTime.split(':')[0]) * 60 + parseInt(lostStartTime.split(':')[1])
      const endMin = startMin + Math.round(lostHours * 60)
      const endHour = Math.floor(endMin / 60)
      const endMinute = endMin % 60
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`

      const newPersonalCommitment: PersonalCommitment = {
        id: `blocked-${Date.now()}`,
        title: `Disruption (Lost ${lostHours}h)`,
        dayOfWeek: lostDay,
        startTime: lostStartTime,
        endTime: endTimeStr,
        flexibility: 'immovable',
        category: 'health',
        color: '#f43f5e',
      }
      onApplyRevisedPlan(deadlines, [...personal, newPersonalCommitment])
    }

    setSimulation(null)
  }

  const handleRevert = () => {
    sound.playClick()
    setSimulation(null)
  }

  const currentDisplayBlocks = simulation
    ? activeTimelineView === 'revised'
      ? simulation.revisedBlocks
      : simulation.originalBlocks
    : []

  return (
    <div className="space-y-6">
      {/* Simulator Hero & Disruption Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Disruption Input Controls */}
        <div className="lg:col-span-5 specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">What Changed?</h3>
                <p className="text-[11px] text-slate-400 font-mono">Select real-world schedule shock</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              Ripple Engine
            </span>
          </div>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#06080e] rounded-xl border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => {
                sound.playClick()
                setDisruptionType('lost')
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                disruptionType === 'lost'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lose Time</span>
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setDisruptionType('task')
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                disruptionType === 'task'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
          </div>

          {/* Form Fields */}
          {disruptionType === 'lost' ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Disrupted Day</label>
                  <select
                    value={lostDay}
                    onChange={(e) => setLostDay(e.target.value as DayOfWeek)}
                    className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Starts At</label>
                  <input
                    type="time"
                    value={lostStartTime}
                    onChange={(e) => setLostStartTime(e.target.value)}
                    className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Hours Lost</span>
                  <span className="text-amber-400 font-bold">{lostHours} hours</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.5"
                  value={lostHours}
                  onChange={(e) => setLostHours(parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Assignment Name</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Lab 4"
                  className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-sans text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Due Day</label>
                  <select
                    value={taskDueDay}
                    onChange={(e) => setTaskDueDay(e.target.value as DayOfWeek)}
                    className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Hours Needed</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={taskHours}
                    onChange={(e) => setTaskHours(parseFloat(e.target.value))}
                    className="w-full bg-[#06080e] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleRunRipple}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2"
          >
            <Waves className="w-4 h-4" />
            <span>🌊 Run Ripple Simulation</span>
          </button>
        </div>

        {/* Right Card: Simulation Outcome Summary */}
        <div className="lg:col-span-7 specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold font-display text-white">Ripple Impact & Workload Check</h3>
            </div>
            {simulation && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">View:</span>
                <div className="inline-flex rounded-lg bg-[#06080e] p-0.5 border border-white/10 text-[10px] font-mono">
                  <button
                    onClick={() => setActiveTimelineView('original')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      activeTimelineView === 'original'
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setActiveTimelineView('revised')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      activeTimelineView === 'revised'
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Revised (Ripple)
                  </button>
                </div>
              </div>
            )}
          </div>

          {!simulation ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-3">
                <Waves className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">Choose a Disruption & Run Ripple</h4>
              <p className="text-xs text-slate-400 max-w-md">
                You will see how every task shifts, check whether deadlines still fit within safe limits, and verify bedtime protection before changing your real schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Disruption Alert */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-200 flex items-center justify-between">
                <span>
                  <strong>Scenario:</strong> {simulation.disruptionSummary}
                </span>
                <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded text-sky-300 font-bold">
                  {simulation.moves.length} Shifts Simulated
                </span>
              </div>

              {/* Workload Check */}
              {simulation.conflicts.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Every deadline still fits safely:</strong> Fixed classes and guarded sleep were untouched.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs text-rose-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Capacity Deficit Detected:</span>
                  </div>
                  {simulation.conflicts.map((c, i) => (
                    <div key={i} className="pl-6 text-[11px] font-mono text-rose-200">
                      • <strong>{c.taskTitle}:</strong> {c.unplacedHours}h cannot fit before {c.dueDay} without sleep loss.
                    </div>
                  ))}
                </div>
              )}

              {/* Apply or Revert Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleApply}
                  className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-display font-bold text-xs transition-all cursor-pointer shadow-lg shadow-sky-400/25 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply New Plan</span>
                </button>
                <button
                  onClick={handleRevert}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revert</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Causal Explanation Section: Why Things Moved */}
      {simulation && (
        <div className="specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Why Things Moved (Causal Cascade Analysis)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Deterministic Reasoning Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simulation.moves.map((move, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#06080e]/90 border border-white/[0.08] space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-sans">{move.taskTitle}</span>
                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                    Shifted
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="truncate max-w-[140px] text-slate-500 line-through">{move.from}</span>
                  <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="text-sky-300 font-semibold truncate max-w-[150px]">{move.to}</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.04] leading-relaxed">
                  {move.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week Timeline Visualization */}
      {simulation && (
        <div className="specular-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Timeline Diff: {activeTimelineView === 'revised' ? 'Revised Plan' : 'Original Plan'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {activeTimelineView === 'revised' ? 'Showing newly shifted slots' : 'Showing prior state'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day, dIdx) => {
              const dayBlocks = currentDisplayBlocks.filter((b) => b.dayOfWeek === day)

              return (
                <div
                  key={day}
                  className={`rounded-xl p-3 border flex flex-col min-h-[300px] transition-all duration-300 ${
                    isWaving ? 'scale-[1.02] border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : ''
                  } ${
                    day === simulation.affectedDay
                      ? 'bg-sky-950/20 border-sky-500/40 ring-1 ring-sky-500/30'
                      : 'bg-[#06080e]/90 border-white/[0.08]'
                  }`}
                  style={{
                    transitionDelay: `${dIdx * 100}ms`,
                  }}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                    <span className="text-xs font-bold font-mono text-white">{day}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dayBlocks.length} blocks
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {dayBlocks.length === 0 ? (
                      <div className="text-[10px] font-mono text-slate-600 text-center py-8">
                        Free Slot
                      </div>
                    ) : (
                      dayBlocks.map((b) => {
                        const key = `${b.dayOfWeek}-${b.startTime}-${b.referenceId || b.title}`
                        const isMoved = simulation.movedBlockKeys.has(key)
                        const isNew = simulation.newBlockKeys.has(key)

                        return (
                          <div
                            key={b.id}
                            className={`p-2 rounded-lg text-[11px] font-mono border ${
                              isNew
                                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md ring-1 ring-sky-400'
                                : isMoved
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                                : 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] text-slate-400">
                                {b.startTime} - {b.endTime}
                              </span>
                              {isNew ? (
                                <span className="text-[8px] font-bold px-1 rounded bg-sky-400 text-slate-950 uppercase">
                                  ✦ New
                                </span>
                              ) : isMoved ? (
                                <span className="text-[8px] font-bold px-1 rounded bg-amber-400 text-slate-950 uppercase">
                                  ↦ Moved
                                </span>
                              ) : null}
                            </div>
                            <div className="font-semibold text-white truncate">{b.title}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

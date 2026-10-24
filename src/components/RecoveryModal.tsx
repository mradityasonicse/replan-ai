import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Zap,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Sliders,
} from 'lucide-react'
import type {
  DayOfWeek,
  ScheduledBlock,
  AcademicDeadline,
  PersonalCommitment,
  StudentPreferences,
  DisruptionEvent,
  RecoveryProposal,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import { computeRecoveryPlan } from '../utils/recovery'
import { sound } from '../utils/sound'

interface RecoveryModalProps {
  isOpen: boolean
  onClose: () => void
  currentBlocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
  personal: PersonalCommitment[]
  preferences: StudentPreferences
  onApplyRecoveryPlan: (proposal: RecoveryProposal) => void
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  currentBlocks,
  deadlines,
  personal,
  preferences,
  onApplyRecoveryPlan,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0)
  const [customDay, setCustomDay] = useState<DayOfWeek>('Mon')
  const [customLostHours, setCustomLostHours] = useState<number>(2.5)
  const [customStartTime, setCustomStartTime] = useState<string>('08:00')
  const [selectedDeadlineId] = useState<string>(
    deadlines[0]?.id || ''
  )
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')

  const presetDisruptions: DisruptionEvent[] = [
    {
      id: 'pre-overslept',
      type: 'overslept',
      title: 'Overslept Morning Focus Block',
      description: 'Alarm failed or exhausted; lost 2.5 hours of morning study time.',
      day: 'Mon',
      timeLostMinutes: 150,
      startDisruptionTime: preferences.wakeTime,
    },
    {
      id: 'pre-lab-late',
      type: 'class_extended',
      title: 'Lab Session Ran Overtime',
      description: 'Chemistry / Engineering lab overran by 2 hours, eating into planned homework.',
      day: 'Wed',
      timeLostMinutes: 120,
      startDisruptionTime: '15:00',
    },
    {
      id: 'pre-task-longer',
      type: 'task_longer',
      title: 'Assignment Took 2.5h Longer',
      description: 'Hit difficult bug or research wall; need extra hours for deep work.',
      day: 'Tue',
      timeLostMinutes: 150,
      affectedDeadlineId: selectedDeadlineId,
    },
    {
      id: 'pre-burnout',
      type: 'sick_burnout',
      title: 'Exhaustion / Burnout (Take Night Off)',
      description: 'Cognitive tank is at zero. Drop evening study to sleep early and reset.',
      day: 'Thu',
      timeLostMinutes: 180,
      startDisruptionTime: '18:00',
    },
  ]

  const activeDisruption: DisruptionEvent =
    activeTab === 'presets'
      ? presetDisruptions[selectedPresetIndex]
      : {
          id: 'custom-event',
          type: 'custom_lost_time',
          title: `Lost ${customLostHours}h on ${customDay}`,
          description: `Custom schedule disruption beginning at ${customStartTime}.`,
          day: customDay,
          timeLostMinutes: Math.round(customLostHours * 60),
          startDisruptionTime: customStartTime,
        }

  const proposal: RecoveryProposal = computeRecoveryPlan(
    activeDisruption,
    currentBlocks,
    deadlines,
    personal,
    preferences
  )

  const handleApply = () => {
    sound.playSuccessChime()
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#10b981', '#f59e0b', '#818cf8'],
    })
    onApplyRecoveryPlan(proposal)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Academic Recovery Center
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    Cascade Solver
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  When life happens, recalculate your plan in milliseconds instead of abandoning your week.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {/* Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => {
                  sound.playClick()
                  setActiveTab('presets')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Common Student Crises
              </button>
              <button
                onClick={() => {
                  sound.playClick()
                  setActiveTab('custom')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Custom Disruption Slider
              </button>
            </div>

            {/* Presets Grid */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presetDisruptions.map((dis, idx) => (
                  <button
                    key={dis.id}
                    onClick={() => {
                      sound.playClick()
                      setSelectedPresetIndex(idx)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetIndex === idx
                        ? 'bg-sky-500/10 border-sky-400 text-white shadow-lg shadow-sky-950/40 ring-1 ring-sky-400'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-amber-400">
                        {dis.day} · {dis.timeLostMinutes / 60}h Impact
                      </span>
                      {selectedPresetIndex === idx && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-100">{dis.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{dis.description}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Custom Disruption Form */}
            {activeTab === 'custom' && (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">
                      Disrupted Day:
                    </label>
                    <select
                      value={customDay}
                      onChange={(e) => setCustomDay(e.target.value as DayOfWeek)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">
                      Starting At:
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">
                      Lost Hours: <span className="text-amber-400 font-bold">{customLostHours} hrs</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="6.0"
                      step="0.5"
                      value={customLostHours}
                      onChange={(e) => setCustomLostHours(parseFloat(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Recovery Proposal Visualizer */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Recovery Solver Solution
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confidence:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {proposal.confidenceScore}% Viable
                  </span>
                </div>
              </div>

              {/* Trade-Off Narrative */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  Automated Cascade Actions:
                </div>
                {proposal.tradeoffSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-2.5 rounded-lg flex items-start gap-2.5 ${
                      idx === 0
                        ? 'bg-sky-500/10 border border-sky-500/30 text-sky-200 font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Deadlines at Risk Alert if any */}
              {proposal.deadlinesAtRisk.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Capacity Limit Exceeded - Action Required:</span>
                  </div>
                  {proposal.deadlinesAtRisk.map((risk, idx) => (
                    <div key={idx} className="text-xs text-rose-200 pl-6">
                      <strong>{risk.title}:</strong> {risk.suggestedAction}
                    </div>
                  ))}
                </div>
              )}

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Sessions Rescheduled</div>
                  <div className="text-sm font-bold text-sky-400">{proposal.rescheduledCount}</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Protected Sleep</div>
                  <div className="text-sm font-bold text-emerald-400">100% Guarded</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 font-mono">Optional Dropped</div>
                  <div className="text-sm font-bold text-slate-300">
                    {proposal.droppedOptionalCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept & Apply Recovery Plan</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

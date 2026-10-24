import React from 'react'
import {
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
} from 'lucide-react'
import type { AcademicDeadline } from '../types'
import { sliceDeadlineIntoSprints } from '../utils/scheduler'
import { sound } from '../utils/sound'

interface DeadlinesListProps {
  deadlines: AcademicDeadline[]
  onUpdateCompletedHours: (deadlineId: string, deltaHours: number) => void
  onOpenExtensionDraft?: (deadline: AcademicDeadline) => void
}

export const DeadlinesList: React.FC<DeadlinesListProps> = ({
  deadlines,
  onUpdateCompletedHours,
  onOpenExtensionDraft,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 lg:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Active Academic Deliverables & Work Slices
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-sliced into cognitive sprints to prevent panic crunching
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          {deadlines.length} Deliverables Tracked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {deadlines.map((dl) => {
          const isDone = dl.completedHours >= dl.estimatedHours
          const progressPct = Math.min(
            100,
            Math.round((dl.completedHours / dl.estimatedHours) * 100)
          )
          const sprints = sliceDeadlineIntoSprints(dl)
          const isExpanded = expandedId === dl.id

          return (
            <div
              key={dl.id}
              className={`rounded-xl p-3 border transition-all ${
                isDone
                  ? 'bg-slate-950/30 border-slate-800/60 opacity-60'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                  {dl.courseCode}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                    dl.priority === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : dl.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {dl.priority}
                </span>
              </div>

              {/* Title & Due Info */}
              <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 mb-1" title={dl.title}>
                {dl.title}
              </h4>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>
                    Due <strong className="text-slate-200">{dl.dueDay}</strong> @ {dl.dueTime}
                  </span>
                </div>

                {onOpenExtensionDraft && (
                  <button
                    onClick={() => {
                      sound.playClick()
                      onOpenExtensionDraft(dl)
                    }}
                    className="text-[10px] text-slate-500 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Draft extension request email"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Draft Email</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Progress</span>
                  <span className="text-slate-200">
                    {dl.completedHours.toFixed(1)} / {dl.estimatedHours.toFixed(1)} hrs ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Actions & Smart Slices Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                <button
                  onClick={() => {
                    sound.playClick()
                    setExpandedId(isExpanded ? null : dl.id)
                  }}
                  className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>{sprints.length} Sprints</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      sound.playComplete()
                      onUpdateCompletedHours(dl.id, 0.5)
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors cursor-pointer"
                    title="Log 30 mins work"
                  >
                    +30m
                  </button>
                  <button
                    onClick={() => {
                      sound.playComplete()
                      onUpdateCompletedHours(dl.id, 1.0)
                    }}
                    className="px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-mono transition-colors cursor-pointer"
                    title="Log 1 hour work"
                  >
                    +1h
                  </button>
                </div>
              </div>

              {/* Expanded Slices List */}
              {isExpanded && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Scheduled Slices:</div>
                  {sprints.map((sp, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] bg-slate-900/80 border border-slate-800 p-1.5 rounded flex items-center justify-between text-slate-300"
                    >
                      <span>{sp.stage}</span>
                      <span className="font-mono text-sky-400">{sp.durationMinutes}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

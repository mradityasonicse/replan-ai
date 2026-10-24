import React, { useState, useRef } from 'react'
import {
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
  Plus,
} from 'lucide-react'
import type { AcademicDeadline } from '../types'
import { sliceDeadlineIntoSprints } from '../utils/scheduler'
import { sound } from '../utils/sound'

interface DeadlinesListProps {
  deadlines: AcademicDeadline[]
  onUpdateCompletedHours: (deadlineId: string, deltaHours: number) => void
  onOpenExtensionDraft?: (deadline: AcademicDeadline) => void
  onOpenAddModal?: () => void
}

interface DeadlineCardItemProps {
  dl: AcademicDeadline
  onUpdateCompletedHours: (deadlineId: string, deltaHours: number) => void
  onOpenExtensionDraft?: (deadline: AcademicDeadline) => void
}

const DeadlineCardItem: React.FC<DeadlineCardItemProps> = ({
  dl,
  onUpdateCompletedHours,
  onOpenExtensionDraft,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false })
  const [isExpanded, setIsExpanded] = useState(false)

  const isDone = dl.completedHours >= dl.estimatedHours
  const progressPct = Math.min(100, Math.round((dl.completedHours / dl.estimatedHours) * 100))
  const sprints = sliceDeadlineIntoSprints(dl)

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
      className={`relative group rounded-xl p-3.5 border transition-all duration-150 overflow-hidden select-none ${
        isDone
          ? 'bg-[#06080e]/60 border-white/[0.04] opacity-55'
          : 'bg-[#080c16]/90 border-white/[0.08] hover:border-sky-500/40 shadow-xl shadow-black/40'
      }`}
      style={{
        transform: tilt.isHovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: tilt.isHovered ? 'transform 0.08s ease-out' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Specular Glare Follower */}
      {tilt.isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle 160px at ${tilt.mouseX}px ${tilt.mouseY}px, rgba(56, 189, 248, 0.09), transparent 70%)`,
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-xs font-bold font-mono tracking-wider text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
          {dl.courseCode}
        </span>
        <span
          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase flex items-center gap-1.5 ${
            dl.priority === 'critical'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : dl.priority === 'high'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dl.priority === 'critical'
                ? 'bg-rose-400 animate-pulse'
                : dl.priority === 'high'
                ? 'bg-amber-400'
                : 'bg-sky-400'
            }`}
          />
          {dl.priority}
        </span>
      </div>

      {/* Title & Due Info */}
      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1 mb-1 relative z-10" title={dl.title}>
        {dl.title}
      </h4>
      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-400" />
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
            className="text-[10px] text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/5"
            title="Draft formal extension request email"
          >
            <Mail className="w-3 h-3" />
            <span>Draft Email</span>
          </button>
        )}
      </div>

      {/* Progress Gauge */}
      <div className="space-y-1.5 mb-3 relative z-10">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>Effort Completed</span>
          <span className="text-slate-200 font-semibold">
            {dl.completedHours.toFixed(1)} / {dl.estimatedHours.toFixed(1)}h ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-900/90 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDone
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : 'bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Actions & Sprints Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] relative z-10">
        <button
          onClick={() => {
            sound.playClick()
            setIsExpanded(!isExpanded)
          }}
          className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>{sprints.length} Sprints</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playComplete()
              onUpdateCompletedHours(dl.id, 0.5)
            }}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-mono transition-colors cursor-pointer border border-white/5 hover:border-white/15"
            title="Log 30 mins deep work"
          >
            +30m
          </button>
          <button
            onClick={() => {
              sound.playComplete()
              onUpdateCompletedHours(dl.id, 1.0)
            }}
            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-mono transition-colors cursor-pointer border border-sky-500/30"
            title="Log 1 hour deep work"
          >
            +1h
          </button>
        </div>
      </div>

      {/* Expanded Slices List */}
      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.06] space-y-1.5 relative z-10">
          <div className="text-[10px] font-mono text-slate-400">Auto-allocated study sprints:</div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {sprints.map((s, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 rounded-lg p-1.5 text-[10px] font-mono flex items-center justify-between border border-white/5"
              >
                <span className="text-slate-300 truncate max-w-[130px]">{s.stage}</span>
                <span className="text-sky-400 font-semibold shrink-0">{s.durationMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const DeadlinesList: React.FC<DeadlinesListProps> = ({
  deadlines,
  onUpdateCompletedHours,
  onOpenExtensionDraft,
  onOpenAddModal,
}) => {
  return (
    <div className="specular-card rounded-2xl p-4 lg:p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Active Academic Deliverables & Work Slices
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-sliced into cognitive sprints to prevent panic crunching
          </p>
        </div>
        <span className="text-xs font-mono text-slate-300 bg-[#06080e] px-2.5 py-1 rounded-lg border border-white/10">
          {deadlines.length} Deliverables Tracked
        </span>
      </div>

      {deadlines.length === 0 ? (
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">No Academic Deadlines Logged</h4>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Add your problem sets, papers, and lab reports. ChronoFlow will automatically calculate the required effort and slice them into manageable sprints.
          </p>
          {onOpenAddModal && (
            <button
              onClick={() => {
                sound.playClick()
                onOpenAddModal()
              }}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Your First Deliverable / Paste Syllabus</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {deadlines.map((dl) => (
            <DeadlineCardItem
              key={dl.id}
              dl={dl}
              onUpdateCompletedHours={onUpdateCompletedHours}
              onOpenExtensionDraft={onOpenExtensionDraft}
            />
          ))}
        </div>
      )}
    </div>
  )
}

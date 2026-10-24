import React from 'react'
import {
  Layers,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react'
import type { AcademicDeadline, ClassCommitment, PersonalCommitment } from '../types'
import { sound } from '../utils/sound'

interface TasksManagerProps {
  deadlines: AcademicDeadline[]
  classes: ClassCommitment[]
  personal: PersonalCommitment[]
  onOpenAddModal: () => void
  onDeleteDeadline: (id: string) => void
  onDeleteClass: (id: string) => void
  onDeletePersonal: (id: string) => void
}

export const TasksManager: React.FC<TasksManagerProps> = ({
  deadlines,
  classes,
  personal,
  onOpenAddModal,
  onDeleteDeadline,
  onDeleteClass,
  onDeletePersonal,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      {/* Left Column: Academic Deadlines */}
      <div className="lg:col-span-6 specular-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold font-display text-white">Academic Deliverables</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deadline</span>
          </button>
        </div>

        {deadlines.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No academic deliverables logged. Click + Add Deadline to ingest.
          </div>
        ) : (
          <div className="space-y-2.5">
            {deadlines.map((dl) => (
              <div
                key={dl.id}
                className="p-3.5 rounded-xl bg-[#06080e]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                      {dl.courseCode}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded uppercase ${
                        dl.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : dl.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {dl.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{dl.title}</h4>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>Due: <strong>{dl.dueDay}</strong> @ {dl.dueTime}</span>
                    <span>•</span>
                    <span className="text-slate-300">{dl.estimatedHours}h estimated</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playAlert()
                    onDeleteDeadline(dl.id)
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Deadline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Classes & Fixed Commitments */}
      <div className="lg:col-span-6 specular-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold font-display text-white">Classes & Fixed Commitments</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onOpenAddModal()
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class</span>
          </button>
        </div>

        {classes.length === 0 && personal.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No fixed lectures or personal commitments logged.
          </div>
        ) : (
          <div className="space-y-2.5">
            {classes.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-[#06080e]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {c.courseCode}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {c.dayOfWeek}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{c.courseName}</h4>
                  <div className="text-[11px] font-mono text-slate-400">
                    {c.startTime} - {c.endTime} {c.location ? `· ${c.location}` : ''}
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playAlert()
                    onDeleteClass(c.id)
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {personal.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-[#06080e]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                      {p.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{p.dayOfWeek}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                  <div className="text-[11px] font-mono text-slate-400">
                    {p.startTime} - {p.endTime} · {p.flexibility}
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playAlert()
                    onDeletePersonal(p.id)
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Commitment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

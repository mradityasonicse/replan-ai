import React from 'react'
import { Sunrise, Moon, Sparkles, CheckCircle2 } from 'lucide-react'
import type { DayOfWeek, ScheduledBlock, StudentPreferences } from '../types'
import { BlockCard } from './BlockCard'
import { timeToMinutes } from '../utils/time'

interface DayColumnProps {
  day: DayOfWeek
  blocks: ScheduledBlock[]
  preferences: StudentPreferences
  onToggleComplete: (blockId: string) => void
  onDisplaceBlock: (blockId: string) => void
  onOpenFocusMode?: (block: ScheduledBlock) => void
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  blocks,
  preferences,
  onToggleComplete,
  onDisplaceBlock,
  onOpenFocusMode,
}) => {
  const dayBlocks = blocks
  .filter((b) => b.dayOfWeek === day)
  .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const totalStudyMinutes = dayBlocks
    .filter((b) => b.type === 'study_sprint' && b.status !== 'displaced')
    .reduce((acc, b) => acc + b.durationMinutes, 0)

  const completedStudyCount = dayBlocks.filter(
    (b) => b.type === 'study_sprint' && b.status === 'completed'
  ).length

  const totalStudyCount = dayBlocks.filter(
    (b) => b.type === 'study_sprint'
  ).length

  return (
    <div className="specular-card rounded-2xl overflow-hidden flex flex-col min-h-[540px]">
      {/* Day Column Header */}
      <div className="p-3 bg-[#06080e]/95 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono tracking-wider text-white uppercase">{day}</span>
          {day === 'Sat' || day === 'Sun' ? (
            <span className="text-[9px] font-mono font-semibold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25">
              Weekend
            </span>
          ) : null}
        </div>

        {/* Planned study summary */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          {totalStudyMinutes > 0 ? (
            <span className="text-sky-300 font-semibold bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
              {(totalStudyMinutes / 60).toFixed(1)}h focus
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">Free Day</span>
          )}
          {totalStudyCount > 0 && completedStudyCount === totalStudyCount && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Blocks Timeline Stream */}
      <div className="p-2.5 flex-1 flex flex-col gap-2 overflow-y-auto">
        {/* Morning Wake Anchor */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1 py-0.5">
          <Sunrise className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
          <span className="text-slate-400">Wake: <strong className="text-slate-300">{preferences.wakeTime}</strong></span>
          <div className="flex-1 border-t border-white/[0.08] border-dashed" />
        </div>

        {dayBlocks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center my-8">
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-600 mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Unscheduled Day</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Available buffer zone for spillover recovery
            </p>
          </div>
        ) : (
          dayBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onToggleComplete={onToggleComplete}
              onDisplaceBlock={onDisplaceBlock}
              onOpenFocusMode={onOpenFocusMode}
            />
          ))
        )}

        {/* Night Bedtime Anchor */}
        <div className="mt-auto pt-2 flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1 py-0.5">
          <Moon className="w-3.5 h-3.5 text-indigo-400/90 shrink-0" />
          <span className="text-slate-400">Rest: <strong className="text-slate-300">{preferences.bedTime}</strong></span>
          <div className="flex-1 border-t border-white/[0.08] border-dashed" />
        </div>
      </div>
    </div>
  )
}

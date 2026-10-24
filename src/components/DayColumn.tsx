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
    <div className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[520px]">
      {/* Day Column Header */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono tracking-tight text-white">{day}</span>
          {day === 'Sat' || day === 'Sun' ? (
            <span className="text-[10px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              Weekend
            </span>
          ) : null}
        </div>

        {/* Planned study summary */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          {totalStudyMinutes > 0 ? (
            <span className="text-sky-300 font-semibold">
              {(totalStudyMinutes / 60).toFixed(1)}h focus
            </span>
          ) : (
            <span className="text-slate-500">Free Day</span>
          )}
          {totalStudyCount > 0 && completedStudyCount === totalStudyCount && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Blocks Timeline Stream */}
      <div className="p-2.5 flex-1 flex flex-col gap-2 overflow-y-auto">
        {/* Morning Wake Anchor */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1 py-0.5">
          <Sunrise className="w-3 h-3 text-amber-400/80" />
          <span>Wake: {preferences.wakeTime}</span>
          <div className="flex-1 border-t border-slate-800/60 border-dashed" />
        </div>

        {dayBlocks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="w-5 h-5 text-slate-600 mb-1" />
            <p className="text-xs text-slate-500 font-medium">Unscheduled Day</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
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
          <Moon className="w-3 h-3 text-indigo-400/80" />
          <span>Rest: {preferences.bedTime}</span>
          <div className="flex-1 border-t border-slate-800/60 border-dashed" />
        </div>
      </div>
    </div>
  )
}

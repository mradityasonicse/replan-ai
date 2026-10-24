import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  MapPin,
  Lock,
  ArrowRight,
  Play,
} from 'lucide-react'
import type { ScheduledBlock } from '../types'
import { sound } from '../utils/sound'

interface BlockCardProps {
  block: ScheduledBlock
  onToggleComplete: (blockId: string) => void
  onDisplaceBlock?: (blockId: string) => void
  onOpenFocusMode?: (block: ScheduledBlock) => void
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onToggleComplete,
  onDisplaceBlock,
  onOpenFocusMode,
}) => {
  const isCompleted = block.status === 'completed'
  const isDisplaced = block.status === 'displaced'
  const isInterrupted = block.status === 'interrupted'
  const isClass = block.type === 'class'
  const isStudy = block.type === 'study_sprint'
  const isRecovered = block.notes?.includes('Auto-Recovered') || block.notes?.includes('Reclaimed')

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playComplete()
    onToggleComplete(block.id)
  }

  const handleBump = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playAlert()
    if (onDisplaceBlock) onDisplaceBlock(block.id)
  }

  const handleCardClick = () => {
    if (isStudy && !isCompleted && onOpenFocusMode) {
      sound.playClick()
      onOpenFocusMode(block)
    }
  }

  return (
    <motion.div
      layout
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`relative group rounded-xl p-2.5 text-left border transition-all duration-150 ${
        isStudy && !isCompleted ? 'cursor-pointer hover:border-sky-400' : ''
      } ${
        isCompleted
          ? 'bg-slate-950/30 border-slate-800/50 opacity-60'
          : isDisplaced || isInterrupted
          ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
          : isClass
          ? 'bg-slate-900/90 border-slate-700/80 shadow-md'
          : isStudy
          ? 'bg-slate-900/95 border-sky-500/30 shadow-md shadow-sky-950/20'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
      }`}
      style={{
        borderLeftWidth: '3.5px',
        borderLeftColor: block.color || '#38bdf8',
      }}
    >
      {/* Top Bar: Time and Status/Badge */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>
            {block.startTime} - {block.endTime}
          </span>
          <span className="text-slate-500 text-[10px]">({block.durationMinutes}m)</span>
        </div>

        {/* Status icons or badges */}
        <div className="flex items-center gap-1">
          {isClass && (
            <span
              className="text-[10px] text-slate-400 bg-slate-800/80 px-1 py-0.2 rounded flex items-center gap-0.5"
              title="Fixed Course - Immovable"
            >
              <Lock className="w-2.5 h-2.5" />
              Class
            </span>
          )}

          {isRecovered && (
            <span className="text-[9px] font-semibold tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 rounded flex items-center gap-0.5 animate-pulse">
              <Sparkles className="w-2.5 h-2.5" />
              Recovered
            </span>
          )}

          {isDisplaced && (
            <span className="text-[9px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1 rounded">
              Needs Recovery
            </span>
          )}

          {isStudy && !isDisplaced && (
            <div className="flex items-center gap-1">
              <span
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded flex items-center gap-0.5"
                title="Start Focus Timer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                Focus
              </span>
              <button
                onClick={handleToggle}
                className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 cursor-pointer"
                title={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
                ) : (
                  <Circle className="w-4 h-4 hover:stroke-emerald-400" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title & Course Code */}
      <div className="flex flex-col">
        {block.courseCode && (
          <span className="text-[10px] font-bold tracking-wider font-mono text-sky-400 uppercase">
            {block.courseCode}
          </span>
        )}
        <h4
          className={`text-xs font-semibold leading-tight transition-all ${
            isCompleted
              ? 'line-through text-slate-500'
              : 'text-slate-100 group-hover:text-white'
          }`}
        >
          {block.title}
        </h4>
      </div>

      {/* Footnote / Stage notes */}
      {block.notes && (
        <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between gap-1">
          <span className="truncate flex items-center gap-1">
            {isClass ? <MapPin className="w-2.5 h-2.5 text-slate-500" /> : null}
            {block.notes}
          </span>

          {/* Quick bump action */}
          {isStudy && !isCompleted && onDisplaceBlock && (
            <button
              onClick={handleBump}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5"
              title="Disrupt this block and let Recovery Engine reschedule it"
            >
              <span>Bump</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

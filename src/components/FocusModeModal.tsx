import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Zap,
  Plus,
} from 'lucide-react'
import type { ScheduledBlock } from '../types'
import { sound } from '../utils/sound'

interface FocusModeModalProps {
  isOpen: boolean
  onClose: () => void
  activeBlock: ScheduledBlock | null
  onCompleteBlock: (blockId: string) => void
  onExtendSprint: (blockId: string, extraMinutes: number) => void
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  activeBlock,
  onCompleteBlock,
  onExtendSprint,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'brown'>('off')

  useEffect(() => {
    if (activeBlock) {
      setSecondsRemaining(activeBlock.durationMinutes * 60)
      setIsRunning(true)
    }
  }, [activeBlock])

  useEffect(() => {
    let interval: any = null
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            sound.playSuccessChime()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, secondsRemaining])

  const toggleAmbient = (type: 'rain' | 'brown') => {
    if (ambientSound === type) {
      sound.stopAmbientFocusSound()
      setAmbientSound('off')
    } else {
      sound.startAmbientFocusSound(type)
      setAmbientSound(type)
    }
  }

  const handleFinishEarly = () => {
    sound.stopAmbientFocusSound()
    sound.playSuccessChime()
    confetti({ particleCount: 70, spread: 60 })
    if (activeBlock) {
      onCompleteBlock(activeBlock.id)
    }
    onClose()
  }

  const handleNeedMoreTime = () => {
    sound.playAlert()
    setSecondsRemaining((prev) => prev + 25 * 60)
    if (activeBlock) {
      onExtendSprint(activeBlock.id, 25)
    }
  }

  if (!isOpen || !activeBlock) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const totalSeconds = activeBlock.durationMinutes * 60
  const progressPct = Math.min(100, Math.max(0, 100 - (secondsRemaining / totalSeconds) * 100))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          className="relative w-full max-w-xl text-center p-6 sm:p-10 rounded-3xl specular-card flex flex-col items-center"
        >
          {/* Top Close */}
          <button
            onClick={() => {
              sound.stopAmbientFocusSound()
              sound.playClick()
              onClose()
            }}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Active Sprint Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Deep Cognitive Sprint</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white max-w-lg mb-1 tracking-tight">
            {activeBlock.title}
          </h2>
          <p className="text-xs text-slate-400 mb-6 font-mono">
            {activeBlock.courseCode ? `[${activeBlock.courseCode}] ` : ''}Scheduled: {activeBlock.startTime} - {activeBlock.endTime}
          </p>

          {/* Glowing Timer Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="108"
                className="stroke-white/[0.06]"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="128"
                cy="128"
                r="108"
                className="stroke-sky-400 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 108}
                strokeDashoffset={2 * Math.PI * 108 * (1 - progressPct / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-white drop-shadow-md">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-mono text-sky-400 uppercase tracking-widest mt-1">
                {isRunning ? '● Focused Flow' : '❚❚ Paused'}
              </span>
            </div>
          </div>

          {/* Play / Pause Controls */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                sound.playClick()
                setIsRunning(!isRunning)
              }}
              className="p-4 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold shadow-xl shadow-sky-400/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setSecondsRemaining(activeBlock.durationMinutes * 60)
              }}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer border border-white/10"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Ambient Soundscape Generator */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#06080e] border border-white/10 text-xs mb-6 font-mono">
            <span className="text-slate-400 px-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              Soundscape:
            </span>
            <button
              onClick={() => toggleAmbient('rain')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                ambientSound === 'rain'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Soft Rain
            </button>
            <button
              onClick={() => toggleAmbient('brown')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                ambientSound === 'brown'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Brown Noise
            </button>
            {ambientSound !== 'off' && (
              <button
                onClick={() => {
                  sound.stopAmbientFocusSound()
                  setAmbientSound('off')
                }}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Mute Ambient"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Adaptive Actions (Life Happened In-Session) */}
          <div className="w-full grid grid-cols-2 gap-3 max-w-md pt-4 border-t border-white/[0.08] text-xs font-semibold">
            <button
              onClick={handleFinishEarly}
              className="py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-950/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish Early (Done!)</span>
            </button>

            <button
              onClick={handleNeedMoreTime}
              className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-950/20"
              title="Add 25 mins and auto-shift downstream blocks"
            >
              <Plus className="w-4 h-4" />
              <span>Took Longer (+25m)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

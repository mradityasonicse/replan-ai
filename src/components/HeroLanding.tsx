import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Waves,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Compass,
} from 'lucide-react'
import { sound } from '../utils/sound'
import type { ScheduledBlock, AcademicDeadline } from '../types'

interface HeroLandingProps {
  onEnterPlanner: (view?: 'dash' | 'sim' | 'plan') => void
  blocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onEnterPlanner,
  blocks,
  deadlines,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -6
    const rotateY = ((x - centerX) / centerX) * 6
    setTilt({ x: rotateX, y: rotateY, mouseX: x, mouseY: y, isHovered: true })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, mouseX: 0, mouseY: 0, isHovered: false })
  }

  const studyBlocks = blocks.filter((b) => b.type === 'study_sprint')
  const completedBlocks = blocks.filter((b) => b.status === 'completed')
  const loadPercentage = studyBlocks.length > 0
    ? Math.round((studyBlocks.length / 14) * 100)
    : 45

  const topDeadline = deadlines[0] || {
    courseCode: 'CS 210',
    title: 'Operating Systems Kernel Lab',
    dueDay: 'Fri',
  }

  return (
    <section className="relative z-10 min-h-[92vh] flex flex-col justify-between px-4 sm:px-8 lg:px-12 py-6 max-w-7xl mx-auto w-full select-none">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <span className="text-base">◉</span>
          </div>
          <span className="font-display font-extrabold text-lg text-white tracking-tight uppercase">
            RePlan <span className="text-sky-400">AI</span>
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick()
            onEnterPlanner('dash')
          }}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Open My Planner</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>

      {/* Hero Grid: Narrative Left, Interactive 3D Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8">
        {/* Left Column: Vision & Philosophy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autonomous Cognitive Scheduler on Your Device</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.05] tracking-tight">
            Your Life Changes.{' '}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Your Plan Adapts.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl font-sans leading-relaxed">
            Missed a class, lost an afternoon, or got a surprise assignment? RePlan AI shows exactly how your week will shift, explains every move, and tells you honestly what no longer fits. You stay in control.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => {
                sound.playClick()
                onEnterPlanner('dash')
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-display font-bold text-sm tracking-tight transition-all cursor-pointer shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Build My Plan</span>
            </button>

            <button
              onClick={() => {
                sound.playClick()
                onEnterPlanner('sim')
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#090d18]/90 hover:bg-[#0f1524] text-slate-200 hover:text-white border border-white/10 hover:border-sky-500/40 font-display font-semibold text-sm transition-all cursor-pointer shadow-lg flex items-center gap-2"
            >
              <Waves className="w-4 h-4 text-sky-400" />
              <span>Explore Ripple Simulator</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="flex flex-wrap items-center gap-4 pt-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Guarded Bedtime & Sleep</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Zero-Vibe Cascade Math</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>100% Local Privacy</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Preview Card */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          {/* Ambient Glow Orbs */}
          <div className="absolute w-72 h-72 rounded-full bg-sky-500/15 blur-[80px] pointer-events-none -top-10 -left-10" />
          <div className="absolute w-64 h-64 rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none -bottom-10 -right-10" />

          {/* Floating Chip 1 (Top Right) */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -right-4 z-20 specular-card rounded-2xl px-3.5 py-2.5 shadow-2xl border border-sky-400/30 flex items-center gap-2 text-xs font-mono hidden sm:flex"
          >
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-white font-semibold">🌊 Ripple:</span>
            <span className="text-sky-300">tasks moved safely</span>
          </motion.div>

          {/* Floating Chip 2 (Bottom Left) */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-6 -left-4 z-20 specular-card rounded-2xl px-3.5 py-2.5 shadow-2xl border border-emerald-400/30 flex items-center gap-2 text-xs font-mono hidden sm:flex"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-semibold">{topDeadline.courseCode}:</span>
            <span className="text-emerald-300 truncate max-w-[140px]">{topDeadline.title}</span>
          </motion.div>

          {/* Main 3D Card Widget */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-md specular-card rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden"
            style={{
              transform: tilt.isHovered
                ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
                : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: tilt.isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Specular Spotlight Overlay */}
            {tilt.isHovered && (
              <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                  background: `radial-gradient(circle 180px at ${tilt.mouseX}px ${tilt.mouseY}px, rgba(56, 189, 248, 0.14), transparent 70%)`,
                }}
              />
            )}

            {/* Header of widget */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Adaptive Schedule</span>
                <h3 className="text-sm font-bold font-display text-white">This Week's Plan</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Matrix
              </div>
            </div>

            {/* Mini 5-Day Strip */}
            <div className="grid grid-cols-5 gap-1.5 my-5 relative z-10">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                <div
                  key={day}
                  className={`rounded-xl p-2 text-center border ${
                    idx === 1
                      ? 'bg-sky-500/15 border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-300">{day}</div>
                  <div className="space-y-1 mt-1.5">
                    <div className="h-1.5 rounded-full bg-sky-400/80 w-full" />
                    <div className="h-1.5 rounded-full bg-indigo-400/70 w-3/4 mx-auto" />
                    {idx === 1 ? (
                      <div className="h-1.5 rounded-full bg-amber-400/90 w-full animate-pulse" />
                    ) : (
                      <div className="h-1.5 rounded-full bg-white/10 w-1/2 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Workload Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.08] relative z-10">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Total Workload Density</span>
                <span className="text-sky-300 font-bold">{loadPercentage}% Optimal</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                  style={{ width: `${loadPercentage}%` }}
                />
              </div>
            </div>

            {/* Quick Demo Action inside Card */}
            <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono relative z-10">
              <span className="text-slate-400">
                {studyBlocks.length} Sprints · {completedBlocks.length} Done
              </span>
              <button
                onClick={() => {
                  sound.playClick()
                  onEnterPlanner('sim')
                }}
                className="text-sky-400 hover:text-sky-300 transition-colors font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Simulate Ripple</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 border-t border-white/[0.06] text-center text-xs font-mono text-slate-500">
        RePlan AI · Autonomous Academic Recovery Engine · Award-Winning Craft
      </div>
    </section>
  )
}

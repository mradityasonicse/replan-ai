import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { CapacityRadar } from './components/CapacityRadar'
import { DeadlinesList } from './components/DeadlinesList'
import { WeekGrid } from './components/WeekGrid'
import { RecoveryModal } from './components/RecoveryModal'
import { QuickAddModal } from './components/QuickAddModal'
import { ExportModal } from './components/ExportModal'
import { FocusModeModal } from './components/FocusModeModal'
import { ExtensionEmailModal } from './components/ExtensionEmailModal'
import { ThreeCanvas } from './components/ThreeCanvas'
import { BLANK_WORKSPACE, PRESET_SCENARIOS } from './utils/presets'
import type { PresetScenario } from './utils/presets'
import { generateRealisticPlan } from './utils/scheduler'
import { computeWeekCapacityMetrics } from './utils/capacity'
import { computeRecoveryPlan } from './utils/recovery'
import type {
  ScheduledBlock,
  AcademicDeadline,
  ClassCommitment,
  PersonalCommitment,
  StudentPreferences,
  RecoveryProposal,
  DisruptionEvent,
} from './types'
import {
  AlertTriangle,
  Sparkles,
  Plus,
  BookOpen,
  Zap,
} from 'lucide-react'
import { sound } from './utils/sound'
import confetti from 'canvas-confetti'

export function App() {
  const defaultPreset = BLANK_WORKSPACE

  const [currentPresetId, setCurrentPresetId] = useState<string>(defaultPreset.id)
  const [preferences, setPreferences] = useState<StudentPreferences>(defaultPreset.preferences)
  const [classes, setClasses] = useState<ClassCommitment[]>(defaultPreset.classes)
  const [deadlines, setDeadlines] = useState<AcademicDeadline[]>(defaultPreset.deadlines)
  const [personal, setPersonal] = useState<PersonalCommitment[]>(defaultPreset.personal)

  // Calendar blocks
  const [blocks, setBlocks] = useState<ScheduledBlock[]>(() => {
    return generateRealisticPlan(
      defaultPreset.classes,
      defaultPreset.personal,
      defaultPreset.deadlines,
      defaultPreset.preferences
    )
  })

  // Modals state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // Focus Mode & Extension Drafter state
  const [activeFocusBlock, setActiveFocusBlock] = useState<ScheduledBlock | null>(null)
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false)
  const [activeExtensionDeadline, setActiveExtensionDeadline] = useState<AcademicDeadline | null>(null)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)

  // Keyboard Shortcuts: R -> Recovery, N -> Add, Esc -> Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        sound.playClick()
        setIsRecoveryOpen(true)
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        sound.playClick()
        setIsAddOpen(true)
      } else if (e.key === 'Escape') {
        setIsRecoveryOpen(false)
        setIsAddOpen(false)
        setIsExportOpen(false)
        setIsFocusModalOpen(false)
        setIsExtensionModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Switch preset
  const handleSelectPreset = (preset: PresetScenario) => {
    setCurrentPresetId(preset.id)
    setPreferences(preset.preferences)
    setClasses(preset.classes)
    setDeadlines(preset.deadlines)
    setPersonal(preset.personal)

    const newBlocks = generateRealisticPlan(
      preset.classes,
      preset.personal,
      preset.deadlines,
      preset.preferences
    )
    setBlocks(newBlocks)
  }

  // Toggle complete block
  const handleToggleComplete = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          const nextStatus = b.status === 'completed' ? 'scheduled' : 'completed'
          return { ...b, status: nextStatus }
        }
        return b
      })
    )
  }

  // Displace a block manually (life disruption)
  const handleDisplaceBlock = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return { ...b, status: 'displaced' }
        }
        return b
      })
    )
    setIsRecoveryOpen(true)
  }

  // Quick 1-Click Inline Disruption Trigger
  const handleQuickInlineDisruption = (type: 'overslept' | 'lab_late' | 'burnout') => {
    sound.playAlert()
    let disruption: DisruptionEvent

    if (type === 'overslept') {
      disruption = {
        id: `disrupt-${Date.now()}`,
        type: 'overslept',
        title: 'Overslept Morning',
        description: 'Lost 2.5 hours of morning study time.',
        day: 'Mon',
        timeLostMinutes: 150,
        startDisruptionTime: preferences.wakeTime,
      }
    } else if (type === 'lab_late') {
      disruption = {
        id: `disrupt-${Date.now()}`,
        type: 'class_extended',
        title: 'Lab Overtime',
        description: 'Lab overran by 1.5 hours.',
        day: 'Wed',
        timeLostMinutes: 90,
        startDisruptionTime: '15:00',
      }
    } else {
      disruption = {
        id: `disrupt-${Date.now()}`,
        type: 'sick_burnout',
        title: 'Evening Reset',
        description: 'Drop evening study to rest early and reset.',
        day: 'Thu',
        timeLostMinutes: 180,
        startDisruptionTime: '18:00',
      }
    }

    const proposal = computeRecoveryPlan(
      disruption,
      blocks,
      deadlines,
      personal,
      preferences
    )

    setBlocks(proposal.newProposedBlocks)
    sound.playSuccessChime()
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
  }

  // Open focus mode
  const handleOpenFocusMode = (block: ScheduledBlock) => {
    setActiveFocusBlock(block)
    setIsFocusModalOpen(true)
  }

  // Extend sprint duration when taking longer
  const handleExtendSprint = (blockId: string, extraMinutes: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return { ...b, durationMinutes: b.durationMinutes + extraMinutes }
        }
        return b
      })
    )
  }

  // Open extension email modal
  const handleOpenExtensionDraft = (deadline: AcademicDeadline) => {
    setActiveExtensionDeadline(deadline)
    setIsExtensionModalOpen(true)
  }

  // Apply recovery plan proposal
  const handleApplyRecoveryPlan = (proposal: RecoveryProposal) => {
    setBlocks(proposal.newProposedBlocks)
  }

  // Re-generate fresh plan from scratch
  const handleRebalancePlan = () => {
    sound.playSuccessChime()
    const freshBlocks = generateRealisticPlan(classes, personal, deadlines, preferences)
    setBlocks(freshBlocks)
  }

  // Deadline hours completion update
  const handleUpdateCompletedHours = (deadlineId: string, deltaHours: number) => {
    setDeadlines((prev) =>
      prev.map((d) => {
        if (d.id === deadlineId) {
          const newCompleted = Math.min(d.estimatedHours, d.completedHours + deltaHours)
          return { ...d, completedHours: newCompleted }
        }
        return d
      })
    )
  }

  // Add individual items
  const handleAddClass = (newClass: ClassCommitment) => {
    const nextClasses = [...classes, newClass]
    setClasses(nextClasses)
    setBlocks(generateRealisticPlan(nextClasses, personal, deadlines, preferences))
  }

  const handleAddDeadline = (newDeadline: AcademicDeadline) => {
    const nextDeadlines = [...deadlines, newDeadline]
    setDeadlines(nextDeadlines)
    setBlocks(generateRealisticPlan(classes, personal, nextDeadlines, preferences))
  }

  const handleAddPersonal = (newPersonal: PersonalCommitment) => {
    const nextPersonal = [...personal, newPersonal]
    setPersonal(nextPersonal)
    setBlocks(generateRealisticPlan(classes, nextPersonal, deadlines, preferences))
  }

  const handleBatchAddDeadlines = (newDeadlines: AcademicDeadline[]) => {
    const nextDeadlines = [...deadlines, ...newDeadlines]
    setDeadlines(nextDeadlines)
    setBlocks(generateRealisticPlan(classes, personal, nextDeadlines, preferences))
  }

  const hasDisplacedBlocks = blocks.some((b) => b.status === 'displaced' || b.status === 'interrupted')
  const metrics = computeWeekCapacityMetrics(blocks, deadlines, preferences)
  const isWorkspaceEmpty = classes.length === 0 && deadlines.length === 0 && personal.length === 0

  return (
    <div className="relative min-h-screen bg-[#030508] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <ThreeCanvas />
      <div className="fixed inset-0 pointer-events-none z-0 film-grain opacity-40" />

      {/* Global Precision Header */}
      <Header
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        metrics={metrics}
        onOpenRecovery={() => setIsRecoveryOpen(true)}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onRebalancePlan={handleRebalancePlan}
        hasDisplacedBlocks={hasDisplacedBlocks}
      />

      {/* Displaced Alert Banner if any block needs recovery */}
      {hasDisplacedBlocks && (
        <div className="relative z-10 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs font-mono flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                <strong>Plan Interrupted:</strong> One or more study sessions were displaced by a schedule conflict.
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick()
                setIsRecoveryOpen(true)
              }}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-bold transition-colors cursor-pointer shrink-0"
            >
              Solve Recovery (1-Click)
            </button>
          </div>
        </div>
      )}

      {/* Main Command Center */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-5">
        {/* Onboarding Callout when Clean */}
        {isWorkspaceEmpty && (
          <div className="specular-card rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clean Academic Workspace</span>
              </div>
              <h3 className="text-lg font-bold font-display text-white tracking-tight">
                Turn your upcoming week of classes & deadlines into a recoverable reality.
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Paste raw syllabus tasks, add fixed lecture times, or load a sample scenario to explore how ChronoFlow protects your sleep and catches up when life happens.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  sound.playClick()
                  setIsAddOpen(true)
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ingest Schedule</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick()
                  const sample = PRESET_SCENARIOS.find((p) => p.id === 'engineering-midterm')
                  if (sample) handleSelectPreset(sample)
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0e1118] hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Load Sample Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Capacity & Sanity Guardrails Radar */}
        <CapacityRadar
          blocks={blocks}
          deadlines={deadlines}
          preferences={preferences}
        />

        {/* Deliverables & Smart Slices */}
        <DeadlinesList
          deadlines={deadlines}
          onUpdateCompletedHours={handleUpdateCompletedHours}
          onOpenExtensionDraft={handleOpenExtensionDraft}
          onOpenAddModal={() => setIsAddOpen(true)}
        />

        {/* 7-Day Responsive Weekly Timeline */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Adaptive Weekly Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Click any study sprint to launch Focus Mode · Press [R] for Recovery
              </p>
            </div>

            {/* Quick 1-Click Disruption Pill Sandbox (If blocks exist) */}
            {blocks.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#0c0e14] border border-white/10 p-1 rounded-xl">
                <span className="text-slate-400 px-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Quick Disruption:
                </span>
                <button
                  onClick={() => handleQuickInlineDisruption('overslept')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Simulate losing 2.5h this morning"
                >
                  Slept In +2.5h
                </button>
                <button
                  onClick={() => handleQuickInlineDisruption('lab_late')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Simulate lab running late"
                >
                  Lab Overrun +1.5h
                </button>
                <button
                  onClick={() => handleQuickInlineDisruption('burnout')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Drop tonight to rest"
                >
                  Night Reset
                </button>
              </div>
            )}
          </div>

          <WeekGrid
            blocks={blocks}
            preferences={preferences}
            onToggleComplete={handleToggleComplete}
            onDisplaceBlock={handleDisplaceBlock}
            onOpenFocusMode={handleOpenFocusMode}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#060709]/80 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-500 font-mono">
        ChronoFlow · Academic Week Resilience & Autonomous Recovery Engine · Zero AI Slop
      </footer>

      {/* Modals */}
      <RecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        currentBlocks={blocks}
        deadlines={deadlines}
        personal={personal}
        preferences={preferences}
        onApplyRecoveryPlan={handleApplyRecoveryPlan}
      />

      <QuickAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddClass={handleAddClass}
        onAddDeadline={handleAddDeadline}
        onAddPersonal={handleAddPersonal}
        onBatchAddDeadlines={handleBatchAddDeadlines}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        blocks={blocks}
        deadlines={deadlines}
      />

      {/* Deep Work Focus Mode */}
      <FocusModeModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        activeBlock={activeFocusBlock}
        onCompleteBlock={handleToggleComplete}
        onExtendSprint={handleExtendSprint}
      />

      {/* Professor Extension Drafter */}
      <ExtensionEmailModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        deadline={activeExtensionDeadline}
      />
    </div>
  )
}
export default App

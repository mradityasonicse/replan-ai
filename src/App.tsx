import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import type { NavView } from './components/Header'
import { HeroLanding } from './components/HeroLanding'
import { DashboardView } from './components/DashboardView'
import { RippleSimulator } from './components/RippleSimulator'
import { TasksManager } from './components/TasksManager'
import { SettingsView } from './components/SettingsView'
import { CapacityRadar } from './components/CapacityRadar'
import { DeadlinesList } from './components/DeadlinesList'
import { WeekGrid } from './components/WeekGrid'
import { AICoachDrawer } from './components/AICoachDrawer'
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
  DayOfWeek,
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

interface HistorySnapshot {
  preferences: StudentPreferences
  classes: ClassCommitment[]
  deadlines: AcademicDeadline[]
  personal: PersonalCommitment[]
  blocks: ScheduledBlock[]
}

export function App() {
  const defaultPreset = BLANK_WORKSPACE

  const [currentPresetId, setCurrentPresetId] = useState<string>(defaultPreset.id)
  const [preferences, setPreferences] = useState<StudentPreferences>({
    ...defaultPreset.preferences,
    daysOff: [],
    energyLevel: 'okay',
    currentDay: 'Mon',
    calmMode: false,
    helpDeskEmail: '',
  })
  const [classes, setClasses] = useState<ClassCommitment[]>(defaultPreset.classes)
  const [deadlines, setDeadlines] = useState<AcademicDeadline[]>(defaultPreset.deadlines)
  const [personal, setPersonal] = useState<PersonalCommitment[]>(defaultPreset.personal)

  // Navigation State
  const [activeView, setActiveView] = useState<NavView>('dash')
  const [showHero, setShowHero] = useState<boolean>(false)
  const [bounceBacks, setBounceBacks] = useState<number>(3)

  // History stack for Undo
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([])

  // Calendar blocks
  const [blocks, setBlocks] = useState<ScheduledBlock[]>(() => {
    return generateRealisticPlan(
      defaultPreset.classes,
      defaultPreset.personal,
      defaultPreset.deadlines,
      defaultPreset.preferences
    )
  })

  // Modals & Drawers state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isCoachOpen, setIsCoachOpen] = useState(false)

  // Focus Mode & Extension Drafter state
  const [activeFocusBlock, setActiveFocusBlock] = useState<ScheduledBlock | null>(null)
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false)
  const [activeExtensionDeadline, setActiveExtensionDeadline] = useState<AcademicDeadline | null>(null)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)

  // Push snapshot before mutating state
  const pushUndoSnapshot = () => {
    setUndoStack((prev) => [
      ...prev.slice(-9),
      {
        preferences: { ...preferences },
        classes: [...classes],
        deadlines: [...deadlines],
        personal: [...personal],
        blocks: [...blocks],
      },
    ])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    sound.playClick()
    const last = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))

    setPreferences(last.preferences)
    setClasses(last.classes)
    setDeadlines(last.deadlines)
    setPersonal(last.personal)
    setBlocks(last.blocks)
  }

  // Keyboard Shortcuts: R -> Recovery, N -> Add, Esc -> Close, C -> Coach
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        sound.playClick()
        setIsCoachOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setIsRecoveryOpen(false)
        setIsAddOpen(false)
        setIsExportOpen(false)
        setIsFocusModalOpen(false)
        setIsExtensionModalOpen(false)
        setIsCoachOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Switch preset
  const handleSelectPreset = (preset: PresetScenario) => {
    pushUndoSnapshot()
    setCurrentPresetId(preset.id)
    setPreferences((prev) => ({ ...prev, ...preset.preferences }))
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
    pushUndoSnapshot()
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

  // Mark block missed (Instant automated reschedule)
  const handleMarkMissed = (blockId: string) => {
    pushUndoSnapshot()
    setBounceBacks((prev) => prev + 1)
    sound.playAlert()

    // Mark as displaced, then rebalance
    const nextBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, status: 'displaced' as const } : b
    )
    setBlocks(nextBlocks)

    setTimeout(() => {
      sound.playSuccessChime()
      const rebalanced = generateRealisticPlan(classes, personal, deadlines, preferences)
      setBlocks(rebalanced)
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } })
    }, 300)
  }

  // Displace a block manually (triggers recovery solver)
  const handleDisplaceBlock = (blockId: string) => {
    pushUndoSnapshot()
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

  // Toggle Day Off (e.g. sick day or mental health reset)
  const handleToggleDayOff = (day: DayOfWeek) => {
    pushUndoSnapshot()
    const currentDaysOff = preferences.daysOff || []
    const nextDaysOff = currentDaysOff.includes(day)
      ? currentDaysOff.filter((d) => d !== day)
      : [...currentDaysOff, day]

    const nextPrefs = { ...preferences, daysOff: nextDaysOff }
    setPreferences(nextPrefs)

    const rebalanced = generateRealisticPlan(classes, personal, deadlines, nextPrefs)
    setBlocks(rebalanced)
    sound.playSuccessChime()
  }

  // Apply revised plan from Ripple Simulator
  const handleApplyRevisedPlan = (
    newDeadlines: AcademicDeadline[],
    newPersonal: PersonalCommitment[]
  ) => {
    pushUndoSnapshot()
    setDeadlines(newDeadlines)
    setPersonal(newPersonal)

    const rebalanced = generateRealisticPlan(classes, newPersonal, newDeadlines, preferences)
    setBlocks(rebalanced)
    setActiveView('plan')
  }

  // Quick 1-Click Inline Disruption Trigger
  const handleQuickInlineDisruption = (type: 'overslept' | 'lab_late' | 'burnout') => {
    pushUndoSnapshot()
    sound.playAlert()
    let disruption: DisruptionEvent

    if (type === 'overslept') {
      disruption = {
        id: `disrupt-${Date.now()}`,
        type: 'overslept',
        title: 'Overslept Morning',
        description: 'Lost 2.5 hours of morning study time.',
        day: preferences.currentDay || 'Mon',
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
    pushUndoSnapshot()
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
    pushUndoSnapshot()
    setBlocks(proposal.newProposedBlocks)
  }

  // Re-generate fresh plan from scratch
  const handleRebalancePlan = () => {
    pushUndoSnapshot()
    sound.playSuccessChime()
    const freshBlocks = generateRealisticPlan(classes, personal, deadlines, preferences)
    setBlocks(freshBlocks)
  }

  // Deadline hours completion update
  const handleUpdateCompletedHours = (deadlineId: string, deltaHours: number) => {
    pushUndoSnapshot()
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
    pushUndoSnapshot()
    const nextClasses = [...classes, newClass]
    setClasses(nextClasses)
    setBlocks(generateRealisticPlan(nextClasses, personal, deadlines, preferences))
  }

  const handleAddDeadline = (newDeadline: AcademicDeadline) => {
    pushUndoSnapshot()
    const nextDeadlines = [...deadlines, newDeadline]
    setDeadlines(nextDeadlines)
    setBlocks(generateRealisticPlan(classes, personal, nextDeadlines, preferences))
  }

  const handleAddPersonal = (newPersonal: PersonalCommitment) => {
    pushUndoSnapshot()
    const nextPersonal = [...personal, newPersonal]
    setPersonal(nextPersonal)
    setBlocks(generateRealisticPlan(classes, nextPersonal, deadlines, preferences))
  }

  const handleBatchAddDeadlines = (newDeadlines: AcademicDeadline[]) => {
    pushUndoSnapshot()
    const nextDeadlines = [...deadlines, ...newDeadlines]
    setDeadlines(nextDeadlines)
    setBlocks(generateRealisticPlan(classes, personal, nextDeadlines, preferences))
  }

  // Delete items
  const handleDeleteDeadline = (id: string) => {
    pushUndoSnapshot()
    const next = deadlines.filter((d) => d.id !== id)
    setDeadlines(next)
    setBlocks(generateRealisticPlan(classes, personal, next, preferences))
  }

  const handleDeleteClass = (id: string) => {
    pushUndoSnapshot()
    const next = classes.filter((c) => c.id !== id)
    setClasses(next)
    setBlocks(generateRealisticPlan(next, personal, deadlines, preferences))
  }

  const handleDeletePersonal = (id: string) => {
    pushUndoSnapshot()
    const next = personal.filter((p) => p.id !== id)
    setPersonal(next)
    setBlocks(generateRealisticPlan(classes, next, deadlines, preferences))
  }

  // Update preferences
  const handleUpdatePreferences = (updated: Partial<StudentPreferences>) => {
    pushUndoSnapshot()
    const nextPrefs = { ...preferences, ...updated }
    setPreferences(nextPrefs)
    setBlocks(generateRealisticPlan(classes, personal, deadlines, nextPrefs))
  }

  const handleClearAll = () => {
    pushUndoSnapshot()
    setClasses([])
    setDeadlines([])
    setPersonal([])
    setBlocks([])
    sound.playAlert()
  }

  const hasDisplacedBlocks = blocks.some((b) => b.status === 'displaced' || b.status === 'interrupted')
  const metrics = computeWeekCapacityMetrics(blocks, deadlines, preferences)
  const isWorkspaceEmpty = classes.length === 0 && deadlines.length === 0 && personal.length === 0

  return (
    <div className={`relative min-h-screen bg-[#030508] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200 ${
      preferences.calmMode ? 'calm' : ''
    }`}>
      {/* Three.js 3D Spatial Scene */}
      <ThreeCanvas />
      <div className="fixed inset-0 pointer-events-none z-0 film-grain opacity-40" />

      {/* Global Precision Header */}
      <Header
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        metrics={metrics}
        activeView={activeView}
        onChangeView={(v) => {
          setShowHero(false)
          setActiveView(v)
        }}
        onOpenRecovery={() => setIsRecoveryOpen(true)}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenCoach={() => setIsCoachOpen(true)}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        onToggleHero={() => setShowHero((prev) => !prev)}
        showHero={showHero}
        hasDisplacedBlocks={hasDisplacedBlocks}
        onRebalancePlan={handleRebalancePlan}
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

      {/* Primary Content Router */}
      {showHero ? (
        <HeroLanding
          onEnterPlanner={(targetView = 'dash') => {
            setShowHero(false)
            setActiveView(targetView)
          }}
          blocks={blocks}
          deadlines={deadlines}
        />
      ) : (
        <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-5">
          {/* Onboarding Callout when Clean Workspace */}
          {isWorkspaceEmpty && activeView !== 'set' && (
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
                  Paste raw syllabus tasks, add fixed lecture times, or load a sample scenario to explore how RePlan AI protects your sleep and catches up when life happens.
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

          {/* View 1: Dashboard */}
          {activeView === 'dash' && (
            <DashboardView
              blocks={blocks}
              deadlines={deadlines}
              preferences={preferences}
              bounceBacks={bounceBacks}
              onToggleComplete={handleToggleComplete}
              onMarkMissed={handleMarkMissed}
              onOpenFocusMode={handleOpenFocusMode}
              onOpenAddModal={() => setIsAddOpen(true)}
            />
          )}

          {/* View 2: Week Planner Matrix */}
          {activeView === 'plan' && (
            <div className="space-y-6">
              <CapacityRadar
                blocks={blocks}
                deadlines={deadlines}
                preferences={preferences}
              />

              <DeadlinesList
                deadlines={deadlines}
                onUpdateCompletedHours={handleUpdateCompletedHours}
                onOpenExtensionDraft={handleOpenExtensionDraft}
                onOpenAddModal={() => setIsAddOpen(true)}
              />

              {/* Quick Shock Testing Strip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#06080e]/90 border border-white/[0.08] text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Quick Schedule Shock Test:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickInlineDisruption('overslept')}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Simulate losing morning study"
                  >
                    Overslept (-2.5h)
                  </button>
                  <button
                    onClick={() => handleQuickInlineDisruption('lab_late')}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Simulate afternoon lab overrun"
                  >
                    Lab Overrun (-1.5h)
                  </button>
                  <button
                    onClick={() => handleQuickInlineDisruption('burnout')}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Drop tonight to rest"
                  >
                    Night Reset
                  </button>
                </div>
              </div>

              <WeekGrid
                blocks={blocks}
                preferences={preferences}
                onToggleComplete={handleToggleComplete}
                onDisplaceBlock={handleDisplaceBlock}
                onOpenFocusMode={handleOpenFocusMode}
                onToggleDayOff={handleToggleDayOff}
              />
            </div>
          )}

          {/* View 3: Ripple Simulator */}
          {activeView === 'sim' && (
            <RippleSimulator
              classes={classes}
              personal={personal}
              deadlines={deadlines}
              preferences={preferences}
              onApplyRevisedPlan={handleApplyRevisedPlan}
            />
          )}

          {/* View 4: Tasks & Commitments */}
          {activeView === 'tasks' && (
            <TasksManager
              deadlines={deadlines}
              classes={classes}
              personal={personal}
              onOpenAddModal={() => setIsAddOpen(true)}
              onDeleteDeadline={handleDeleteDeadline}
              onDeleteClass={handleDeleteClass}
              onDeletePersonal={handleDeletePersonal}
            />
          )}

          {/* View 5: Settings & Limits */}
          {activeView === 'set' && (
            <SettingsView
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onLoadSampleWeek={() => {
                const sample = PRESET_SCENARIOS[0]
                if (sample) handleSelectPreset(sample)
              }}
              onClearAll={handleClearAll}
            />
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#050812]/80 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-500 font-mono">
        RePlan AI · Your Life Changes. Your Plan Adapts. · Deterministic Recovery Math
      </footer>

      {/* AI Coach & Campus Support Drawer */}
      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        deadlines={deadlines}
        preferences={preferences}
        onToggleDayOff={handleToggleDayOff}
        onSetStudyLimit={(hours) => handleUpdatePreferences({ maxDailyDeepWorkHours: hours })}
        onAddQuickDeadline={(title, dueDay, hours) => {
          handleAddDeadline({
            id: `dl-${Date.now()}`,
            courseCode: 'ACAD',
            title,
            dueDay,
            dueTime: '23:59',
            estimatedHours: hours,
            completedHours: 0,
            priority: 'high',
            energyRequirement: 'deep_work',
            weightPercentage: 15,
          })
        }}
      />

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

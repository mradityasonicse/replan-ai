import { useState } from 'react'
import { Header } from './components/Header'
import { CapacityRadar } from './components/CapacityRadar'
import { DeadlinesList } from './components/DeadlinesList'
import { WeekGrid } from './components/WeekGrid'
import { RecoveryModal } from './components/RecoveryModal'
import { QuickAddModal } from './components/QuickAddModal'
import { ExportModal } from './components/ExportModal'
import { FocusModeModal } from './components/FocusModeModal'
import { ExtensionEmailModal } from './components/ExtensionEmailModal'
import { BackgroundCanvas } from './components/BackgroundCanvas'
import { PRESET_SCENARIOS } from './utils/presets'
import type { PresetScenario } from './utils/presets'
import { generateRealisticPlan } from './utils/scheduler'
import { computeWeekCapacityMetrics } from './utils/capacity'
import type {
  ScheduledBlock,
  AcademicDeadline,
  ClassCommitment,
  PersonalCommitment,
  StudentPreferences,
  RecoveryProposal,
} from './types'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { sound } from './utils/sound'

export function App() {
  const defaultPreset = PRESET_SCENARIOS[0]

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

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <BackgroundCanvas />

      {/* Global Header */}
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
        <div className="relative z-10 bg-gradient-to-r from-amber-600/90 to-rose-600/90 text-white px-4 py-2.5 shadow-lg flex items-center justify-between text-xs font-medium">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>
                <strong>Plan Interrupted:</strong> One or more scheduled study sessions were displaced by a disruption.
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick()
                setIsRecoveryOpen(true)
              }}
              className="px-3 py-1 bg-white text-slate-900 rounded-lg font-bold shadow hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              Open Recovery Engine
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
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
        />

        {/* 7-Day Responsive Weekly Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Adaptive Weekly Canvas
              </h3>
              <p className="text-xs text-slate-400">
                Click any study sprint to launch Focus Mode with ambient soundscapes
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" />
                Study Sprint
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-600 inline-block" />
                Fixed Lecture/Lab
              </span>
            </div>
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
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-500 font-mono">
        ChronoFlow · Built for Students to Turn Overwhelming Weeks into Recoverable Reality · Zero Vibe Coding
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

import React, { useState } from 'react'
import {
  X,
  Cpu,
  Database,
  Brain,
  Sliders,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react'
import { sound } from '../utils/sound'
import { ragEngine } from '../utils/ai/ragEngine'
import { agentMemory } from '../utils/ai/memory'
import { contextEngine } from '../utils/ai/contextManager'
import { harnessRunner } from '../utils/ai/harness'
import { evalsEngine } from '../utils/ai/evalsEngine'
import type {
  ScheduledBlock,
  AcademicDeadline,
  ClassCommitment,
  PersonalCommitment,
  StudentPreferences,
} from '../types'
import type { MemoryType } from '../types/aiEngineering'

interface AIEngineeringModalProps {
  isOpen: boolean
  onClose: () => void
  blocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
  classes: ClassCommitment[]
  personal: PersonalCommitment[]
  preferences: StudentPreferences
  onApplyPlan?: (newBlocks: ScheduledBlock[]) => void
}

type TabKey = 'rag' | 'memory' | 'context' | 'harness' | 'evals'

export const AIEngineeringModal: React.FC<AIEngineeringModalProps> = ({
  isOpen,
  onClose,
  blocks,
  deadlines,
  classes,
  personal,
  preferences,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('rag')

  // RAG State
  const [ragQuery, setRagQuery] = useState('late submission penalty for CS101')
  const [ragResult, setRagResult] = useState(() => ragEngine.queryKnowledgeBase('late submission penalty for CS101'))
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  // Memory State
  const [memSearch, setMemSearch] = useState('')
  const [memFilter, setMemFilter] = useState<MemoryType | 'all'>('all')
  const [memories, setMemories] = useState(() => agentMemory.getAll())
  const [newMemKey, setNewMemKey] = useState('')
  const [newMemContent, setNewMemContent] = useState('')

  // Context State
  const [maskObservations, setMaskObservations] = useState(true)
  const contextAnatomy = contextEngine.analyzeContext(
    ragResult.retrievedChunks.map((r) => r.chunk),
    memories.slice(0, 4),
    deadlines,
    blocks,
    preferences,
    maskObservations
  )

  // Harness State
  const [selectedScenario, setSelectedScenario] = useState<'chaos_midterms' | 'lost_afternoon' | 'sleep_squeeze' | 'triple_dayoff'>('chaos_midterms')
  const [stressResult, setStressResult] = useState(() =>
    harnessRunner.runStressScenario('chaos_midterms', classes, personal, deadlines, preferences)
  )

  // Evals State
  const evalReport = evalsEngine.evaluateSchedule(blocks, deadlines, preferences)

  if (!isOpen) return null

  // Handle RAG search
  const handleRunRAG = (q: string) => {
    sound.playClick()
    const res = ragEngine.queryKnowledgeBase(q)
    setRagResult(res)
  }

  // Handle Add Custom Doc
  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseCode || !newSectionTitle || !newContent) return
    sound.playSuccessChime()
    ragEngine.addCustomDocument(newCourseCode, 'Custom Policy', newSectionTitle, newContent)
    setNewCourseCode('')
    setNewSectionTitle('')
    setNewContent('')
    handleRunRAG(ragQuery)
  }

  // Handle Add Memory
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemKey || !newMemContent) return
    sound.playSuccessChime()
    agentMemory.write(newMemKey, newMemContent, 'semantic', ['custom', 'student-note'], 4)
    setMemories(agentMemory.getAll())
    setNewMemKey('')
    setNewMemContent('')
  }

  // Handle Run Stress Test
  const handleRunStress = (scen: 'chaos_midterms' | 'lost_afternoon' | 'sleep_squeeze' | 'triple_dayoff') => {
    sound.playClick()
    setSelectedScenario(scen)
    const res = harnessRunner.runStressScenario(scen, classes, personal, deadlines, preferences)
    setStressResult(res)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[850px] bg-[#070b16] border border-sky-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-display">
                  Agent Engineering & Intelligence Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                  Full Stack AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Context Engineering · Agent Memory · RAG Knowledge · Harness Testing · Error Diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              onClose()
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.08] bg-black/20 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('rag')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rag'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>1. Course RAG Engine</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('memory')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'memory'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>2. Agent Memory</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('context')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'context'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>3. Context Engineering</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('harness')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'harness'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>4. Harness & Stress Tests</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('evals')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evals'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>5. Evals & Error Analysis</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RAG ENGINE */}
          {activeTab === 'rag' && (
            <div className="space-y-6">
              {/* Query bar */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-sky-400" />
                    Query Course Regulations & Syllabi (Dense + Sparse Search)
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {ragEngine.getAllChunks().length} Chunks Indexed
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunRAG(ragQuery)}
                    placeholder="e.g. Can I get an extension in Math? / CS101 grace days..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleRunRAG(ragQuery)}
                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Search RAG
                  </button>
                </div>

                {/* Quick query pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'CS101 grace days policy',
                    'MATH201 homework drops',
                    'CHEM201 lab attendance rules',
                    'Emergency absence notice from Dean',
                    'Campus mental health drop-in hours',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setRagQuery(preset)
                        handleRunRAG(preset)
                      }}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grounded AI Answer */}
              {ragResult && (
                <div className="bg-gradient-to-br from-sky-950/30 to-indigo-950/20 border border-sky-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">
                        Grounded Answer (Confidence: {Math.round(ragResult.confidence * 100)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <span>Citations:</span>
                      {ragResult.citations.map((cite, idx) => (
                        <span key={idx} className="text-sky-400 underline cursor-pointer">
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans bg-black/30 p-3 rounded-lg border border-white/5">
                    {ragResult.groundedAnswer}
                  </p>
                </div>
              )}

              {/* Retrieved Chunks List */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  Top Retrieved Evidence Chunks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ragResult.retrievedChunks.map((res) => (
                    <div
                      key={res.chunk.id}
                      className="bg-slate-900/40 border border-white/10 rounded-xl p-3.5 space-y-2 hover:border-sky-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-bold">
                          {res.chunk.courseCode}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Similarity: {(res.similarityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-mono">{res.chunk.sectionTitle}</h4>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {res.chunk.content}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5">
                        <span>{res.chunk.citation}</span>
                        <span>Dense: {res.denseScore} · Sparse: {res.sparseScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingest Custom Syllabus Note */}
              <form onSubmit={handleAddCustomDoc} className="bg-slate-900/30 p-4 rounded-xl border border-white/10 space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Ingest Course Syllabus / Custom Professor Policy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Course Code (e.g. PHYS102)"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Section Title (e.g. Lab Makeup Policy)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Paste policy text here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold cursor-pointer"
                >
                  Save to RAG Vector Store
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: AGENT MEMORY */}
          {activeTab === 'memory' && (
            <div className="space-y-6">
              {/* Stats telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Total Memories</div>
                  <div className="text-xl font-bold text-white font-mono">{memories.length}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Episodic Logs</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono">
                    {memories.filter((m) => m.type === 'episodic').length}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Semantic Patterns</div>
                  <div className="text-xl font-bold text-sky-400 font-mono">
                    {memories.filter((m) => m.type === 'semantic').length}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Discovered Habits</div>
                  <div className="text-xl font-bold text-amber-400 font-mono">
                    {agentMemory.getHabits().length}
                  </div>
                </div>
              </div>

              {/* Detected Habit Patterns */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  Learned Student Rhythms & Cognitive Tendencies
                </h3>
                <div className="space-y-2">
                  {agentMemory.getHabits().map((habit) => (
                    <div
                      key={habit.id}
                      className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">
                          {habit.courseCode && (
                            <span className="text-indigo-400 font-mono mr-1.5 font-bold">
                              [{habit.courseCode}]
                            </span>
                          )}
                          {habit.pattern}
                        </div>
                        <div className="text-[11px] text-slate-400 pt-0.5">
                          Action: <span className="text-emerald-300">{habit.recommendedAction}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-400 shrink-0">
                        <div>Confidence: {Math.round(habit.confidence * 100)}%</div>
                        <div>{habit.observedOccurrences} occurrences</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory Search & List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search memory..."
                      value={memSearch}
                      onChange={(e) => setMemSearch(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-1 text-[11px] font-mono">
                    {(['all', 'semantic', 'episodic', 'habit'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setMemFilter(t)}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          memFilter === t ? 'bg-indigo-500 text-white font-bold' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {agentMemory
                    .search(memSearch, memFilter === 'all' ? undefined : memFilter)
                    .map((mem) => (
                      <div
                        key={mem.id}
                        className="bg-slate-900/40 border border-white/10 rounded-lg p-3 space-y-1.5 hover:border-indigo-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold uppercase">
                            {mem.type} · {mem.key}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(mem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{mem.content}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                          <div className="flex gap-1">
                            {mem.tags.map((t) => (
                              <span key={t} className="text-slate-400">
                                #{t}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              agentMemory.delete(mem.id)
                              setMemories(agentMemory.getAll())
                            }}
                            className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Record Memory Form */}
              <form onSubmit={handleAddMemory} className="bg-slate-900/30 p-4 rounded-xl border border-white/10 space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Record New Agent Memory / Study Pattern
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. cs-exam-fatigue)"
                    value={newMemKey}
                    onChange={(e) => setNewMemKey(e.target.value)}
                    className="w-1/3 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Content / Finding..."
                    value={newMemContent}
                    onChange={(e) => setNewMemContent(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold cursor-pointer"
                  >
                    Commit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CONTEXT ENGINEERING */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              {/* Token Budget Meter */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Attention Budget & Token Allocation
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {contextAnatomy.totalTokens} / {contextAnatomy.tokenBudget} Tokens ({contextAnatomy.budgetUtilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden flex border border-white/10">
                  <div
                    style={{ width: `${(contextAnatomy.systemPromptTokens / contextAnatomy.tokenBudget) * 100}%` }}
                    className="bg-indigo-500"
                    title={`System Prompt: ${contextAnatomy.systemPromptTokens} tokens`}
                  />
                  <div
                    style={{ width: `${(contextAnatomy.retrievedDocsTokens / contextAnatomy.tokenBudget) * 100}%` }}
                    className="bg-sky-500"
                    title={`RAG Documents: ${contextAnatomy.retrievedDocsTokens} tokens`}
                  />
                  <div
                    style={{ width: `${(contextAnatomy.memoryExcerptsTokens / contextAnatomy.tokenBudget) * 100}%` }}
                    className="bg-purple-500"
                    title={`Memory Excerpts: ${contextAnatomy.memoryExcerptsTokens} tokens`}
                  />
                  <div
                    style={{ width: `${(contextAnatomy.stateSnapshotTokens / contextAnatomy.tokenBudget) * 100}%` }}
                    className="bg-emerald-500"
                    title={`State Snapshot: ${contextAnatomy.stateSnapshotTokens} tokens`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>System Prompt ({contextAnatomy.systemPromptTokens}t)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>RAG Docs ({contextAnatomy.retrievedDocsTokens}t)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Memory ({contextAnatomy.memoryExcerptsTokens}t)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>State Snapshot ({contextAnatomy.stateSnapshotTokens}t)</span>
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure & Masking Toggle */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase">
                      Observation Masking & Progressive Disclosure
                    </h3>
                    <p className="text-xs text-slate-400 pt-0.5">
                      Replaces verbose raw JSON traces with high-signal causal summaries to preserve model attention and prevent lost-in-the-middle degradation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick()
                      setMaskObservations((prev) => !prev)
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      maskObservations
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {maskObservations ? 'Masking Active (-68% Tokens)' : 'Raw Telemetry'}
                  </button>
                </div>
              </div>

              {/* Live Context Prompt Payload Preview */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Dynamic Grounded Prompt Payload
                </h3>
                <pre className="p-3.5 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap">
                  {contextEngine.buildPromptPayload(
                    'Student asks: How should I handle falling behind 3h in CS101?',
                    ragResult.retrievedChunks.map((r) => r.chunk),
                    memories.slice(0, 3),
                    deadlines,
                    preferences
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: HARNESS & STRESS TESTS */}
          {activeTab === 'harness' && (
            <div className="space-y-6">
              {/* Scenario Picker */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-400" />
                    Automated Perturbation & Stress Scenarios
                  </span>
                  <span className="text-xs font-mono text-amber-400">
                    Execution Latency: {stressResult.executionTimeMs} ms
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'chaos_midterms', title: 'Chaos Midterms', desc: '3 surprise deadlines (+12h)' },
                    { id: 'lost_afternoon', title: 'Emergency Outage', desc: '6h blocked out unexpectedly' },
                    { id: 'sleep_squeeze', title: 'Sleep Squeeze', desc: 'Strict 9h circadian lock' },
                    { id: 'triple_dayoff', title: 'Extreme Rest', desc: 'Fri, Sat, Sun marked as off' },
                  ].map((scen) => (
                    <button
                      key={scen.id}
                      onClick={() => handleRunStress(scen.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedScenario === scen.id
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{scen.title}</div>
                      <div className="text-[10px] text-slate-400 pt-0.5">{scen.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress Telemetry Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Blocks Ingested</div>
                  <div className="text-lg font-bold text-white font-mono">{stressResult.blocksAfter}</div>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Displaced Sessions</div>
                  <div className={`text-lg font-bold font-mono ${stressResult.displacedCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stressResult.displacedCount}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Recovery Success</div>
                  <div className="text-lg font-bold text-sky-400 font-mono">
                    {stressResult.recoverySuccessRate}%
                  </div>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Invariants State</div>
                  <div className={`text-lg font-bold font-mono ${stressResult.invariantsPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stressResult.invariantsPassed ? 'PASSED' : 'VIOLATION'}
                  </div>
                </div>
              </div>

              {/* Invariant Verification List */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Scheduler Invariant Guardrails
                </h3>
                <div className="space-y-2">
                  {stressResult.invariants.map((inv) => (
                    <div
                      key={inv.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        inv.passed
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {inv.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold font-mono">{inv.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 pl-6">{inv.description}</p>
                        {inv.details && inv.details.length > 0 && (
                          <div className="pl-6 pt-1 text-[11px] font-mono text-rose-300">
                            {inv.details.map((d, idx) => (
                              <div key={idx}>• {d}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        inv.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {inv.passed ? '0 Violations' : `${inv.violationsCount} Violations`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EVALS & ERROR ANALYSIS */}
          {activeTab === 'evals' && (
            <div className="space-y-6">
              {/* Overall Scorecard */}
              <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900/60 p-5 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">
                    Academic Resilience Audit Score
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {evalReport.overallScore >= 85
                      ? 'Grade: A+ (Optimal Resilience)'
                      : evalReport.overallScore >= 70
                      ? 'Grade: B (Moderate Load)'
                      : 'Grade: C (Urgent Attention Required)'}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans max-w-xl">
                    {evalReport.recommendation}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/40 bg-emerald-500/10 shrink-0">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {evalReport.overallScore}%
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Composite</span>
                </div>
              </div>

              {/* Multi-Dimensional Rubric */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Multi-Dimensional Evaluation Rubric
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evalReport.dimensions.map((dim) => (
                    <div
                      key={dim.name}
                      className="bg-slate-900/40 border border-white/10 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white">{dim.name}</span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          dim.assessment === 'excellent'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : dim.assessment === 'good'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {dim.score}% · {dim.assessment}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${dim.score}%` }}
                          className={`h-full ${
                            dim.score >= 80 ? 'bg-emerald-400' : dim.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-400 font-sans">{dim.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Taxonomy Findings */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Automated Error Taxonomy & Root Cause Diagnostics
                </h3>
                {evalReport.findings.length === 0 ? (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-center text-xs font-mono text-emerald-300">
                    ✓ Zero critical errors detected. All temporal slots, circadian boundaries, and capacity limits intact.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evalReport.findings.map((finding) => (
                      <div
                        key={finding.id}
                        className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            [{finding.category}] {finding.affectedDay}
                          </span>
                          <span className="text-rose-400 font-bold uppercase text-[10px]">
                            {finding.severity}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{finding.message}</div>
                        <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded border border-white/5 font-mono">
                          <span className="text-amber-400 font-bold">Root Cause:</span> {finding.rootCause}
                        </div>
                        <div className="text-[11px] text-emerald-400 pt-0.5 font-mono">
                          <strong>Action:</strong> {finding.suggestedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

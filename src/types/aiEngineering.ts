import type { DayOfWeek } from './index'

// --- 1. AGENT MEMORY SYSTEM TYPES ---
export type MemoryType = 'working' | 'episodic' | 'semantic' | 'habit'

export interface MemoryEntry {
  id: string
  type: MemoryType
  key: string
  content: string
  tags: string[]
  createdAt: number
  importance: number // 1 - 5
  recencyWeight?: number
  metadata?: Record<string, unknown>
}

export interface HabitPattern {
  id: string
  courseCode?: string
  pattern: string
  confidence: number // 0.0 - 1.0
  observedOccurrences: number
  recommendedAction: string
}

export interface MemoryStats {
  totalMemories: number
  episodicCount: number
  semanticCount: number
  workingCount: number
  habitPatternsDetected: number
}

// --- 2. CONTEXT ENGINEERING TYPES ---
export interface ContextAnatomy {
  systemPromptTokens: number
  retrievedDocsTokens: number
  memoryExcerptsTokens: number
  stateSnapshotTokens: number
  totalTokens: number
  tokenBudget: number
  budgetUtilizationPct: number
  isCompacted: boolean
}

export interface CompactionReport {
  originalTokens: number
  compactedTokens: number
  compressionRatio: number
  retainedSignals: string[]
  maskedObservationsCount: number
}

// --- 3. RETRIEVAL AUGMENTED GENERATION (RAG) TYPES ---
export interface CourseDocument {
  id: string
  courseCode: string
  title: string
  category: 'syllabus' | 'policy' | 'rubric' | 'office_hours'
  lastUpdated: string
  chunks: DocumentChunk[]
}

export interface DocumentChunk {
  id: string
  documentId: string
  courseCode: string
  sectionTitle: string
  content: string
  citation: string // e.g. "[CS101 Syllabus §3.1 Late Policy]"
  keywords: string[]
}

export interface RAGSearchResult {
  chunk: DocumentChunk
  similarityScore: number // 0.0 - 1.0
  matchedKeywords: string[]
  denseScore: number
  sparseScore: number
}

export interface RAGQueryResponse {
  query: string
  retrievedChunks: RAGSearchResult[]
  groundedAnswer: string
  citations: string[]
  confidence: number
}

// --- 4. HARNESS ENGINEERING TYPES ---
export interface InvariantCheck {
  id: string
  name: string
  passed: boolean
  description: string
  violationsCount: number
  details?: string[]
}

export interface StressScenarioResult {
  scenarioName: string
  blocksBefore: number
  blocksAfter: number
  displacedCount: number
  recoverySuccessRate: number // 0 - 100%
  invariantsPassed: boolean
  invariants: InvariantCheck[]
  executionTimeMs: number
}

// --- 5. EVALS & ERROR ANALYSIS TYPES ---
export interface EvalDimension {
  name: string
  score: number // 0 - 100
  weight: number
  assessment: 'excellent' | 'good' | 'fair' | 'failing'
  explanation: string
}

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'info'

export interface DiagnosticFinding {
  id: string
  category: 'OVERBOOKED_SLOT' | 'SLEEP_TRESPASS' | 'CAPACITY_EXHAUSTION' | 'DISPLACED_CRITICAL' | 'BUFFER_STARVATION'
  severity: ErrorSeverity
  affectedDay: DayOfWeek
  message: string
  rootCause: string
  suggestedAction: string
}

export interface EvalsAuditReport {
  overallScore: number // 0 - 100
  dimensions: EvalDimension[]
  findings: DiagnosticFinding[]
  timestamp: string
  recommendation: string
}

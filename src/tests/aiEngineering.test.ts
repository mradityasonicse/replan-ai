import { describe, it, expect } from 'vitest'
import { AgentMemoryStore } from '../utils/ai/memory'
import { ContextEngine, estimateTokens } from '../utils/ai/contextManager'
import { RAGEngine } from '../utils/ai/ragEngine'
import { HarnessRunner } from '../utils/ai/harness'
import { EvalsEngine } from '../utils/ai/evalsEngine'
import type { StudentPreferences, AcademicDeadline, ScheduledBlock } from '../types'

const mockPrefs: StudentPreferences = {
  wakeTime: '07:30',
  bedTime: '23:30',
  targetSleepHours: 8,
  peakEnergy: 'morning',
  bufferMinutes: 15,
  maxDailyDeepWorkHours: 5,
  daysOff: ['Sun'],
  energyLevel: 'okay',
  calmMode: false,
  currentDay: 'Mon',
  helpDeskEmail: 'advisor@campus.edu',
}

describe('AI Engineering Suite', () => {
  describe('Agent Memory System', () => {
    it('writes, reads, and searches episodic and semantic memories with recency weighting', () => {
      const memory = new AgentMemoryStore()
      memory.write('test-pattern', 'Student experiences high cognitive fatigue after 3 consecutive hours', 'semantic', ['fatigue', 'study'], 5)

      const readEntry = memory.read('test-pattern')
      expect(readEntry).toBeDefined()
      expect(readEntry?.content).toContain('cognitive fatigue')

      const searchHits = memory.search('fatigue')
      expect(searchHits.length).toBeGreaterThan(0)
      expect(searchHits[0].key).toBe('test-pattern')

      const habits = memory.getHabits()
      expect(habits.length).toBeGreaterThan(0)
      expect(habits[0].confidence).toBeGreaterThan(0.7)
    })
  })

  describe('Context Engineering Engine', () => {
    it('calculates token budget, performs progressive disclosure, and executes compaction', () => {
      const engine = new ContextEngine()
      const text = 'Quick brown fox jumps over the lazy dog'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(5)

      const deadlines: AcademicDeadline[] = [
        {
          id: 'dl-1',
          courseCode: 'CS101',
          title: 'Algorithms Midterm',
          dueDay: 'Wed',
          dueTime: '23:59',
          estimatedHours: 6,
          completedHours: 2,
          priority: 'critical',
          energyRequirement: 'deep_work',
          weightPercentage: 20,
        },
      ]

      const anatomy = engine.analyzeContext([], [], deadlines, [], mockPrefs, true)
      expect(anatomy.systemPromptTokens).toBeGreaterThan(0)
      expect(anatomy.stateSnapshotTokens).toBeGreaterThan(0)
      expect(anatomy.budgetUtilizationPct).toBeLessThan(100)
      expect(anatomy.isCompacted).toBe(true)

      const compaction = engine.runCompaction('very long JSON state '.repeat(50), ['moved block A', 'moved block B'])
      expect(compaction.compressionRatio).toBeGreaterThan(0.5)
      expect(compaction.retainedSignals.length).toBeGreaterThan(0)
    })
  })

  describe('Course RAG Engine', () => {
    it('retrieves relevant course policies with citation attribution and supports custom ingestion', () => {
      const rag = new RAGEngine()

      // Query CS101 late policy
      const csHits = rag.search('CS101 grace days late submission', 3)
      expect(csHits.length).toBeGreaterThan(0)
      expect(csHits[0].chunk.courseCode).toBe('CS101')
      expect(csHits[0].chunk.citation).toContain('CS101')

      // Query grounded answer
      const response = rag.queryKnowledgeBase('What is the late penalty for CS101?')
      expect(response.groundedAnswer).toContain('grace tokens')
      expect(response.citations.length).toBeGreaterThan(0)

      // Ingest custom syllabus document
      const customChunk = rag.addCustomDocument(
        'PHYS301',
        'Quantum Physics Syllabus',
        'Quiz Retake Policy',
        'Students may retake one failed quiz per month during office hours.'
      )
      expect(customChunk.id).toBeDefined()

      const physHits = rag.search('PHYS301 retake quiz', 1)
      expect(physHits.length).toBe(1)
      expect(physHits[0].chunk.courseCode).toBe('PHYS301')
    })
  })

  describe('Harness Engineering & Invariant Testing', () => {
    it('verifies non-collision, circadian boundaries, and runs stress scenario benchmarks', () => {
      const runner = new HarnessRunner()

      const validBlocks: ScheduledBlock[] = [
        {
          id: 'b-1',
          type: 'study_sprint',
          title: 'Algorithms Prep',
          dayOfWeek: 'Mon',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          status: 'scheduled',
          color: '#38bdf8',
        },
        {
          id: 'b-2',
          type: 'study_sprint',
          title: 'Calculus Review',
          dayOfWeek: 'Mon',
          startTime: '13:00',
          endTime: '15:00',
          durationMinutes: 120,
          status: 'scheduled',
          color: '#818cf8',
        },
      ]

      const invariants = runner.verifyInvariants(validBlocks, [], mockPrefs)
      expect(invariants.length).toBe(5)
      expect(invariants.every((inv) => inv.passed)).toBe(true)

      // Stress test scenario
      const stressResult = runner.runStressScenario('chaos_midterms', [], [], [], mockPrefs)
      expect(stressResult.scenarioName).toContain('Chaos Midterms')
      expect(stressResult.executionTimeMs).toBeGreaterThanOrEqual(0)
      expect(stressResult.invariants.length).toBe(5)
    })
  })

  describe('Evals and Error Diagnostics', () => {
    it('scores schedule across multi-dimensional rubrics and identifies taxonomy root causes', () => {
      const evals = new EvalsEngine()

      const overlappingBlocks: ScheduledBlock[] = [
        {
          id: 'b-col-1',
          type: 'study_sprint',
          title: 'Deep Sprint 1',
          dayOfWeek: 'Tue',
          startTime: '10:00',
          endTime: '12:00',
          durationMinutes: 120,
          status: 'scheduled',
          color: '#38bdf8',
        },
        {
          id: 'b-col-2',
          type: 'study_sprint',
          title: 'Deep Sprint 2 Overlap',
          dayOfWeek: 'Tue',
          startTime: '11:30',
          endTime: '13:30',
          durationMinutes: 120,
          status: 'scheduled',
          color: '#f43f5e',
        },
      ]

      const report = evals.evaluateSchedule(overlappingBlocks, [], mockPrefs)
      expect(report.overallScore).toBeLessThan(100)
      expect(report.dimensions.length).toBe(5)

      // Check error taxonomy finding
      const overlapFinding = report.findings.find((f) => f.category === 'OVERBOOKED_SLOT')
      expect(overlapFinding).toBeDefined()
      expect(overlapFinding?.severity).toBe('critical')
      expect(overlapFinding?.rootCause).toContain('overlapping minutes')
      expect(overlapFinding?.suggestedAction).toBeDefined()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { computeRecoveryPlan } from '../utils/recovery'
import { generateRealisticPlan } from '../utils/scheduler'
import { PRESET_SCENARIOS } from '../utils/presets'
import type { DisruptionEvent } from '../types'

describe('Recovery & Resilience Engine', () => {
  const scenario = PRESET_SCENARIOS[0]
  const initialBlocks = generateRealisticPlan(
    scenario.classes,
    scenario.personal,
    scenario.deadlines,
    scenario.preferences
  )

  it('successfully recovers when student oversleeps and loses morning time', () => {
    const disruption: DisruptionEvent = {
      id: 'disrupt-overslept-1',
      type: 'overslept',
      title: 'Overslept 2.5 hours',
      description: 'Alarm failed, woke up at 10:00 instead of 07:30',
      day: 'Mon',
      timeLostMinutes: 150,
      startDisruptionTime: '07:30',
    }

    const proposal = computeRecoveryPlan(
      disruption,
      initialBlocks,
      scenario.deadlines,
      scenario.personal,
      scenario.preferences
    )

    expect(proposal).toBeDefined()
    expect(proposal.tradeoffSummary.length).toBeGreaterThan(0)
    expect(proposal.newProposedBlocks.length).toBeGreaterThan(0)
    expect(proposal.confidenceScore).toBeGreaterThan(50)

    const mondayRecoveredBlocks = proposal.newProposedBlocks.filter(
      b => b.dayOfWeek === 'Mon' && b.notes?.includes('Auto-Recovered')
    )
    mondayRecoveredBlocks.forEach(b => {
      expect(b.startTime >= '10:00').toBe(true)
    })
  })

  it('handles an assignment taking 2 hours longer by creating an extension sprint', () => {
    const deadline = scenario.deadlines[0]
    const disruption: DisruptionEvent = {
      id: 'disrupt-longer-1',
      type: 'task_longer',
      title: 'Project 3 took 2 hours longer',
      description: 'Encountered segmentation fault during memory test',
      day: 'Tue',
      timeLostMinutes: 120,
      affectedDeadlineId: deadline.id,
    }

    const proposal = computeRecoveryPlan(
      disruption,
      initialBlocks,
      scenario.deadlines,
      scenario.personal,
      scenario.preferences
    )

    expect(proposal.tradeoffSummary.some(s => s.includes('required an additional'))).toBe(true)
    expect(proposal.rescheduledCount).toBeGreaterThanOrEqual(1)
  })
})

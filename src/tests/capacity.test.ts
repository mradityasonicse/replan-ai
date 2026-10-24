import { describe, it, expect } from 'vitest'
import { computeDailyCapacity, computeWeekCapacityMetrics } from '../utils/capacity'
import { PRESET_SCENARIOS } from '../utils/presets'
import { generateRealisticPlan } from '../utils/scheduler'

describe('Capacity & Burnout Analyzer', () => {
  const scenario = PRESET_SCENARIOS[0] // Engineering Midterm
  const blocks = generateRealisticPlan(
    scenario.classes,
    scenario.personal,
    scenario.deadlines,
    scenario.preferences
  )

  it('computes daily capacity accurately for a heavy day', () => {
    const mondayCapacity = computeDailyCapacity(
      'Mon',
      blocks,
      scenario.deadlines,
      scenario.preferences
    )

    expect(mondayCapacity.totalAwakeHours).toBe(16) // 07:30 to 23:30 = 16 hours
    expect(mondayCapacity.fixedCommitmentHours).toBeGreaterThanOrEqual(1.5) // CS210 class
    expect(mondayCapacity.burnoutRisk).toBeDefined()
    expect(mondayCapacity.energyScore).toBeGreaterThanOrEqual(0)
    expect(mondayCapacity.energyScore).toBeLessThanOrEqual(100)
  })

  it('computes overall week capacity metrics without crashes', () => {
    const weekMetrics = computeWeekCapacityMetrics(
      blocks,
      scenario.deadlines,
      scenario.preferences
    )

    expect(weekMetrics.totalStudyHoursNeeded).toBeGreaterThan(0)
    expect(weekMetrics.totalStudyHoursScheduled).toBeGreaterThan(0)
    expect(weekMetrics.overallBurnoutIndex).toBeGreaterThanOrEqual(0)
    expect(weekMetrics.overallBurnoutIndex).toBeLessThanOrEqual(100)
  })
})

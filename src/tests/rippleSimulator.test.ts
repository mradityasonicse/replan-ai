import { describe, it, expect } from 'vitest'
import { runRippleSimulation } from '../utils/rippleSimulator'
import type { StudentPreferences } from '../types'

const mockPrefs: StudentPreferences = {
  wakeTime: '07:30',
  bedTime: '23:30',
  targetSleepHours: 8,
  peakEnergy: 'morning',
  bufferMinutes: 15,
  maxDailyDeepWorkHours: 5,
  daysOff: [],
  energyLevel: 'okay',
  calmMode: false,
  currentDay: 'Mon',
  helpDeskEmail: 'student-advisor@campus.edu',
}

describe('Ripple Simulator Engine', () => {
  it('correctly simulates lost time and identifies cascade impact', () => {
    const simulation = runRippleSimulation(
      {
        type: 'lost',
        lostDay: 'Mon',
        lostStartTime: '14:00',
        lostHours: 3,
        taskTitle: '',
        taskDueDay: 'Thu',
        taskHours: 3,
      },
      [],
      [],
      [
        {
          id: 'dl-cs101',
          courseCode: 'CS101',
          title: 'Algorithms Problem Set',
          dueDay: 'Tue',
          dueTime: '23:59',
          estimatedHours: 4,
          completedHours: 0,
          priority: 'critical',
          energyRequirement: 'deep_work',
          weightPercentage: 20,
        },
      ],
      mockPrefs
    )

    expect(simulation).toBeDefined()
    expect(simulation.disruptionSummary).toContain('Lost 3h on Mon')
    expect(simulation.affectedDay).toBe('Mon')
    expect(Array.isArray(simulation.moves)).toBe(true)
    expect(Array.isArray(simulation.conflicts)).toBe(true)
  })

  it('correctly simulates a surprise assignment and recalculates timeline', () => {
    const simulation = runRippleSimulation(
      {
        type: 'task',
        lostDay: 'Wed',
        lostStartTime: '10:00',
        lostHours: 2,
        taskTitle: 'Surprise Chemistry Lab Report',
        taskDueDay: 'Fri',
        taskHours: 4,
      },
      [],
      [],
      [],
      mockPrefs
    )

    expect(simulation).toBeDefined()
    expect(simulation.disruptionSummary).toContain('Surprise Assignment')
    expect(simulation.affectedDay).toBe('Fri')
    expect(simulation.revisedBlocks.length).toBeGreaterThan(0)
  })
})

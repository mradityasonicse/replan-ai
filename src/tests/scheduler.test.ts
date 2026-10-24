import { describe, it, expect } from 'vitest'
import {
  sliceDeadlineIntoSprints,
  generateRealisticPlan,
  getFreeSlotsForDay,
} from '../utils/scheduler'
import { PRESET_SCENARIOS } from '../utils/presets'
import { timeToMinutes } from '../utils/time'

describe('Smart Scheduler & Slicer', () => {
  const scenario = PRESET_SCENARIOS[0]

  it('slices a 5.5 hour project into realistic multiple sprints', () => {
    const deadline = scenario.deadlines[0] // 5.5h project
    const sprints = sliceDeadlineIntoSprints(deadline)

    expect(sprints.length).toBeGreaterThan(1)
    sprints.forEach((sprint) => {
      expect(sprint.durationMinutes).toBeGreaterThanOrEqual(45)
      expect(sprint.durationMinutes).toBeLessThanOrEqual(120)
    })
  })

  it('generates schedule blocks where no study sprint overlaps a protected class', () => {
    const blocks = generateRealisticPlan(
      scenario.classes,
      scenario.personal,
      scenario.deadlines,
      scenario.preferences
    )

    const classes = blocks.filter((b) => b.type === 'class')
    const studySprints = blocks.filter((b) => b.type === 'study_sprint')

    classes.forEach((cls) => {
      const clsStart = timeToMinutes(cls.startTime)
      const clsEnd = timeToMinutes(cls.endTime)

      const collidingSprints = studySprints.filter((sp) => {
        if (sp.dayOfWeek !== cls.dayOfWeek) return false
        const spStart = timeToMinutes(sp.startTime)
        const spEnd = timeToMinutes(sp.endTime)
        return Math.max(clsStart, spStart) < Math.min(clsEnd, spEnd)
      })

      expect(collidingSprints.length).toBe(0)
    })
  })

  it('finds available free time slots between wake and bedtime', () => {
    const blocks = generateRealisticPlan(
      scenario.classes,
      scenario.personal,
      scenario.deadlines,
      scenario.preferences
    )

    const freeSlots = getFreeSlotsForDay('Mon', blocks, scenario.preferences)
    expect(freeSlots.length).toBeGreaterThan(0)
    freeSlots.forEach((slot) => {
      expect(slot.durationMin).toBeGreaterThanOrEqual(45)
    })
  })
})

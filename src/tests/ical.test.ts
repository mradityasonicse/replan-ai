import { describe, it, expect } from 'vitest'
import { generateICalendar } from '../utils/ical'
import { generateRealisticPlan } from '../utils/scheduler'
import { PRESET_SCENARIOS } from '../utils/presets'

describe('iCalendar Export Generator', () => {
  const scenario = PRESET_SCENARIOS[0]
  const blocks = generateRealisticPlan(
    scenario.classes,
    scenario.personal,
    scenario.deadlines,
    scenario.preferences
  )

  it('generates standard RFC 5545 iCalendar string', () => {
    const ics = generateICalendar(blocks)

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//ChronoFlow')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:')
    expect(ics).toContain('DTSTART:')
    expect(ics).toContain('DTEND:')
    expect(ics).toContain('END:VCALENDAR')
  })
})

import type { AcademicDeadline, DayOfWeek } from '../types'

export function parseNaturalLanguageDeadlines(rawText: string): Partial<AcademicDeadline>[] {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0)
  const results: Partial<AcademicDeadline>[] = []

  lines.forEach((line, index) => {
    const text = line.trim()
    if (!text) return

    // 1. Detect Day of Week
    let detectedDay: DayOfWeek = 'Fri'
    const dayMatch = text.match(/\b(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\b/i)
    if (dayMatch) {
      const matchLower = dayMatch[1].toLowerCase()
      if (matchLower.startsWith('mon')) detectedDay = 'Mon'
      else if (matchLower.startsWith('tue')) detectedDay = 'Tue'
      else if (matchLower.startsWith('wed')) detectedDay = 'Wed'
      else if (matchLower.startsWith('thu')) detectedDay = 'Thu'
      else if (matchLower.startsWith('fri')) detectedDay = 'Fri'
      else if (matchLower.startsWith('sat')) detectedDay = 'Sat'
      else if (matchLower.startsWith('sun')) detectedDay = 'Sun'
    }

    // 2. Detect Due Time: Look for "5:00pm", "14:00", or "2pm"
    let detectedTime = '23:59'
    const timeWithColon = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i)
    const timeWithAmPm = text.match(/\b(\d{1,2})\s*(am|pm)\b/i)

    if (timeWithColon) {
      let h = parseInt(timeWithColon[1], 10)
      const m = timeWithColon[2]
      const meridiem = timeWithColon[3]?.toLowerCase()
      if (meridiem === 'pm' && h < 12) h += 12
      if (meridiem === 'am' && h === 12) h = 0
      detectedTime = `${h.toString().padStart(2, '0')}:${m}`
    } else if (timeWithAmPm) {
      let h = parseInt(timeWithAmPm[1], 10)
      const meridiem = timeWithAmPm[2].toLowerCase()
      if (meridiem === 'pm' && h < 12) h += 12
      if (meridiem === 'am' && h === 12) h = 0
      detectedTime = `${h.toString().padStart(2, '0')}:00`
    }

    // 3. Detect Estimated Hours
    let detectedHours = 3.0
    const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b/i)
    if (hoursMatch) {
      detectedHours = parseFloat(hoursMatch[1])
    }

    // 4. Detect Course Code (e.g. CS 210, MATH 240, CHEM 102)
    let courseCode = 'ACAD'
    const courseMatch = text.match(/\b([A-Z]{2,5}\s*-?\s*\d{2,4})\b/i)
    if (courseMatch) {
      courseCode = courseMatch[1].toUpperCase().replace(/\s+/, ' ')
    }

    // 5. Clean Title
    let title = text
      .replace(new RegExp(courseCode, 'i'), '')
      .replace(/\b(due|by|on|at|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\b/gi, '')
      .replace(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b/gi, '')
      .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi, '')
      .replace(/\b\d{1,2}\s*(?:am|pm)\b/gi, '')
      .replace(/[-:,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!title || title.length < 3) {
      title = `Assignment #${index + 1}`
    }

    results.push({
      id: `parsed-${Date.now()}-${index}`,
      courseCode,
      title,
      dueDay: detectedDay,
      dueTime: detectedTime,
      estimatedHours: detectedHours,
      completedHours: 0,
      priority: detectedHours >= 5 ? 'critical' : detectedHours >= 3 ? 'high' : 'medium',
      energyRequirement: 'deep_work',
      weightPercentage: detectedHours >= 5 ? 20 : 10,
    })
  })

  return results
}

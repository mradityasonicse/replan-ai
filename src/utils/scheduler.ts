import type {
  DayOfWeek,
  ClassCommitment,
  AcademicDeadline,
  PersonalCommitment,
  ScheduledBlock,
  StudentPreferences,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import {
  timeToMinutes,
  minutesToTime,
  dayToIndex,
} from './time'

interface TimeSlot {
  day: DayOfWeek
  startMin: number
  endMin: number
  durationMin: number
}

// Helper to get color per course or type
const COLOR_PALETTE = [
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
]

export function getCourseColor(courseCode: string): string {
  let hash = 0
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[index]
}

/**
 * Slices a deadline into realistic deep work sessions (45 to 120 mins each)
 */
export function sliceDeadlineIntoSprints(
  deadline: AcademicDeadline
): { title: string; durationMinutes: number; stage: string }[] {
  const remainingHours = Math.max(0.5, deadline.estimatedHours - deadline.completedHours)
  const totalMinutes = Math.round(remainingHours * 60)

  // Ideal sprint length: 75-90 minutes
  const targetSprintMinutes = 90
  const sprintCount = Math.max(1, Math.round(totalMinutes / targetSprintMinutes))
  const sprintMinutes = Math.round(totalMinutes / sprintCount)

  const sprints = []
  for (let i = 0; i < sprintCount; i++) {
    let stage = 'Sprint'
    if (sprintCount > 1) {
      if (i === 0) stage = 'Setup & Foundation'
      else if (i === sprintCount - 1) stage = 'Final Polish & Review'
      else stage = `Core Deep Work (Part ${i + 1})`
    } else {
      stage = 'Execution Sprint'
    }

    sprints.push({
      title: `${deadline.courseCode}: ${deadline.title} (${stage})`,
      durationMinutes: sprintMinutes,
      stage,
    })
  }

  return sprints
}

/**
 * Finds available free time slots for a given day
 */
export function getFreeSlotsForDay(
  day: DayOfWeek,
  fixedBlocks: ScheduledBlock[],
  prefs: StudentPreferences
): TimeSlot[] {
  if (prefs.daysOff && prefs.daysOff.includes(day)) {
    return []
  }

  const wakeMin = timeToMinutes(prefs.wakeTime)
  const bedMin = timeToMinutes(prefs.bedTime)
  const bufferMin = prefs.bufferMinutes

  // Sort existing blocks on this day chronologically
  const dayBlocks = fixedBlocks
    .filter(b => b.dayOfWeek === day && b.status !== 'displaced')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const freeSlots: TimeSlot[] = []
  let cursor = wakeMin + 30 // 30m morning buffer

  for (const block of dayBlocks) {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)

    // Check if there is room before this block
    if (blockStart - cursor >= 45 + bufferMin) {
      freeSlots.push({
        day,
        startMin: cursor,
        endMin: blockStart - bufferMin,
        durationMin: (blockStart - bufferMin) - cursor,
      })
    }

    cursor = Math.max(cursor, blockEnd + bufferMin)
  }

  // Check remaining time until bedtime
  if (bedMin - cursor >= 45 + bufferMin) {
    freeSlots.push({
      day,
      startMin: cursor,
      endMin: bedMin - bufferMin,
      durationMin: (bedMin - bufferMin) - cursor,
    })
  }

  return freeSlots
}

/**
 * Builds the initial realistic schedule from classes, personal commitments, and deadlines
 */
export function generateRealisticPlan(
  classes: ClassCommitment[],
  personal: PersonalCommitment[],
  deadlines: AcademicDeadline[],
  prefs: StudentPreferences
): ScheduledBlock[] {
  const scheduledBlocks: ScheduledBlock[] = []

  // 1. Add all fixed classes as protected blocks
  classes.forEach(c => {
    scheduledBlocks.push({
      id: `class-${c.id}`,
      type: 'class',
      referenceId: c.id,
      title: `${c.courseCode} - ${c.courseName}`,
      courseCode: c.courseCode,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      durationMinutes: timeToMinutes(c.endTime) - timeToMinutes(c.startTime),
      status: 'scheduled',
      isProtected: true,
      color: c.color || getCourseColor(c.courseCode),
      notes: c.location || (c.isLab ? 'Lab Session' : 'Lecture'),
    })
  })

  // 2. Add personal commitments
  personal.forEach(p => {
    scheduledBlocks.push({
      id: `personal-${p.id}`,
      type: 'personal',
      referenceId: p.id,
      title: p.title,
      dayOfWeek: p.dayOfWeek,
      startTime: p.startTime,
      endTime: p.endTime,
      durationMinutes: timeToMinutes(p.endTime) - timeToMinutes(p.startTime),
      status: 'scheduled',
      isProtected: p.flexibility === 'immovable',
      color: p.color || '#64748b',
    })
  })

  // 3. Sort deadlines by urgency and priority
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const dayOrder = dayToIndex(a.dueDay) - dayToIndex(b.dueDay)
    if (dayOrder !== 0) return dayOrder

    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityWeight[b.priority] - priorityWeight[a.priority]
  })

  // 4. For each deadline, slice into sprints and place them realistically
  sortedDeadlines.forEach(deadline => {
    const sprints = sliceDeadlineIntoSprints(deadline)
    const dueDayIdx = dayToIndex(deadline.dueDay)

    sprints.forEach((sprint, sprintIdx) => {
      let targetDayIdx = Math.max(0, dueDayIdx - (sprints.length - 1 - sprintIdx))
      if (targetDayIdx > dueDayIdx) targetDayIdx = dueDayIdx

      let scheduled = false

      const candidateDays: DayOfWeek[] = []
      for (let offset = 0; offset <= dueDayIdx; offset++) {
        const dIdx = (targetDayIdx + offset) <= dueDayIdx ? targetDayIdx + offset : targetDayIdx - offset
        if (dIdx >= 0 && dIdx <= dueDayIdx) {
          const candidate = DAYS_OF_WEEK[dIdx]
          // Respect designated Days Off (student sick day, reset day, or holiday)
          if (prefs.daysOff && prefs.daysOff.includes(candidate)) continue
          if (!candidateDays.includes(candidate)) candidateDays.push(candidate)
        }
      }

      // Compute energy-adjusted daily focus limit
      const energyDelta = prefs.energyLevel === 'drained' ? -2 : prefs.energyLevel === 'fresh' ? 1 : 0
      const effectiveDailyMaxHours = Math.max(1.5, prefs.maxDailyDeepWorkHours + energyDelta)
      const effectiveDailyMaxMinutes = Math.round(effectiveDailyMaxHours * 60)

      for (const candidateDay of candidateDays) {
        // Guard daily cognitive capacity
        const existingDayStudyMinutes = scheduledBlocks
          .filter(b => b.dayOfWeek === candidateDay && b.type === 'study_sprint')
          .reduce((acc, b) => acc + b.durationMinutes, 0)

        if (existingDayStudyMinutes + sprint.durationMinutes > effectiveDailyMaxMinutes) {
          continue // Daily limit reached, seek next free day
        }

        const freeSlots = getFreeSlotsForDay(candidateDay, scheduledBlocks, prefs)

        for (const slot of freeSlots) {
          if (slot.durationMin >= sprint.durationMinutes) {
            const startMin = slot.startMin
            const endMin = startMin + sprint.durationMinutes

            if (candidateDay === deadline.dueDay) {
              const dueMin = timeToMinutes(deadline.dueTime)
              if (endMin > dueMin) continue
            }

            scheduledBlocks.push({
              id: `study-${deadline.id}-${sprintIdx}`,
              type: 'study_sprint',
              referenceId: deadline.id,
              title: sprint.title,
              courseCode: deadline.courseCode,
              dayOfWeek: candidateDay,
              startTime: minutesToTime(startMin),
              endTime: minutesToTime(endMin),
              durationMinutes: sprint.durationMinutes,
              status: 'scheduled',
              energyRequirement: deadline.energyRequirement,
              priority: deadline.priority,
              color: getCourseColor(deadline.courseCode),
              notes: sprint.stage,
            })

            scheduled = true
            break
          }
        }

        if (scheduled) break
      }

      if (!scheduled) {
        for (const day of candidateDays) {
          const freeSlots = getFreeSlotsForDay(day, scheduledBlocks, prefs)
          const bestSlot = freeSlots.find(s => s.durationMin >= 45)
          if (bestSlot) {
            const effectiveDuration = Math.min(bestSlot.durationMin, sprint.durationMinutes)
            scheduledBlocks.push({
              id: `study-${deadline.id}-${sprintIdx}`,
              type: 'study_sprint',
              referenceId: deadline.id,
              title: sprint.title,
              courseCode: deadline.courseCode,
              dayOfWeek: day,
              startTime: minutesToTime(bestSlot.startMin),
              endTime: minutesToTime(bestSlot.startMin + effectiveDuration),
              durationMinutes: effectiveDuration,
              status: 'scheduled',
              energyRequirement: deadline.energyRequirement,
              priority: deadline.priority,
              color: getCourseColor(deadline.courseCode),
              notes: `${sprint.stage} (Compressed)`,
            })
            break
          }
        }
      }
    })
  })

  return scheduledBlocks
}

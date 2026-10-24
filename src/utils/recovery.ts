import type {
  ScheduledBlock,
  AcademicDeadline,
  PersonalCommitment,
  StudentPreferences,
  DisruptionEvent,
  RecoveryProposal,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import {
  timeToMinutes,
  minutesToTime,
  calculateDurationHours,
  dayToIndex,
} from './time'
import { getFreeSlotsForDay, getCourseColor } from './scheduler'

export function computeRecoveryPlan(
  disruption: DisruptionEvent,
  currentBlocks: ScheduledBlock[],
  deadlines: AcademicDeadline[],
  personal: PersonalCommitment[],
  prefs: StudentPreferences
): RecoveryProposal {
  const disruptionDayIdx = dayToIndex(disruption.day)
  const disruptionStartMin = disruption.startDisruptionTime
    ? timeToMinutes(disruption.startDisruptionTime)
    : timeToMinutes(prefs.wakeTime)
  const disruptionEndMin = disruptionStartMin + disruption.timeLostMinutes

  const displacedBlocks: ScheduledBlock[] = []
  const remainingUntouchedBlocks: ScheduledBlock[] = []
  const tradeoffSummary: string[] = []

  // 1. Identify which blocks got disrupted
  currentBlocks.forEach(block => {
    const blockDayIdx = dayToIndex(block.dayOfWeek)
    if (blockDayIdx < disruptionDayIdx) {
      remainingUntouchedBlocks.push(block)
      return
    }

    if (blockDayIdx === disruptionDayIdx) {
      const blockStart = timeToMinutes(block.startTime)
      const blockEnd = timeToMinutes(block.endTime)

      const overlaps = Math.max(blockStart, disruptionStartMin) < Math.min(blockEnd, disruptionEndMin)
      
      if (overlaps) {
        if (block.isProtected && block.type === 'class') {
          displacedBlocks.push({ ...block, status: 'interrupted' })
          tradeoffSummary.push(`Missed class: ${block.title}. Logged notes catch-up.`)
        } else if (block.type === 'study_sprint') {
          displacedBlocks.push({ ...block, status: 'displaced' })
        } else if (block.type === 'personal') {
          displacedBlocks.push({ ...block, status: 'displaced' })
        }
        return
      }
    }

    remainingUntouchedBlocks.push(block)
  })

  // Handle deadline requiring more time
  if (disruption.type === 'task_longer' && disruption.affectedDeadlineId) {
    const affected = deadlines.find(d => d.id === disruption.affectedDeadlineId)
    if (affected) {
      tradeoffSummary.push(
        `Assignment "${affected.title}" required an additional ${(disruption.timeLostMinutes / 60).toFixed(1)} hours.`
      )
      displacedBlocks.push({
        id: `extra-study-${affected.id}-${Date.now()}`,
        type: 'study_sprint',
        referenceId: affected.id,
        title: `${affected.courseCode}: ${affected.title} (Extension Sprint)`,
        courseCode: affected.courseCode,
        dayOfWeek: disruption.day,
        startTime: '00:00',
        endTime: '00:00',
        durationMinutes: disruption.timeLostMinutes,
        status: 'displaced',
        energyRequirement: affected.energyRequirement,
        priority: affected.priority,
        color: getCourseColor(affected.courseCode),
        notes: 'Recovery Deep Work Sprint',
      })
    }
  }

  // 2. Reschedule displaced study sprints
  const studySprintsToReschedule = displacedBlocks.filter(b => b.type === 'study_sprint')
  const newProposedBlocks: ScheduledBlock[] = [...remainingUntouchedBlocks]
  let rescheduledCount = 0
  let droppedOptionalCount = 0
  const deadlinesAtRisk: RecoveryProposal['deadlinesAtRisk'] = []

  const skippableCommitments = personal.filter(p => p.flexibility === 'skippable')

  studySprintsToReschedule.sort((a, b) => {
    const deadlineA = deadlines.find(d => d.id === a.referenceId)
    const deadlineB = deadlines.find(d => d.id === b.referenceId)
    const dayA = deadlineA ? dayToIndex(deadlineA.dueDay) : 7
    const dayB = deadlineB ? dayToIndex(deadlineB.dueDay) : 7
    return dayA - dayB
  })

  studySprintsToReschedule.forEach(sprint => {
    const deadline = deadlines.find(d => d.id === sprint.referenceId)
    const maxDayIdx = deadline ? dayToIndex(deadline.dueDay) : 6
    let placed = false

    for (let dayIdx = disruptionDayIdx; dayIdx <= 6; dayIdx++) {
      const targetDay = DAYS_OF_WEEK[dayIdx]
      const isPastDeadline = dayIdx > maxDayIdx

      const freeSlots = getFreeSlotsForDay(targetDay, newProposedBlocks, prefs)

      for (const slot of freeSlots) {
        if (dayIdx === disruptionDayIdx && slot.startMin < disruptionEndMin) {
          if (slot.endMin - disruptionEndMin >= 45) {
            slot.startMin = disruptionEndMin
            slot.durationMin = slot.endMin - disruptionEndMin
          } else {
            continue
          }
        }

        if (slot.durationMin >= 45) {
          const duration = Math.min(slot.durationMin, sprint.durationMinutes)
          const startMin = slot.startMin
          const endMin = startMin + duration

          if (deadline && targetDay === deadline.dueDay) {
            const dueMin = timeToMinutes(deadline.dueTime)
            if (endMin > dueMin) continue
          }

          newProposedBlocks.push({
            ...sprint,
            id: `${sprint.id}-recovered`,
            dayOfWeek: targetDay,
            startTime: minutesToTime(startMin),
            endTime: minutesToTime(endMin),
            durationMinutes: duration,
            status: 'scheduled',
            notes: isPastDeadline ? '⚠️ Postponed near deadline' : '⚡ Auto-Recovered Slot',
          })

          tradeoffSummary.push(
            `Rescheduled "${sprint.title}" to ${targetDay} at ${minutesToTime(startMin)}.`
          )
          rescheduledCount++
          placed = true
          break
        }
      }

      if (placed) break
    }

    if (!placed && skippableCommitments.length > 0) {
      const toDrop = skippableCommitments.shift()
      if (toDrop) {
        const dropIndex = newProposedBlocks.findIndex(b => b.referenceId === toDrop.id)
        if (dropIndex !== -1) {
          const removed = newProposedBlocks.splice(dropIndex, 1)[0]
          droppedOptionalCount++
          tradeoffSummary.push(
            `Sacrificed optional "${removed.title}" on ${removed.dayOfWeek} to protect critical coursework.`
          )

          newProposedBlocks.push({
            ...sprint,
            id: `${sprint.id}-recovered-in-dropped`,
            dayOfWeek: removed.dayOfWeek,
            startTime: removed.startTime,
            endTime: removed.endTime,
            durationMinutes: removed.durationMinutes,
            status: 'scheduled',
            notes: '⚡ Reclaimed from optional activity',
          })
          rescheduledCount++
          placed = true
        }
      }
    }

    if (!placed) {
      if (deadline) {
        deadlinesAtRisk.push({
          deadlineId: deadline.id,
          title: deadline.title,
          deficitHours: calculateDurationHours('00:00', minutesToTime(sprint.durationMinutes)),
          suggestedAction: `Request 24-hr extension from Professor or focus on core 80% rubric criteria.`,
        })
      }
    }
  })

  if (rescheduledCount > 0 && deadlinesAtRisk.length === 0) {
    tradeoffSummary.unshift(
      `Full recovery achieved! All ${rescheduledCount} displaced study sessions absorbed without violating sleep or missing deadlines.`
    )
  } else if (deadlinesAtRisk.length > 0) {
    tradeoffSummary.unshift(
      `Capacity limit reached: Absorbed ${rescheduledCount} sessions, but ${deadlinesAtRisk.length} assignment needs tactical triage.`
    )
  }

  const confidenceScore = deadlinesAtRisk.length === 0
    ? 95
    : Math.max(50, 90 - deadlinesAtRisk.length * 20)

  return {
    disruption,
    displacedBlocks,
    newProposedBlocks,
    rescheduledCount,
    droppedOptionalCount,
    tradeoffSummary,
    deadlinesAtRisk,
    confidenceScore,
  }
}

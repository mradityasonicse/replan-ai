import type {
  EvalDimension,
  DiagnosticFinding,
  EvalsAuditReport,
} from '../../types/aiEngineering'
import type {
  ScheduledBlock,
  AcademicDeadline,
  StudentPreferences,
} from '../../types'
import { DAYS_OF_WEEK } from '../../types'
import { timeToMinutes } from '../time'

export class EvalsEngine {
  /**
   * Evaluates the current schedule across 5 rigorous academic dimensions
   */
  public evaluateSchedule(
    blocks: ScheduledBlock[],
    deadlines: AcademicDeadline[],
    prefs: StudentPreferences
  ): EvalsAuditReport {
    const findings: DiagnosticFinding[] = []

    // --- 1. Feasibility (Temporal collision & classes) ---
    let collisionCount = 0
    DAYS_OF_WEEK.forEach((day) => {
      const dayBlocks = blocks
        .filter((b) => b.dayOfWeek === day && b.status !== 'displaced')
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

      for (let i = 0; i < dayBlocks.length - 1; i++) {
        if (timeToMinutes(dayBlocks[i].endTime) > timeToMinutes(dayBlocks[i + 1].startTime)) {
          collisionCount++
          findings.push({
            id: `err-col-${day}-${i}`,
            category: 'OVERBOOKED_SLOT',
            severity: 'critical',
            affectedDay: day,
            message: `Temporal collision between "${dayBlocks[i].title}" and "${dayBlocks[i + 1].title}".`,
            rootCause: `Two commitments were assigned overlapping minutes (${dayBlocks[i].endTime} > ${dayBlocks[i + 1].startTime}).`,
            suggestedAction: `Trigger Ripple Re-solve to slide the lower priority block into next available free slot.`,
          })
        }
      }
    })
    const feasibilityScore = Math.max(0, 100 - collisionCount * 30)

    // --- 2. Burnout Defense (Daily deep work limit) ---
    let burnoutViolations = 0
    const maxDaily = prefs.maxDailyDeepWorkHours || 6
    DAYS_OF_WEEK.forEach((day) => {
      const deepHours = blocks
        .filter((b) => b.dayOfWeek === day && b.type === 'study_sprint' && b.status !== 'displaced')
        .reduce((sum, b) => sum + b.durationMinutes / 60, 0)

      if (deepHours > maxDaily + 0.25) {
        burnoutViolations++
        findings.push({
          id: `err-burnout-${day}`,
          category: 'CAPACITY_EXHAUSTION',
          severity: 'high',
          affectedDay: day,
          message: `${deepHours.toFixed(1)}h deep work scheduled on ${day} exceeds maximum target of ${maxDaily}h.`,
          rootCause: `High volume of upcoming deadlines forced multiple sprints into the same single-day window.`,
          suggestedAction: `Redistribute sessions across earlier weekdays or negotiate assignment weight with course instructor.`,
        })
      }
    })
    const burnoutScore = Math.max(0, 100 - burnoutViolations * 25)

    // --- 3. Deliverable Completion ---
    let totalNeededHours = 0
    let totalScheduledHours = 0
    let unplacedCriticalCount = 0

    deadlines.forEach((dl) => {
      const needed = dl.estimatedHours - dl.completedHours
      totalNeededHours += needed

      const sched = blocks
        .filter((b) => b.referenceId === dl.id && b.type === 'study_sprint' && b.status !== 'displaced')
        .reduce((sum, b) => sum + b.durationMinutes / 60, 0)
      totalScheduledHours += sched

      if (sched < needed - 0.25 && (dl.priority === 'critical' || dl.priority === 'high')) {
        unplacedCriticalCount++
        findings.push({
          id: `err-dl-${dl.id}`,
          category: 'DISPLACED_CRITICAL',
          severity: 'critical',
          affectedDay: dl.dueDay,
          message: `Critical task "${dl.title}" has ${(needed - sched).toFixed(1)}h unscheduled before due date ${dl.dueDay}.`,
          rootCause: `Insufficient remaining free slots before ${dl.dueDay} deadline after preserving classes and sleep.`,
          suggestedAction: `Draft emergency campus accommodation email or utilize a course grace-day token.`,
        })
      }
    })

    const completionRatio = totalNeededHours > 0
      ? Math.min(1.0, totalScheduledHours / totalNeededHours)
      : 1.0
    const deliverableScore = Math.round(completionRatio * 100)

    // --- 4. Rest & Sleep Preservation ---
    let sleepViolations = 0
    const wakeMin = timeToMinutes(prefs.wakeTime || '07:30')
    const bedMin = timeToMinutes(prefs.bedTime || '23:30')

    blocks.forEach((b) => {
      if (b.status === 'displaced') return
      const sMin = timeToMinutes(b.startTime)
      const eMin = timeToMinutes(b.endTime)
      if (sMin < wakeMin || eMin > bedMin) {
        sleepViolations++
        findings.push({
          id: `err-sleep-${b.id}`,
          category: 'SLEEP_TRESPASS',
          severity: 'high',
          affectedDay: b.dayOfWeek,
          message: `Session "${b.title}" scheduled at ${b.startTime}-${b.endTime} infringes on circadian sleep window.`,
          rootCause: `Evening spillover caused study sprint to extend past ${prefs.bedTime} bedtime anchor.`,
          suggestedAction: `Enforce hard bedtime lock and move session to the following morning.`,
        })
      }
    })
    const restScore = Math.max(0, 100 - sleepViolations * 25)

    // --- 5. Stability & Buffer Integrity ---
    const displacedBlocksCount = blocks.filter((b) => b.status === 'displaced').length
    const stabilityScore = Math.max(0, 100 - displacedBlocksCount * 15)

    // Multi-Dimensional Rubric compilation
    const dimensions: EvalDimension[] = [
      {
        name: 'Temporal Feasibility',
        score: feasibilityScore,
        weight: 0.25,
        assessment: feasibilityScore >= 90 ? 'excellent' : feasibilityScore >= 70 ? 'good' : feasibilityScore >= 50 ? 'fair' : 'failing',
        explanation: `${collisionCount} overlapping time block collisions detected.`,
      },
      {
        name: 'Burnout Protection',
        score: burnoutScore,
        weight: 0.20,
        assessment: burnoutScore >= 90 ? 'excellent' : burnoutScore >= 70 ? 'good' : burnoutScore >= 50 ? 'fair' : 'failing',
        explanation: `${burnoutViolations} days exceed ${maxDaily}h deep work ceiling.`,
      },
      {
        name: 'Deliverable Coverage',
        score: deliverableScore,
        weight: 0.25,
        assessment: deliverableScore >= 90 ? 'excellent' : deliverableScore >= 70 ? 'good' : deliverableScore >= 50 ? 'fair' : 'failing',
        explanation: `${Math.round(completionRatio * 100)}% of required study hours safely scheduled.`,
      },
      {
        name: 'Circadian Sleep Sanctity',
        score: restScore,
        weight: 0.15,
        assessment: restScore >= 90 ? 'excellent' : restScore >= 70 ? 'good' : restScore >= 50 ? 'fair' : 'failing',
        explanation: `${sleepViolations} sessions violate sleep bedtime or wake anchors.`,
      },
      {
        name: 'Schedule Stability',
        score: stabilityScore,
        weight: 0.15,
        assessment: stabilityScore >= 90 ? 'excellent' : stabilityScore >= 70 ? 'good' : stabilityScore >= 50 ? 'fair' : 'failing',
        explanation: `${displacedBlocksCount} blocks currently displaced awaiting resolution.`,
      },
    ]

    const overallScore = Math.round(
      dimensions.reduce((acc, dim) => acc + dim.score * dim.weight, 0)
    )

    let recommendation = 'Your schedule has exceptional integrity. All invariants and sleep anchors are preserved.'
    if (overallScore < 70) {
      recommendation = 'Multiple safety invariants violated. Run the Ripple Simulator or execute an AI Re-balance.'
    } else if (unplacedCriticalCount > 0) {
      recommendation = `Heads up: ${unplacedCriticalCount} critical assignments lack sufficient preparation hours.`
    }

    return {
      overallScore,
      dimensions,
      findings,
      timestamp: new Date().toLocaleTimeString(),
      recommendation,
    }
  }
}

export const evalsEngine = new EvalsEngine()

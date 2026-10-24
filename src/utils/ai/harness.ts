import type {
  InvariantCheck,
  StressScenarioResult,
} from '../../types/aiEngineering'
import type {
  ScheduledBlock,
  AcademicDeadline,
  ClassCommitment,
  PersonalCommitment,
  StudentPreferences,
  DayOfWeek,
} from '../../types'
import { generateRealisticPlan } from '../scheduler'
import { timeToMinutes } from '../time'
import { DAYS_OF_WEEK } from '../../types'

export class HarnessRunner {
  /**
   * Verifies all core system invariants on a given schedule
   */
  public verifyInvariants(
    blocks: ScheduledBlock[],
    deadlines: AcademicDeadline[],
    prefs: StudentPreferences
  ): InvariantCheck[] {
    const checks: InvariantCheck[] = []

    // 1. Invariant: No overlapping blocks on the same day
    let overlapViolations = 0
    const overlapDetails: string[] = []
    const dayGroups = new Map<DayOfWeek, ScheduledBlock[]>()

    blocks.forEach((b) => {
      if (!dayGroups.has(b.dayOfWeek)) dayGroups.set(b.dayOfWeek, [])
      dayGroups.get(b.dayOfWeek)!.push(b)
    })

    dayGroups.forEach((dayBlocks, day) => {
      const activeBlocks = dayBlocks
        .filter((b) => b.status !== 'displaced')
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

      for (let i = 0; i < activeBlocks.length - 1; i++) {
        const curr = activeBlocks[i]
        const next = activeBlocks[i + 1]
        const currEnd = timeToMinutes(curr.endTime)
        const nextStart = timeToMinutes(next.startTime)

        if (currEnd > nextStart) {
          overlapViolations++
          overlapDetails.push(`${day}: "${curr.title}" (${curr.endTime}) overlaps "${next.title}" (${next.startTime})`)
        }
      }
    })

    checks.push({
      id: 'inv-no-overlap',
      name: 'Temporal Non-Collision Invariant',
      description: 'Guarantees no two study sprints or classes occupy the same time slice.',
      passed: overlapViolations === 0,
      violationsCount: overlapViolations,
      details: overlapDetails.slice(0, 3),
    })

    // 2. Invariant: Sleep & Circadian Boundary Sanctity
    let sleepViolations = 0
    const sleepDetails: string[] = []
    const wakeMin = timeToMinutes(prefs.wakeTime || '07:30')
    const bedMin = timeToMinutes(prefs.bedTime || '23:30')

    blocks.forEach((b) => {
      if (b.status === 'displaced' || b.type === 'sleep') return
      const startMin = timeToMinutes(b.startTime)
      const endMin = timeToMinutes(b.endTime)

      // Check if block crosses into sleep zone
      if (startMin < wakeMin || endMin > bedMin) {
        sleepViolations++
        sleepDetails.push(`${b.dayOfWeek}: "${b.title}" scheduled at ${b.startTime}-${b.endTime} violates sleep anchor (${prefs.wakeTime}-${prefs.bedTime})`)
      }
    })

    checks.push({
      id: 'inv-circadian-sanctity',
      name: 'Circadian Sleep Boundary Invariant',
      description: 'Strict prohibition against scheduling study sessions inside biological sleep anchors.',
      passed: sleepViolations === 0,
      violationsCount: sleepViolations,
      details: sleepDetails.slice(0, 3),
    })

    // 3. Invariant: Day Off Rest Sanctity
    let dayOffViolations = 0
    const dayOffDetails: string[] = []
    const daysOffSet = new Set(prefs.daysOff || [])

    blocks.forEach((b) => {
      if (b.type === 'study_sprint' && b.status !== 'displaced' && daysOffSet.has(b.dayOfWeek)) {
        dayOffViolations++
        dayOffDetails.push(`Sprint "${b.title}" scheduled on designated Day Off (${b.dayOfWeek})`)
      }
    })

    checks.push({
      id: 'inv-day-off-sanctity',
      name: 'Designated Rest / Day-Off Sanctity',
      description: 'Ensures zero cognitive study sprints are allocated on student-designated rest days.',
      passed: dayOffViolations === 0,
      violationsCount: dayOffViolations,
      details: dayOffDetails.slice(0, 3),
    })

    // 4. Invariant: Daily Deep Work Ceiling
    let capacityViolations = 0
    const capacityDetails: string[] = []
    const maxDailyLimitMin = (prefs.maxDailyDeepWorkHours || 6) * 60

    DAYS_OF_WEEK.forEach((day) => {
      const daySprintMin = blocks
        .filter((b) => b.dayOfWeek === day && b.type === 'study_sprint' && b.status !== 'displaced')
        .reduce((sum, b) => sum + b.durationMinutes, 0)

      if (daySprintMin > maxDailyLimitMin + 15) { // 15m tolerance
        capacityViolations++
        capacityDetails.push(`${day}: ${(daySprintMin / 60).toFixed(1)}h deep work exceeds limit of ${prefs.maxDailyDeepWorkHours}h`)
      }
    })

    checks.push({
      id: 'inv-capacity-ceiling',
      name: 'Deep Work Capacity Ceiling',
      description: 'Prevents burnout by capping daily deep cognitive effort at user preferences.',
      passed: capacityViolations === 0,
      violationsCount: capacityViolations,
      details: capacityDetails.slice(0, 3),
    })

    // 5. Invariant: Deadline Temporal Precedence
    let deadlineViolations = 0
    const deadlineDetails: string[] = []

    deadlines.forEach((dl) => {
      const dueDayIndex = DAYS_OF_WEEK.indexOf(dl.dueDay)
      const dlBlocks = blocks.filter((b) => b.referenceId === dl.id && b.type === 'study_sprint' && b.status !== 'displaced')

      dlBlocks.forEach((b) => {
        const blockDayIndex = DAYS_OF_WEEK.indexOf(b.dayOfWeek)
        if (blockDayIndex > dueDayIndex) {
          deadlineViolations++
          deadlineDetails.push(`"${dl.title}" study session on ${b.dayOfWeek} is after due date ${dl.dueDay}`)
        }
      })
    })

    checks.push({
      id: 'inv-deadline-precedence',
      name: 'Deliverable Temporal Precedence',
      description: 'Guarantees study sessions are strictly scheduled prior to the assignment submission deadline.',
      passed: deadlineViolations === 0,
      violationsCount: deadlineViolations,
      details: deadlineDetails.slice(0, 3),
    })

    return checks
  }

  /**
   * Runs an automated stress scenario through the scheduler harness
   */
  public runStressScenario(
    scenarioType: 'chaos_midterms' | 'lost_afternoon' | 'sleep_squeeze' | 'triple_dayoff',
    currentClasses: ClassCommitment[],
    currentPersonal: PersonalCommitment[],
    currentDeadlines: AcademicDeadline[],
    prefs: StudentPreferences
  ): StressScenarioResult {
    const startTime = performance.now()

    let simDeadlines = [...currentDeadlines]
    let simPersonal = [...currentPersonal]
    let simPrefs = { ...prefs }
    let scenarioName = ''

    if (scenarioType === 'chaos_midterms') {
      scenarioName = 'Chaos Midterms (3 Surprise Ingestions)'
      simDeadlines.push(
        {
          id: 'stress-dl-1',
          courseCode: 'CS101',
          title: 'Surprise Kernel Programming Lab',
          dueDay: 'Wed',
          dueTime: '23:59',
          estimatedHours: 5,
          completedHours: 0,
          priority: 'critical',
          energyRequirement: 'deep_work',
          weightPercentage: 25,
        },
        {
          id: 'stress-dl-2',
          courseCode: 'MATH201',
          title: 'Calculus Proof Set 4',
          dueDay: 'Thu',
          dueTime: '23:59',
          estimatedHours: 4,
          completedHours: 0,
          priority: 'high',
          energyRequirement: 'deep_work',
          weightPercentage: 15,
        },
        {
          id: 'stress-dl-3',
          courseCode: 'CHEM201',
          title: 'Spectroscopy Analysis Report',
          dueDay: 'Fri',
          dueTime: '23:59',
          estimatedHours: 3,
          completedHours: 0,
          priority: 'medium',
          energyRequirement: 'deep_work',
          weightPercentage: 10,
        }
      )
    } else if (scenarioType === 'lost_afternoon') {
      scenarioName = 'Emergency Outage (6h Blocked Out)'
      simPersonal.push(
        {
          id: 'stress-pers-1',
          title: 'Hospital Emergency / Flare-up',
          dayOfWeek: 'Tue',
          startTime: '13:00',
          endTime: '17:00',
          flexibility: 'immovable',
          category: 'health',
          color: '#ef4444',
        },
        {
          id: 'stress-pers-2',
          title: 'Car Breakdown Commute Delay',
          dayOfWeek: 'Thu',
          startTime: '09:00',
          endTime: '11:00',
          flexibility: 'immovable',
          category: 'errand',
          color: '#f97316',
        }
      )
    } else if (scenarioType === 'sleep_squeeze') {
      scenarioName = 'Sleep Squeeze (Strict 9h Sleep Anchor)'
      simPrefs.wakeTime = '08:30'
      simPrefs.bedTime = '22:00'
      simPrefs.maxDailyDeepWorkHours = 4.5
    } else {
      scenarioName = 'Extreme Rest (Fri, Sat, Sun Days-Off)'
      simPrefs.daysOff = ['Fri', 'Sat', 'Sun']
      simPrefs.maxDailyDeepWorkHours = 6
    }

    const blocksBefore = generateRealisticPlan(currentClasses, currentPersonal, currentDeadlines, prefs)
    const blocksAfter = generateRealisticPlan(currentClasses, simPersonal, simDeadlines, simPrefs)

    const invariants = this.verifyInvariants(blocksAfter, simDeadlines, simPrefs)
    const invariantsPassed = invariants.every((inv) => inv.passed)

    const displacedCount = blocksAfter.filter((b) => b.status === 'displaced').length
    const totalSprints = blocksAfter.filter((b) => b.type === 'study_sprint').length
    const recoverySuccessRate = totalSprints > 0
      ? Math.max(0, Math.min(100, Math.round(((totalSprints - displacedCount) / totalSprints) * 100)))
      : 100

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2))

    return {
      scenarioName,
      blocksBefore: blocksBefore.length,
      blocksAfter: blocksAfter.length,
      displacedCount,
      recoverySuccessRate,
      invariantsPassed,
      invariants,
      executionTimeMs,
    }
  }
}

export const harnessRunner = new HarnessRunner()

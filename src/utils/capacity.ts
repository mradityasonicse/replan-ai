import type {
  DayOfWeek,
  ScheduledBlock,
  AcademicDeadline,
  StudentPreferences,
  DayCapacity,
  WeekCapacityMetrics,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import { calculateDurationHours } from './time'

export function computeDailyCapacity(
  day: DayOfWeek,
  blocks: ScheduledBlock[],
  _deadlines: AcademicDeadline[],
  prefs: StudentPreferences
): DayCapacity {
  const dayBlocks = blocks.filter(b => b.dayOfWeek === day && b.status !== 'displaced')

  // Calculate awake window
  const awakeHours = calculateDurationHours(prefs.wakeTime, prefs.bedTime)

  // Categorize blocks for this day
  let fixedCommitmentHours = 0
  let studyPlannedHours = 0
  let personalHours = 0

  dayBlocks.forEach(b => {
    const duration = calculateDurationHours(b.startTime, b.endTime)
    if (b.type === 'class') {
      fixedCommitmentHours += duration
    } else if (b.type === 'study_sprint') {
      studyPlannedHours += duration
    } else if (b.type === 'personal') {
      personalHours += duration
    }
  })

  // Mandatory essentials buffer: meal times (~1.5h) + baseline buffers
  const essentialsBufferHours = 2.0
  const totalOccupiedHours = fixedCommitmentHours + studyPlannedHours + personalHours + essentialsBufferHours
  const freeBufferHours = Math.max(0, awakeHours - totalOccupiedHours)
  const deficitHours = Math.max(0, totalOccupiedHours - awakeHours)

  // Energy & Burnout scoring
  let burnoutRisk: 'healthy' | 'moderate' | 'critical' = 'healthy'
  if (deficitHours > 0 || studyPlannedHours > prefs.maxDailyDeepWorkHours + 1.5) {
    burnoutRisk = 'critical'
  } else if (studyPlannedHours > prefs.maxDailyDeepWorkHours || freeBufferHours < 1.0) {
    burnoutRisk = 'moderate'
  }

  // Energy score (100 = optimal balance, lower = exhaustion)
  const loadRatio = totalOccupiedHours / Math.max(1, awakeHours)
  const energyScore = Math.max(10, Math.min(100, Math.round(100 - loadRatio * 60 + freeBufferHours * 8)))

  return {
    day,
    totalAwakeHours: awakeHours,
    fixedCommitmentHours: Number(fixedCommitmentHours.toFixed(1)),
    studyPlannedHours: Number(studyPlannedHours.toFixed(1)),
    personalHours: Number(personalHours.toFixed(1)),
    freeBufferHours: Number(freeBufferHours.toFixed(1)),
    deficitHours: Number(deficitHours.toFixed(1)),
    burnoutRisk,
    energyScore,
  }
}

export function computeWeekCapacityMetrics(
  blocks: ScheduledBlock[],
  deadlines: AcademicDeadline[],
  prefs: StudentPreferences
): WeekCapacityMetrics {
  const dailyCapacities = DAYS_OF_WEEK.map(day =>
    computeDailyCapacity(day, blocks, deadlines, prefs)
  )

  const totalStudyHoursNeeded = deadlines.reduce((acc, d) => {
    const remaining = Math.max(0, d.estimatedHours - d.completedHours)
    return acc + remaining
  }, 0)

  const totalStudyHoursScheduled = blocks
    .filter(b => b.type === 'study_sprint' && b.status !== 'displaced')
    .reduce((acc, b) => acc + calculateDurationHours(b.startTime, b.endTime), 0)

  const daysWithDeficit = dailyCapacities
    .filter(c => c.deficitHours > 0)
    .map(c => c.day)

  const criticalCount = dailyCapacities.filter(c => c.burnoutRisk === 'critical').length
  const moderateCount = dailyCapacities.filter(c => c.burnoutRisk === 'moderate').length

  const overallBurnoutIndex = Math.min(
    100,
    Math.round((criticalCount * 30 + moderateCount * 15 + daysWithDeficit.length * 15))
  )

  const unallocatedDeadlineHours = Math.max(0, totalStudyHoursNeeded - totalStudyHoursScheduled)

  return {
    totalStudyHoursNeeded: Number(totalStudyHoursNeeded.toFixed(1)),
    totalStudyHoursScheduled: Number(totalStudyHoursScheduled.toFixed(1)),
    overallBurnoutIndex,
    daysWithDeficit,
    healthySleepRate: prefs.targetSleepHours >= 7 ? 94 : 70,
    unallocatedDeadlineHours: Number(unallocatedDeadlineHours.toFixed(1)),
  }
}

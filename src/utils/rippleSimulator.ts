import type {
  DayOfWeek,
  ClassCommitment,
  PersonalCommitment,
  AcademicDeadline,
  ScheduledBlock,
  StudentPreferences,
  RippleSimulation,
  CausalMove,
  DeadlineShortfall,
} from '../types'
import { generateRealisticPlan } from './scheduler'
import { timeToMinutes } from './time'

export interface SimulationParams {
  type: 'lost' | 'task'
  lostDay: DayOfWeek
  lostStartTime: string
  lostHours: number
  taskTitle: string
  taskDueDay: DayOfWeek
  taskHours: number
}

export function runRippleSimulation(
  params: SimulationParams,
  currentClasses: ClassCommitment[],
  currentPersonal: PersonalCommitment[],
  currentDeadlines: AcademicDeadline[],
  prefs: StudentPreferences
): RippleSimulation {
  const originalBlocks = generateRealisticPlan(currentClasses, currentPersonal, currentDeadlines, prefs)

  // Construct modified inputs for the simulation
  const simClasses = [...currentClasses]
  const simPersonal = [...currentPersonal]
  const simDeadlines = [...currentDeadlines]
  let affectedDay: DayOfWeek = params.lostDay
  let disruptionSummary = ''

  if (params.type === 'lost') {
    affectedDay = params.lostDay
    disruptionSummary = `Lost ${params.lostHours}h on ${params.lostDay} from ${params.lostStartTime}`
    
    // Add a blocked personal commitment representing the lost time
    const startMin = timeToMinutes(params.lostStartTime)
    const endMin = startMin + Math.round(params.lostHours * 60)
    const endHour = Math.floor(endMin / 60)
    const endMinute = endMin % 60
    const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`

    simPersonal.push({
      id: `sim-lost-${Date.now()}`,
      title: 'Lost Time / Disruption',
      dayOfWeek: params.lostDay,
      startTime: params.lostStartTime,
      endTime: endTimeStr,
      flexibility: 'immovable',
      category: 'health',
      color: '#f43f5e',
    })
  } else {
    affectedDay = params.taskDueDay
    disruptionSummary = `Surprise Assignment: “${params.taskTitle}” (${params.taskHours}h) due ${params.taskDueDay}`
    
    // Add the new surprise deadline
    simDeadlines.push({
      id: `sim-new-task`,
      courseCode: 'SURPRISE',
      title: params.taskTitle.trim() || 'New Assignment',
      dueDay: params.taskDueDay,
      dueTime: '23:59',
      estimatedHours: params.taskHours,
      completedHours: 0,
      priority: 'critical',
      energyRequirement: 'deep_work',
      weightPercentage: 15,
    })
  }

  const revisedBlocks = generateRealisticPlan(simClasses, simPersonal, simDeadlines, prefs)

  // Compute key signatures
  const keyForBlock = (b: ScheduledBlock) => `${b.dayOfWeek}-${b.startTime}-${b.referenceId || b.title}`
  const originalKeySet = new Set(originalBlocks.map(keyForBlock))
  const movedBlockKeys = new Set<string>()
  const newBlockKeys = new Set<string>()

  revisedBlocks.forEach((b) => {
    const k = keyForBlock(b)
    if (b.referenceId === 'sim-new-task') {
      newBlockKeys.add(k)
    } else if (!originalKeySet.has(k)) {
      movedBlockKeys.add(k)
    }
  })

  // Build causal narrative for moves
  const moves: CausalMove[] = []

  // Check each deadline
  simDeadlines.forEach((dl) => {
    const origStudy = originalBlocks.filter((b) => b.referenceId === dl.id && b.type === 'study_sprint')
    const revStudy = revisedBlocks.filter((b) => b.referenceId === dl.id && b.type === 'study_sprint')

    const origTimeStr = origStudy.map((b) => `${b.dayOfWeek} ${b.startTime}–${b.endTime}`).join(', ') || 'Unplaced'
    const revTimeStr = revStudy.map((b) => `${b.dayOfWeek} ${b.startTime}–${b.endTime}`).join(', ') || 'Unplaced'

    if (dl.id === 'sim-new-task') {
      moves.push({
        taskTitle: dl.title,
        from: 'New Ingestion',
        to: revTimeStr,
        reason: `Placed in earliest free daytime hours before ${dl.dueDay}, preserving guarded bedtime.`,
      })
    } else if (origTimeStr !== revTimeStr) {
      let reason = `Re-packed downstream to accommodate the disruption while respecting the ${prefs.maxDailyDeepWorkHours}h/day limit.`
      if (params.type === 'lost' && origStudy.some((b) => b.dayOfWeek === params.lostDay)) {
        reason = `Your lost time on ${params.lostDay} overlapped this study sprint, so it shifted to the next free slot before deadline.`
      } else if (params.type === 'task') {
        reason = `Re-balanced to make room for “${params.taskTitle}” (due ${params.taskDueDay}).`
      }

      moves.push({
        taskTitle: dl.title,
        from: origTimeStr,
        to: revTimeStr,
        reason,
      })
    }
  })

  // Calculate shortfalls / conflicts
  const conflicts: DeadlineShortfall[] = []
  simDeadlines.forEach((dl) => {
    const scheduledHours = revisedBlocks
      .filter((b) => b.referenceId === dl.id && b.type === 'study_sprint')
      .reduce((acc, b) => acc + b.durationMinutes / 60, 0)

    const neededHours = dl.estimatedHours - dl.completedHours
    if (scheduledHours < neededHours - 0.25) {
      conflicts.push({
        deadlineId: dl.id,
        taskTitle: dl.title,
        unplacedHours: Number((neededHours - scheduledHours).toFixed(1)),
        dueDay: dl.dueDay,
        isNew: dl.id === 'sim-new-task',
      })
    }
  })

  return {
    disruptionType: params.type,
    disruptionSummary,
    originalBlocks,
    revisedBlocks,
    movedBlockKeys,
    newBlockKeys,
    moves,
    conflicts,
    affectedDay,
  }
}

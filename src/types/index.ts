export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type EnergyType = 'deep_work' | 'light_review' | 'group_collab' | 'admin'
export type BlockType = 'class' | 'study_sprint' | 'personal' | 'buffer' | 'sleep' | 'meal'
export type BlockStatus = 'scheduled' | 'in_progress' | 'completed' | 'interrupted' | 'displaced'

export interface ClassCommitment {
  id: string
  courseCode: string
  courseName: string
  location?: string
  dayOfWeek: DayOfWeek
  startTime: string // "09:00"
  endTime: string   // "10:30"
  isLab?: boolean
  color: string
}

export interface AcademicDeadline {
  id: string
  courseCode: string
  title: string
  dueDay: DayOfWeek
  dueTime: string // "23:59"
  estimatedHours: number
  completedHours: number
  priority: Priority
  energyRequirement: EnergyType
  weightPercentage: number // e.g. 15 for 15% of course grade
  notes?: string
}

export interface PersonalCommitment {
  id: string
  title: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  flexibility: 'immovable' | 'flexible' | 'skippable'
  category: 'work' | 'health' | 'social' | 'errand'
  color: string
}

export interface ScheduledBlock {
  id: string
  type: BlockType
  referenceId?: string // id of class, deadline, or personal commitment
  title: string
  courseCode?: string
  dayOfWeek: DayOfWeek
  startTime: string // "14:00"
  endTime: string   // "15:30"
  durationMinutes: number
  status: BlockStatus
  energyRequirement?: EnergyType
  priority?: Priority
  isProtected?: boolean // e.g. fixed classes cannot be moved
  color: string
  notes?: string
}

export interface StudentPreferences {
  wakeTime: string      // "07:30"
  bedTime: string       // "23:30"
  targetSleepHours: number // 8.0
  peakEnergy: 'morning' | 'afternoon' | 'evening'
  bufferMinutes: number // 15
  maxDailyDeepWorkHours: number // 6.5
}

export interface DayCapacity {
  day: DayOfWeek
  totalAwakeHours: number
  fixedCommitmentHours: number
  studyPlannedHours: number
  personalHours: number
  freeBufferHours: number
  deficitHours: number // > 0 means overbooked
  burnoutRisk: 'healthy' | 'moderate' | 'critical'
  energyScore: number // 0 - 100
}

export interface WeekCapacityMetrics {
  totalStudyHoursNeeded: number
  totalStudyHoursScheduled: number
  overallBurnoutIndex: number // 0 - 100
  daysWithDeficit: DayOfWeek[]
  healthySleepRate: number // percentage
  unallocatedDeadlineHours: number
}

export interface DisruptionEvent {
  id: string
  type: 'overslept' | 'class_extended' | 'task_longer' | 'sick_burnout' | 'custom_lost_time' | 'surprise_deadline'
  title: string
  description: string
  day: DayOfWeek
  timeLostMinutes: number
  startDisruptionTime?: string
  affectedDeadlineId?: string
}

export interface RecoveryProposal {
  disruption: DisruptionEvent
  displacedBlocks: ScheduledBlock[]
  newProposedBlocks: ScheduledBlock[]
  rescheduledCount: number
  droppedOptionalCount: number
  tradeoffSummary: string[]
  deadlinesAtRisk: {
    deadlineId: string
    title: string
    deficitHours: number
    suggestedAction: string
  }[]
  confidenceScore: number // 0-100%
}

import type { DayOfWeek } from '../types'
import { DAYS_OF_WEEK } from '../types'

export function timeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0
  const [hoursStr, minutesStr] = timeStr.split(':')
  const hours = parseInt(hoursStr, 10) || 0
  const minutes = parseInt(minutesStr, 10) || 0
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.floor(minutes)))
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr || typeof timeStr !== 'string') return '12:00 PM'
  const [hStr, mStr] = timeStr.split(':')
  let hours = parseInt(hStr, 10) || 0
  const minutes = mStr || '00'
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

export function dayToIndex(day: DayOfWeek): number {
  return DAYS_OF_WEEK.indexOf(day)
}

export function indexToDay(index: number): DayOfWeek {
  const safeIndex = ((index % 7) + 7) % 7
  return DAYS_OF_WEEK[safeIndex]
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeToMinutes(startA)
  const a2 = timeToMinutes(endA)
  const b1 = timeToMinutes(startB)
  const b2 = timeToMinutes(endB)
  return Math.max(a1, b1) < Math.min(a2, b2)
}

export function calculateDurationHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return Math.max(0, (end - start) / 60)
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const current = timeToMinutes(timeStr)
  return minutesToTime(current + minutesToAdd)
}

import type { ScheduledBlock } from '../types'
import { dayToIndex } from './time'

export function generateICalendar(blocks: ScheduledBlock[]): string {
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const mondayOffset = (currentDayOfWeek + 6) % 7
  const mondayDate = new Date(now)
  mondayDate.setDate(now.getDate() - mondayOffset)

  let icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoFlow//Resilient Student Academic Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ChronoFlow Academic Plan',
    'X-WR-TIMEZONE:UTC',
  ].join('\r\n')

  blocks
    .filter(b => b.status !== 'displaced')
    .forEach(block => {
      const dayOffset = dayToIndex(block.dayOfWeek)
      const eventDate = new Date(mondayDate)
      eventDate.setDate(mondayDate.getDate() + dayOffset)

      const year = eventDate.getFullYear()
      const month = String(eventDate.getMonth() + 1).padStart(2, '0')
      const day = String(eventDate.getDate()).padStart(2, '0')

      const [startH, startM] = block.startTime.split(':')
      const [endH, endM] = block.endTime.split(':')

      const dtStart = `${year}${month}${day}T${startH}${startM}00`
      const dtEnd = `${year}${month}${day}T${endH}${endM}00`
      const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${block.id}@chronoflow.student`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${block.courseCode ? `[${block.courseCode}] ` : ''}${block.title}`,
        `DESCRIPTION:${block.notes || 'Scheduled via ChronoFlow Resilient Planner'}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT',
      ]

      icsString += '\r\n' + eventLines.join('\r\n')
    })

  icsString += '\r\nEND:VCALENDAR'
  return icsString
}

export function downloadICalendarFile(icsContent: string, filename = 'chronoflow_academic_week.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

import React from 'react'
import type { DayOfWeek, ScheduledBlock, StudentPreferences } from '../types'
import { DAYS_OF_WEEK } from '../types'
import { DayColumn } from './DayColumn'

interface WeekGridProps {
  blocks: ScheduledBlock[]
  preferences: StudentPreferences
  onToggleComplete: (blockId: string) => void
  onDisplaceBlock: (blockId: string) => void
  onOpenFocusMode?: (block: ScheduledBlock) => void
  onToggleDayOff?: (day: DayOfWeek) => void
}

export const WeekGrid: React.FC<WeekGridProps> = ({
  blocks,
  preferences,
  onToggleComplete,
  onDisplaceBlock,
  onOpenFocusMode,
  onToggleDayOff,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 pb-6">
        {DAYS_OF_WEEK.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={blocks}
            preferences={preferences}
            isDayOff={preferences.daysOff?.includes(day)}
            onToggleDayOff={onToggleDayOff}
            onToggleComplete={onToggleComplete}
            onDisplaceBlock={onDisplaceBlock}
            onOpenFocusMode={onOpenFocusMode}
          />
        ))}
      </div>
    </div>
  )
}

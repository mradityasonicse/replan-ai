import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  X,
  Copy,
  Check,
  Calendar,
  FileText,
} from 'lucide-react'
import type { ScheduledBlock, AcademicDeadline } from '../types'
import { generateICalendar, downloadICalendarFile } from '../utils/ical'
import { sound } from '../utils/sound'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  blocks: ScheduledBlock[]
  deadlines: AcademicDeadline[]
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  blocks,
  deadlines,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleDownloadIcs = () => {
    sound.playSuccessChime()
    const icsContent = generateICalendar(blocks)
    downloadICalendarFile(icsContent, 'chronoflow_academic_week.ics')
  }

  const generateMarkdownSummary = (): string => {
    let md = `# ChronoFlow Academic Week Plan\n\n`
    md += `## Deliverables & Deadlines\n`
    deadlines.forEach((d) => {
      md += `- **[${d.courseCode}] ${d.title}**: Due ${d.dueDay} @ ${d.dueTime} (${d.estimatedHours}h est)\n`
    })
    md += `\n## Scheduled Plan\n`
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
    days.forEach((day) => {
      const dayBlocks = blocks
        .filter((b) => b.dayOfWeek === day && b.status !== 'displaced')
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
      if (dayBlocks.length > 0) {
        md += `\n### ${day}\n`
        dayBlocks.forEach((b) => {
          md += `- \`${b.startTime} - ${b.endTime}\`: **${b.title}** (${b.type})\n`
        })
      }
    })
    return md
  }

  const handleCopyMarkdown = () => {
    sound.playComplete()
    const md = generateMarkdownSummary()
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="relative w-full max-w-lg specular-card rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <Download className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Export Academic Plan
              </h3>
            </div>
            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-5 space-y-4">
            {/* iCal Option */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Standard iCalendar (.ics)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Imports seamlessly into Google Calendar, Apple Calendar, and Outlook with notifications.
                </p>
              </div>
              <button
                onClick={handleDownloadIcs}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-md shadow-sky-500/20"
              >
                Download .ics
              </button>
            </div>

            {/* Markdown / Notion Option */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Markdown / Notion & Obsidian
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatted markdown checklist ready to paste into your personal digital workspace.
                </p>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy MD'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  FileText,
  BookOpen,
  Calendar,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import type {
  DayOfWeek,
  ClassCommitment,
  AcademicDeadline,
  PersonalCommitment,
} from '../types'
import { DAYS_OF_WEEK } from '../types'
import { parseNaturalLanguageDeadlines } from '../utils/parser'
import { sound } from '../utils/sound'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClass: (newClass: ClassCommitment) => void
  onAddDeadline: (newDeadline: AcademicDeadline) => void
  onAddPersonal: (newPersonal: PersonalCommitment) => void
  onBatchAddDeadlines: (deadlines: AcademicDeadline[]) => void
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddClass,
  onAddDeadline,
  onAddPersonal,
  onBatchAddDeadlines,
}) => {
  const [activeTab, setActiveTab] = useState<'nlp' | 'deadline' | 'class' | 'personal'>('nlp')

  // Natural Language Ingestion State (Empty by default)
  const [nlpText, setNlpText] = useState<string>('')

  // Manual Deadline State
  const [courseCode, setCourseCode] = useState('')
  const [deadlineTitle, setDeadlineTitle] = useState('')
  const [dueDay, setDueDay] = useState<DayOfWeek>('Fri')
  const [dueTime, setDueTime] = useState('23:59')
  const [estimatedHours, setEstimatedHours] = useState(3.0)
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high')

  // Manual Class State
  const [classCode, setClassCode] = useState('')
  const [className, setClassName] = useState('')
  const [classDay, setClassDay] = useState<DayOfWeek>('Mon')
  const [classStart, setClassStart] = useState('09:00')
  const [classEnd, setClassEnd] = useState('10:30')
  const [isLab, setIsLab] = useState(false)

  // Manual Personal State
  const [personalTitle, setPersonalTitle] = useState('')
  const [personalDay, setPersonalDay] = useState<DayOfWeek>('Tue')
  const [personalStart, setPersonalStart] = useState('18:00')
  const [personalEnd, setPersonalEnd] = useState('19:30')
  const [flexibility, setFlexibility] = useState<'immovable' | 'flexible' | 'skippable'>('flexible')

  const handleParseNlp = () => {
    if (!nlpText.trim()) return
    sound.playSuccessChime()
    const parsed = parseNaturalLanguageDeadlines(nlpText)
    const validDeadlines: AcademicDeadline[] = parsed.map((p, idx) => ({
      id: `dl-nlp-${Date.now()}-${idx}`,
      courseCode: p.courseCode || 'GEN',
      title: p.title || 'Assignment',
      dueDay: p.dueDay || 'Fri',
      dueTime: p.dueTime || '23:59',
      estimatedHours: p.estimatedHours || 3.0,
      completedHours: 0,
      priority: p.priority || 'high',
      energyRequirement: 'deep_work',
      weightPercentage: p.weightPercentage || 15,
    }))
    onBatchAddDeadlines(validDeadlines)
    setNlpText('')
    onClose()
  }

  const handleCreateDeadline = () => {
    if (!deadlineTitle.trim()) return
    sound.playComplete()
    onAddDeadline({
      id: `dl-${Date.now()}`,
      courseCode: courseCode.trim() || 'ACAD',
      title: deadlineTitle.trim(),
      dueDay,
      dueTime,
      estimatedHours,
      completedHours: 0,
      priority,
      energyRequirement: 'deep_work',
      weightPercentage: 15,
    })
    setDeadlineTitle('')
    onClose()
  }

  const handleCreateClass = () => {
    if (!classCode.trim()) return
    sound.playComplete()
    onAddClass({
      id: `cls-${Date.now()}`,
      courseCode: classCode.trim().toUpperCase(),
      courseName: className.trim() || classCode.trim(),
      dayOfWeek: classDay,
      startTime: classStart,
      endTime: classEnd,
      isLab,
      color: '#0ea5e9',
    })
    setClassCode('')
    setClassName('')
    onClose()
  }

  const handleCreatePersonal = () => {
    if (!personalTitle.trim()) return
    sound.playComplete()
    onAddPersonal({
      id: `per-${Date.now()}`,
      title: personalTitle.trim(),
      dayOfWeek: personalDay,
      startTime: personalStart,
      endTime: personalEnd,
      flexibility,
      category: 'health',
      color: '#64748b',
    })
    setPersonalTitle('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-2xl specular-card rounded-3xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#06080e]/95 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Ingest Schedule & Commitments
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/[0.08] bg-[#06080e]/60 px-4 pt-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('nlp')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'nlp'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Syllabus / Text Paste
            </button>
            <button
              onClick={() => setActiveTab('deadline')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'deadline'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              + Deadline
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'class'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              + Class
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'personal'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              + Personal
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* NLP Tab */}
            {activeTab === 'nlp' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-300">
                  Paste raw WhatsApp messages, syllabus tasks, or homework reminders. The parser extracts course codes, deadlines, and estimated hours, and auto-slices them into your week:
                </div>
                <textarea
                  rows={5}
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
                  placeholder={`Example format:\nCS 210 Lab Report 3 due Friday 11:59pm 4.5 hours\nMATH 240 Problem Set 5 due Wednesday 5:00pm 3 hours\nBiology Essay due Thursday 2pm 5 hours`}
                />
                <button
                  onClick={handleParseNlp}
                  disabled={!nlpText.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Auto-Slice Into Week</span>
                </button>
              </div>
            )}

            {/* Manual Deadline Tab */}
            {activeTab === 'deadline' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Course Code:
                    </label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      placeholder="e.g. CS 101"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Priority:
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Deliverable Title:
                  </label>
                  <input
                    type="text"
                    value={deadlineTitle}
                    onChange={(e) => setDeadlineTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    placeholder="e.g. Problem Set 2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Due Day:
                    </label>
                    <select
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value as DayOfWeek)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Due Time:
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Est. Hours:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateDeadline}
                  disabled={!deadlineTitle.trim()}
                  className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Create & Schedule Deliverable
                </button>
              </div>
            )}

            {/* Manual Class Tab */}
            {activeTab === 'class' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Course Code:
                    </label>
                    <input
                      type="text"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      placeholder="e.g. MATH 101"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Course Name:
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      placeholder="e.g. Calculus I"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Day:
                    </label>
                    <select
                      value={classDay}
                      onChange={(e) => setClassDay(e.target.value as DayOfWeek)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Start:
                    </label>
                    <input
                      type="time"
                      value={classStart}
                      onChange={(e) => setClassStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      End:
                    </label>
                    <input
                      type="time"
                      value={classEnd}
                      onChange={(e) => setClassEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lab-check"
                    checked={isLab}
                    onChange={(e) => setIsLab(e.target.checked)}
                    className="accent-sky-400"
                  />
                  <label htmlFor="lab-check" className="text-xs text-slate-300">
                    Is hands-on laboratory session
                  </label>
                </div>

                <button
                  onClick={handleCreateClass}
                  disabled={!classCode.trim()}
                  className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Add Fixed Class
                </button>
              </div>
            )}

            {/* Manual Personal Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Commitment Title:
                  </label>
                  <input
                    type="text"
                    value={personalTitle}
                    onChange={(e) => setPersonalTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    placeholder="e.g. Work Shift, Gym, Club"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Day:
                    </label>
                    <select
                      value={personalDay}
                      onChange={(e) => setPersonalDay(e.target.value as DayOfWeek)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Start:
                    </label>
                    <input
                      type="time"
                      value={personalStart}
                      onChange={(e) => setPersonalStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      End:
                    </label>
                    <input
                      type="time"
                      value={personalEnd}
                      onChange={(e) => setPersonalEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Flexibility:
                  </label>
                  <select
                    value={flexibility}
                    onChange={(e) => setFlexibility(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="immovable">Immovable (e.g. Work Shift)</option>
                    <option value="flexible">Flexible (Can shift an hour)</option>
                    <option value="skippable">Skippable (Can drop during crisis)</option>
                  </select>
                </div>

                <button
                  onClick={handleCreatePersonal}
                  disabled={!personalTitle.trim()}
                  className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Add Personal Commitment
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

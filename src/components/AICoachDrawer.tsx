import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Users,
  X,
  Send,
  Mail,
  ExternalLink,
  Cpu,
} from 'lucide-react'
import { sound } from '../utils/sound'
import { ragEngine } from '../utils/ai/ragEngine'
import { agentMemory } from '../utils/ai/memory'
import type { AcademicDeadline, StudentPreferences, DayOfWeek } from '../types'

interface AICoachDrawerProps {
  isOpen: boolean
  onClose: () => void
  deadlines: AcademicDeadline[]
  preferences: StudentPreferences
  onToggleDayOff: (day: DayOfWeek) => void
  onSetStudyLimit: (hours: number) => void
  onAddQuickDeadline: (title: string, dueDay: DayOfWeek, hours: number) => void
  onOpenStudio?: () => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const AICoachDrawer: React.FC<AICoachDrawerProps> = ({
  isOpen,
  onClose,
  deadlines,
  preferences,
  onToggleDayOff,
  onSetStudyLimit,
  onAddQuickDeadline,
  onOpenStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'coach' | 'inperson'>('coach')
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hi, I’m your RePlan Coach. Tell me what changed in your week or pick a tactical adjustment below. I only make honest changes that protect your bedtime.',
    },
  ])

  // In-Person Request state
  const [selectedPerson, setSelectedPerson] = useState<string>('Academic Advisor')
  const [advisorEmail, setAdvisorEmail] = useState(preferences.helpDeskEmail || '')
  const [preferredDay, setPreferredDay] = useState<DayOfWeek>('Wed')
  const [notes, setNotes] = useState('')
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null)

  const quickPrompts = [
    "I'm behind on everything",
    'Can I get an extension on CS101?',
    'Make Tuesday a day off',
    'Add a 4h project due Friday',
    'What is the Math201 drop policy?',
    'Increase study limit by 1h',
  ]

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text) return
    sound.playClick()

    const newMsgs: Message[] = [...messages, { role: 'user', content: text }]
    setInputMessage('')
    setMessages(newMsgs)

    // Record to Agent Memory
    agentMemory.write(`session-query-${Date.now()}`, text, 'working', ['chat', 'coach-query'], 2)

    // Smart Schedule-Aware Heuristic + RAG Grounding + Agent Memory Recall
    setTimeout(() => {
      sound.playComplete()
      let reply = ''
      const lower = text.toLowerCase()

      // Query RAG Knowledge Base
      const ragHit = ragEngine.queryKnowledgeBase(text)

      // Query Agent Memory for student habits/history
      const memHits = agentMemory.search(text)
      const relevantMemory = memHits.length > 0 && memHits[0].importance >= 3 ? memHits[0] : null

      if (lower.includes('behind') || lower.includes('overwhelmed')) {
        const totalHours = deadlines.reduce((a, d) => a + (d.estimatedHours - d.completedHours), 0)
        reply = `You have ${totalHours}h of pending deliverables across ${deadlines.length} tasks. Don't panic: your daily limit is ${preferences.maxDailyDeepWorkHours}h. If you increase it to ${preferences.maxDailyDeepWorkHours + 1}h or ask for an extension on your lowest priority paper, your whole week re-balances safely without losing sleep.`
      } else if (lower.includes('tuesday') && (lower.includes('off') || lower.includes('day off'))) {
        onToggleDayOff('Tue')
        reply = `Tuesday has been set as a Day Off. All study sessions have been shifted downstream to free slots later in the week. Bedtime remains guarded.`
      } else if (lower.includes('4h project') || (lower.includes('add') && lower.includes('friday'))) {
        onAddQuickDeadline('Surprise 4h Project', 'Fri', 4)
        reply = `Added "Surprise 4h Project" (4 hours, due Friday). I have partitioned it into deep work sprints before Friday 23:59 while respecting your sleep schedule.`
      } else if (lower.includes('limit') || lower.includes('increase study limit')) {
        onSetStudyLimit(preferences.maxDailyDeepWorkHours + 1)
        reply = `Daily study limit increased to ${preferences.maxDailyDeepWorkHours + 1}h. The planner has redistributed your workload with greater flexibility.`
      } else if (ragHit.confidence >= 0.25 && ragHit.citations.length > 0) {
        // Grounded directly in course syllabus via RAG
        reply = `${ragHit.groundedAnswer}\n\n📚 Grounded citation: ${ragHit.citations.join(', ')}`
      } else {
        reply = `I evaluated your schedule with ${preferences.maxDailyDeepWorkHours}h/day limit. All fixed lecture blocks and your ${preferences.targetSleepHours}h sleep target are protected. Use the Ripple Simulator to preview any upcoming shock.`
      }

      // Weave in relevant episodic / semantic memory if detected
      if (relevantMemory) {
        reply += `\n\n🧠 Note from past patterns: "${relevantMemory.content}"`
      }

      setMessages([...newMsgs, { role: 'assistant', content: reply }])
    }, 600)
  }

  const campusSupportRoles = [
    {
      title: 'Academic Advisor',
      desc: 'Request a formal extension, resolve class clashes, or balance course load.',
    },
    {
      title: 'Peer Mentor',
      desc: 'Senior student who survived this exact semester: study tactics and exam notes.',
    },
    {
      title: 'Wellbeing & Counselling',
      desc: 'Confidential campus support for when academic pressure exceeds planning.',
    },
    {
      title: 'Library & Learning Hub',
      desc: 'Quiet study carrels, writing center tutors, and group collaboration spaces.',
    },
  ]

  const handleGenerateMeetingEmail = (role: string) => {
    sound.playClick()
    const activeDeadlinesList = deadlines
      .map((d) => `- [${d.courseCode}] ${d.title}: ${d.estimatedHours - d.completedHours}h remaining, due ${d.dueDay}`)
      .join('\n')

    const draft = `Dear Campus Support Team / ${role},

I am writing to request a meeting to discuss my current course commitments and study schedule for this week.

Preferred Day: ${preferredDay}
Student Notes: ${notes || 'Seeking guidance on pacing and workload balance.'}

Current Academic Deliverables (from my RePlan AI schedule):
${activeDeadlinesList || 'Schedule currently tracked.'}

Thank you for your time and assistance.

Sincerely,
Student`

    setGeneratedDraft(draft)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="relative w-full max-w-md h-full bg-[#070b14] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#06080e]/95">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-display text-white">◉ RePlan Support</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                Adaptive
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenStudio && (
                <button
                  onClick={() => {
                    sound.playClick()
                    onOpenStudio()
                  }}
                  className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Agent Intelligence & RAG Studio"
                >
                  <Cpu className="w-3 h-3" />
                  <span>AI Studio</span>
                </button>
              )}
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
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-[#06080e] border-b border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => {
                sound.playClick()
                setActiveTab('coach')
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'coach'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Coach</span>
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setActiveTab('inperson')
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'inperson'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>In Person</span>
            </button>
          </div>

          {/* Tab 1: AI Coach */}
          {activeTab === 'coach' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[88%] ${
                      m.role === 'user'
                        ? 'ml-auto bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium shadow-md shadow-sky-950/40 rounded-br-none'
                        : 'mr-auto bg-[#0c111e] border border-white/[0.08] text-slate-200 shadow-md rounded-bl-none font-sans'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              {/* Quick Prompt Pills */}
              <div className="p-3 border-t border-white/[0.06] bg-[#06080e]/60">
                <div className="text-[10px] font-mono text-slate-400 mb-1.5">Quick Tactical Actions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 text-slate-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-white/[0.08] bg-[#06080e] flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tell me what changed..."
                  className="flex-1 bg-[#090d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: In Person Campus Support */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-slate-300 leading-relaxed font-sans">
                Real people help most on a high-stakes week. Choose a campus partner to generate an appointment email pre-loaded with your exact workload data.
              </div>

              {/* Meeting Config Inputs */}
              <div className="p-3 rounded-xl bg-[#080c16] border border-white/[0.08] space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Preferred Day:</label>
                    <select
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value as DayOfWeek)}
                      className="w-full bg-[#06080e] border border-white/10 rounded-lg p-2 text-xs text-white"
                    >
                      {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Email:</label>
                    <input
                      type="email"
                      value={advisorEmail}
                      onChange={(e) => setAdvisorEmail(e.target.value)}
                      placeholder="advisor@university.edu"
                      className="w-full bg-[#06080e] border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-xs font-mono">Personal Context / Need:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need extension on operating systems lab due to illness"
                    className="w-full bg-[#06080e] border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {campusSupportRoles.map((role, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#080c16] border border-white/[0.08] hover:border-white/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans text-white">{role.title}</span>
                      <button
                        onClick={() => {
                          setSelectedPerson(role.title)
                          handleGenerateMeetingEmail(role.title)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Draft Request</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{role.desc}</p>
                  </div>
                ))}
              </div>

              {/* Draft Viewer & Mailto launcher */}
              {generatedDraft && (
                <div className="p-3.5 rounded-xl bg-[#050810] border border-sky-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-sky-400">
                    <span className="font-bold uppercase">Pre-Crafted Request:</span>
                    <a
                      href={`mailto:${advisorEmail}?subject=${encodeURIComponent(
                        'Meeting Request: ' + selectedPerson
                      )}&body=${encodeURIComponent(generatedDraft)}`}
                      className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-bold text-[10px] flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Open in Mail</span>
                    </a>
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={generatedDraft}
                    className="w-full bg-[#080c16] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-300 resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Copy, Check, X, ExternalLink } from 'lucide-react'
import type { AcademicDeadline } from '../types'
import { sound } from '../utils/sound'

interface ExtensionEmailModalProps {
  isOpen: boolean
  onClose: () => void
  deadline: AcademicDeadline | null
}

export const ExtensionEmailModal: React.FC<ExtensionEmailModalProps> = ({
  isOpen,
  onClose,
  deadline,
}) => {
  const [copied, setCopied] = useState(false)
  const [reason, setReason] = useState<'workload' | 'illness' | 'technical'>('workload')

  if (!isOpen || !deadline) return null

  const getEmailContent = () => {
    let reasonText = ''
    if (reason === 'workload') {
      reasonText = `Due to an unforeseen clustering of midterm exam commitments and laboratory requirements this week, I am experiencing significant schedule compression.`
    } else if (reason === 'illness') {
      reasonText = `Unfortunately, I have come down with a sudden illness over the last 48 hours which has impaired my ability to sustain focused deep work.`
    } else {
      reasonText = `I ran into an unexpected technical blockage during the implementation phase that required extensive debugging.`
    }

    const subject = `Request for Extension - ${deadline.courseCode} ${deadline.title}`
    const body = `Dear Professor,

I hope you are having a productive week.

I am writing regarding the upcoming deadline for ${deadline.title} in ${deadline.courseCode}, currently due on ${deadline.dueDay} at ${deadline.dueTime}.

${reasonText}

I have already outlined the core structure and completed approximately ${Math.round((deadline.completedHours / deadline.estimatedHours) * 100)}% of the foundational requirements. To ensure I deliver work meeting the academic standards of this course, I would be deeply grateful if you would grant a 24-hour extension to submit by the following evening.

Thank you very much for your understanding and guidance.

Sincerely,
[Your Name]
Student ID: [Your ID]
${deadline.courseCode} Student`

    return { subject, body }
  }

  const { subject, body } = getEmailContent()

  const handleCopy = () => {
    sound.playComplete()
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="relative w-full max-w-xl specular-card rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  Tactical Professor Extension Drafter
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pre-crafted professional academic tone to protect grades without panic
                </p>
              </div>
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

          <div className="py-4 space-y-4">
            {/* Reason Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Context:</span>
              <button
                onClick={() => setReason('workload')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  reason === 'workload'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Workload Clustered
              </button>
              <button
                onClick={() => setReason('illness')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  reason === 'illness'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sudden Illness
              </button>
              <button
                onClick={() => setReason('technical')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  reason === 'technical'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Technical Roadblock
              </button>
            </div>

            {/* Email Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              <strong className="text-sky-300">Subject:</strong> {subject}
              {'\n\n'}
              {body}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <a
              href={mailtoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Email Client</span>
            </a>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Text'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

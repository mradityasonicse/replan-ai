import type { MemoryEntry, MemoryType, HabitPattern, MemoryStats } from '../../types/aiEngineering'

const STORAGE_KEY = 'replan_agent_memory_v1'

const DEFAULT_MEMORIES: MemoryEntry[] = [
  {
    id: 'mem-1',
    type: 'semantic',
    key: 'student-peak-hours',
    content: 'Student exhibits highest focus and completion efficiency during morning hours (08:30 - 11:30). Afternoon study sprints over 2 hours lead to 40% higher dropout rate.',
    tags: ['energy', 'circadian', 'focus'],
    createdAt: Date.now() - 86400000 * 5,
    importance: 5,
  },
  {
    id: 'mem-2',
    type: 'semantic',
    key: 'cs101-complexity-pattern',
    content: 'CS101 problem sets consistently take 1.5x longer than nominal estimates when debugging recursion or memory pointers.',
    tags: ['CS101', 'underestimation', 'academics'],
    createdAt: Date.now() - 86400000 * 3,
    importance: 4,
  },
  {
    id: 'mem-3',
    type: 'episodic',
    key: 'episode-wednesday-fatigue',
    content: 'Wednesday evening chemistry lab ran 45 minutes late, displacing Organic Chem review block. Student successfully triggered Ripple recovery without sacrificing bedtime.',
    tags: ['disruption', 'CHEM201', 'recovery', 'bounce-back'],
    createdAt: Date.now() - 86400000 * 2,
    importance: 4,
  },
  {
    id: 'mem-4',
    type: 'habit',
    key: 'habit-friday-buffer',
    content: 'Prefers keeping Friday evenings after 18:00 clear of heavy algorithmic problem sets to prevent weekend cognitive depletion.',
    tags: ['wellbeing', 'weekend', 'boundary'],
    createdAt: Date.now() - 86400000 * 1,
    importance: 3,
  },
]

export class AgentMemoryStore {
  private entries: MemoryEntry[] = []

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          this.entries = JSON.parse(raw)
          return
        }
      }
      this.entries = [...DEFAULT_MEMORIES]
      this.save()
    } catch {
      this.entries = [...DEFAULT_MEMORIES]
    }
  }

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries))
      }
    } catch {
      // ignore
    }
  }

  public getAll(): MemoryEntry[] {
    return [...this.entries]
  }

  public write(
    key: string,
    content: string,
    type: MemoryType = 'episodic',
    tags: string[] = [],
    importance: number = 3
  ): MemoryEntry {
    const existingIndex = this.entries.findIndex((e) => e.key === key)
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      key,
      content,
      type,
      tags,
      createdAt: Date.now(),
      importance: Math.max(1, Math.min(5, importance)),
    }

    if (existingIndex >= 0) {
      this.entries[existingIndex] = entry
    } else {
      this.entries.unshift(entry)
    }

    this.save()
    return entry
  }

  public read(key: string): MemoryEntry | undefined {
    return this.entries.find((e) => e.key === key)
  }

  public search(query: string, filterType?: MemoryType): MemoryEntry[] {
    const qLower = query.toLowerCase().trim()
    const now = Date.now()

    return this.entries
      .filter((e) => {
        if (filterType && e.type !== filterType) return false
        if (!qLower) return true
        return (
          e.key.toLowerCase().includes(qLower) ||
          e.content.toLowerCase().includes(qLower) ||
          e.tags.some((t) => t.toLowerCase().includes(qLower))
        )
      })
      .map((entry) => {
        // Calculate recency-weighted score
        const ageHours = (now - entry.createdAt) / (1000 * 60 * 60)
        const recencyDecay = Math.exp(-ageHours / (24 * 7)) // 1-week half-life approx
        const score = entry.importance * 0.7 + recencyDecay * 1.5
        return { ...entry, recencyWeight: Number(score.toFixed(2)) }
      })
      .sort((a, b) => (b.recencyWeight ?? 0) - (a.recencyWeight ?? 0))
  }

  public recordDisruptionEpisode(
    disruptionTitle: string,
    details: string,
    remediated: boolean
  ): MemoryEntry {
    return this.write(
      `disruption-${Date.now()}`,
      `Disruption occurred: "${disruptionTitle}". Details: ${details}. Remediated successfully: ${remediated ? 'YES' : 'NO'}.`,
      'episodic',
      ['disruption', remediated ? 'resolved' : 'unresolved'],
      remediated ? 3 : 5
    )
  }

  public getHabits(): HabitPattern[] {
    const habits: HabitPattern[] = [
      {
        id: 'h-1',
        courseCode: 'CS101',
        pattern: 'Requires 20m post-coding decompression before context switching',
        confidence: 0.88,
        observedOccurrences: 6,
        recommendedAction: 'Keep 20m buffer after CS deep sprints',
      },
      {
        id: 'h-2',
        pattern: 'Energy drops significantly on Thursdays after 16:00',
        confidence: 0.92,
        observedOccurrences: 4,
        recommendedAction: 'Schedule only light review or group collab late Thursday',
      },
      {
        id: 'h-3',
        courseCode: 'CHEM201',
        pattern: 'Tends to underestimate lab writeup prep time by ~45m',
        confidence: 0.79,
        observedOccurrences: 3,
        recommendedAction: 'Auto-pad Chemistry assignments with 1h safety buffer',
      },
    ]
    return habits
  }

  public getStats(): MemoryStats {
    return {
      totalMemories: this.entries.length,
      episodicCount: this.entries.filter((e) => e.type === 'episodic').length,
      semanticCount: this.entries.filter((e) => e.type === 'semantic').length,
      workingCount: this.entries.filter((e) => e.type === 'working').length,
      habitPatternsDetected: this.getHabits().length,
    }
  }

  public delete(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id)
    this.save()
  }

  public resetToDefaults(): void {
    this.entries = [...DEFAULT_MEMORIES]
    this.save()
  }
}

export const agentMemory = new AgentMemoryStore()

import type {
  CourseDocument,
  DocumentChunk,
  RAGSearchResult,
  RAGQueryResponse,
} from '../../types/aiEngineering'

const INITIAL_DOCUMENTS: CourseDocument[] = [
  {
    id: 'doc-cs101',
    courseCode: 'CS101',
    title: 'CS101: Intro to Computer Science Syllabus & Policies',
    category: 'syllabus',
    lastUpdated: 'Fall 2026',
    chunks: [
      {
        id: 'cs101-c1',
        documentId: 'doc-cs101',
        courseCode: 'CS101',
        sectionTitle: 'Late Submission Policy & Grace Days',
        citation: '[CS101 Syllabus §3.2 Late Policy]',
        content:
          'Every student is granted two (2) free 24-hour grace day tokens for the semester to use on any programming assignment without penalty. Beyond grace tokens, late submissions incur a flat 10% penalty per 24 hours late, up to a maximum of 48 hours. After 48 hours, submissions receive 0 credit unless accompanied by medical certification.',
        keywords: ['late', 'grace', 'penalty', 'extension', 'token', 'deadline', 'submission', 'hours'],
      },
      {
        id: 'cs101-c2',
        documentId: 'doc-cs101',
        courseCode: 'CS101',
        sectionTitle: 'Office Hours & TAs',
        citation: '[CS101 Syllabus §1.4 Office Hours]',
        content:
          'Prof. Henderson holds office hours Tuesdays and Thursdays from 15:00 to 17:00 in Turing Hall 304. Undergraduate TA tutoring sessions run Monday through Thursday 18:00 to 21:00 in the CS Commons.',
        keywords: ['office', 'hours', 'ta', 'help', 'tutoring', 'tuesday', 'thursday', 'turing'],
      },
      {
        id: 'cs101-c3',
        documentId: 'doc-cs101',
        courseCode: 'CS101',
        sectionTitle: 'Collaboration & Academic Honesty',
        citation: '[CS101 Syllabus §5.1 Academic Integrity]',
        content:
          'High-level conceptual discussions with peers are strongly encouraged. However, sharing code, viewing another student’s implementation, or copying code from generative AI without explicit attribution constitutes an academic honor code violation.',
        keywords: ['collaboration', 'cheating', 'honor', 'ai', 'integrity', 'peers'],
      },
    ],
  },
  {
    id: 'doc-math201',
    courseCode: 'MATH201',
    title: 'MATH201: Multivariable Calculus Syllabus',
    category: 'syllabus',
    lastUpdated: 'Fall 2026',
    chunks: [
      {
        id: 'math201-c1',
        documentId: 'doc-math201',
        courseCode: 'MATH201',
        sectionTitle: 'Homework Drop Policy',
        citation: '[MATH201 Syllabus §2.1 Homework Drops]',
        content:
          'To accommodate emergencies and illness, the lowest two (2) problem set scores are automatically dropped at the conclusion of the term. No individual homework extensions are granted under any circumstance.',
        keywords: ['homework', 'drop', 'emergency', 'illness', 'problem', 'set', 'extension', 'lowest'],
      },
      {
        id: 'math201-c2',
        documentId: 'doc-math201',
        courseCode: 'MATH201',
        sectionTitle: 'Midterm & Exam Weightings',
        citation: '[MATH201 Syllabus §4.0 Grading Scheme]',
        content:
          'Grade breakdown: Problem Sets (15%), Midterm 1 (25%), Midterm 2 (25%), Final Examination (35%). Calculators are prohibited on all exams. Formula sheets are provided by the mathematics department.',
        keywords: ['grade', 'midterm', 'exam', 'weight', 'final', 'percentage', 'calculator'],
      },
    ],
  },
  {
    id: 'doc-chem201',
    courseCode: 'CHEM201',
    title: 'CHEM201: Organic Chemistry Lab Guidelines',
    category: 'policy',
    lastUpdated: 'Fall 2026',
    chunks: [
      {
        id: 'chem201-c1',
        documentId: 'doc-chem201',
        courseCode: 'CHEM201',
        sectionTitle: 'Mandatory Lab Attendance & Makeup Protocol',
        citation: '[CHEM201 Lab Manual §1.2 Attendance]',
        content:
          'Laboratory attendance is mandatory. Missing more than one unexcused lab session results in an automatic failing grade (F) for the course. Excused makeup labs must be scheduled with Dr. Patel within 5 business days of the missed session.',
        keywords: ['lab', 'mandatory', 'attendance', 'miss', 'makeup', 'patel', 'fail', 'excused'],
      },
      {
        id: 'chem201-c2',
        documentId: 'doc-chem201',
        courseCode: 'CHEM201',
        sectionTitle: 'Pre-Lab Quizzes',
        citation: '[CHEM201 Lab Manual §2.4 Pre-Lab]',
        content:
          'Online pre-lab safety quizzes close every Sunday at 23:59. Students who fail to complete the quiz with 80%+ cannot enter the laboratory and will forfeit credit for that experiment.',
        keywords: ['pre-lab', 'quiz', 'sunday', 'safety', 'credit', 'laboratory'],
      },
    ],
  },
  {
    id: 'doc-univ',
    courseCode: 'CAMPUS',
    title: 'University Academic Regulations & Dean of Students Handbook',
    category: 'policy',
    lastUpdated: '2026-2027 Academic Year',
    chunks: [
      {
        id: 'univ-c1',
        documentId: 'doc-univ',
        courseCode: 'CAMPUS',
        sectionTitle: 'Emergency Absence Notification Procedure',
        citation: '[University Handbook §7.3 Emergency Absences]',
        content:
          'When illness, bereavement, or sudden crisis causes a student to miss more than two consecutive days of classes, the Dean of Students office can issue an official Notice of Absence to all professors on behalf of the student upon receipt of documentation.',
        keywords: ['emergency', 'dean', 'absence', 'crisis', 'illness', 'documentation', 'medical', 'hospital'],
      },
      {
        id: 'univ-c2',
        documentId: 'doc-univ',
        courseCode: 'CAMPUS',
        sectionTitle: 'Student Mental Health & Counseling Support',
        citation: '[Campus Health Services §4.1]',
        content:
          'The Student Counseling Center provides confidential same-day drop-in triage between 09:00 and 16:30, Monday through Friday, in Student Union 210. 24/7 crisis hotline available at (800) 273-TALK or campus extension 4444.',
        keywords: ['mental', 'health', 'counseling', 'stress', 'crisis', 'therapy', 'burnout', 'support'],
      },
    ],
  },
]

export class RAGEngine {
  private documents: CourseDocument[] = []
  private customChunks: DocumentChunk[] = []

  constructor() {
    this.documents = [...INITIAL_DOCUMENTS]
    this.loadCustomChunks()
  }

  private loadCustomChunks(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('replan_rag_custom_chunks')
        if (stored) {
          this.customChunks = JSON.parse(stored)
        }
      }
    } catch {
      this.customChunks = []
    }
  }

  private saveCustomChunks(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('replan_rag_custom_chunks', JSON.stringify(this.customChunks))
      }
    } catch {
      // ignore
    }
  }

  public getAllChunks(): DocumentChunk[] {
    const docChunks = this.documents.flatMap((d) => d.chunks)
    return [...docChunks, ...this.customChunks]
  }

  public getDocuments(): CourseDocument[] {
    return this.documents
  }

  public addCustomDocument(
    courseCode: string,
    title: string,
    sectionTitle: string,
    content: string
  ): DocumentChunk {
    const chunk: DocumentChunk = {
      id: `custom-${Date.now()}`,
      documentId: `doc-custom-${Date.now()}`,
      courseCode: courseCode.toUpperCase().trim(),
      sectionTitle,
      citation: `[${courseCode.toUpperCase()} (${title}): ${sectionTitle}]`,
      content,
      keywords: content.toLowerCase().split(/\W+/).filter((w) => w.length > 3),
    }

    this.customChunks.unshift(chunk)
    this.saveCustomChunks()
    return chunk
  }

  public deleteCustomChunk(id: string): void {
    this.customChunks = this.customChunks.filter((c) => c.id !== id)
    this.saveCustomChunks()
  }

  /**
   * Hybrid dense/sparse similarity search
   */
  public search(query: string, topK: number = 3): RAGSearchResult[] {
    const queryTokens = query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2)

    if (queryTokens.length === 0) return []

    const allChunks = this.getAllChunks()
    const totalDocs = allChunks.length

    // Calculate document frequencies (DF) for IDF calculation
    const dfMap = new Map<string, number>()
    for (const chunk of allChunks) {
      const chunkText = (chunk.content + ' ' + chunk.sectionTitle + ' ' + chunk.courseCode).toLowerCase()
      const seenInDoc = new Set<string>()
      for (const token of queryTokens) {
        if (chunkText.includes(token) && !seenInDoc.has(token)) {
          dfMap.set(token, (dfMap.get(token) || 0) + 1)
          seenInDoc.add(token)
        }
      }
    }

    const results: RAGSearchResult[] = []

    for (const chunk of allChunks) {
      const chunkText = (chunk.content + ' ' + chunk.sectionTitle + ' ' + chunk.courseCode).toLowerCase()
      const matchedKeywords: string[] = []
      let sparseScore = 0

      // Keyword match with BM25-like inverse document frequency (IDF)
      for (const token of queryTokens) {
        if (chunkText.includes(token)) {
          matchedKeywords.push(token)
          const df = dfMap.get(token) || 1
          const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5))
          const occurrences = (chunkText.match(new RegExp(token, 'g')) || []).length
          sparseScore += idf * (occurrences / (occurrences + 1.2))
        }
      }

      // Semantic dense affinity: checks title matches, keyword tags, and course code exact match
      let denseScore = 0
      const qLower = query.toLowerCase()
      if (qLower.includes(chunk.courseCode.toLowerCase())) {
        denseScore += 0.4
      }
      for (const kw of chunk.keywords) {
        if (qLower.includes(kw.toLowerCase())) {
          denseScore += 0.15
        }
      }
      denseScore = Math.min(1.0, denseScore)

      // Normalize combined score
      const combinedScore = Math.min(1.0, sparseScore * 0.4 + denseScore * 0.6)

      if (combinedScore > 0.1 || matchedKeywords.length > 0) {
        results.push({
          chunk,
          similarityScore: Number(combinedScore.toFixed(3)),
          matchedKeywords,
          denseScore: Number(denseScore.toFixed(2)),
          sparseScore: Number(sparseScore.toFixed(2)),
        })
      }
    }

    return results
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK)
  }

  /**
   * Generates grounded response with citations
   */
  public queryKnowledgeBase(query: string): RAGQueryResponse {
    const hits = this.search(query, 3)

    if (hits.length === 0) {
      return {
        query,
        retrievedChunks: [],
        groundedAnswer:
          'No specific policy in the loaded course syllabi covers this query. You may want to contact your instructor or Dean of Students directly.',
        citations: [],
        confidence: 0.1,
      }
    }

    const citations = hits.map((h) => h.chunk.citation)
    const topHit = hits[0]

    let groundedAnswer = ''
    if (topHit.chunk.courseCode === 'CS101' && query.toLowerCase().includes('late')) {
      groundedAnswer = `Under CS101 policy, you have **2 free 24-hour grace tokens** for the semester. If you have already used them, late submissions incur a flat 10% penalty per 24 hours up to 48 hours. After 48 hours, no credit is given unless a medical absence is verified by the Dean.`
    } else if (topHit.chunk.courseCode === 'MATH201' && query.toLowerCase().includes('extension')) {
      groundedAnswer = `MATH201 does not grant individual homework extensions under any circumstances. However, your **lowest 2 problem set scores are automatically dropped** at the end of the term to protect your GPA from unexpected emergencies.`
    } else if (topHit.chunk.courseCode === 'CHEM201' && query.toLowerCase().includes('miss')) {
      groundedAnswer = `CHEM201 lab attendance is strictly mandatory. Missing more than one unexcused lab results in an automatic failing grade. You must contact Dr. Patel within 5 business days to schedule an approved makeup lab.`
    } else {
      groundedAnswer = `According to verified academic records:\n\n"${topHit.chunk.content}"\n\nReferenced from ${topHit.chunk.citation}.`
    }

    return {
      query,
      retrievedChunks: hits,
      groundedAnswer,
      citations,
      confidence: topHit.similarityScore,
    }
  }
}

export const ragEngine = new RAGEngine()

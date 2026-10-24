import { describe, it, expect } from 'vitest'
import { parseNaturalLanguageDeadlines } from '../utils/parser'

describe('Natural Language Syllabus Parser', () => {
  it('correctly parses raw lines of text into structured deliverables', () => {
    const rawInput = `
CS 210 Lab Report 3 due Friday 11:59pm 4.5 hours
MATH 240 Problem Set 5 due Wednesday 5:00pm 3 hours
CHEM 102 Midterm Exam due Thursday 2pm 6 hours
    `

    const parsed = parseNaturalLanguageDeadlines(rawInput)

    expect(parsed.length).toBe(3)

    // First item
    expect(parsed[0].courseCode).toBe('CS 210')
    expect(parsed[0].dueDay).toBe('Fri')
    expect(parsed[0].dueTime).toBe('23:59')
    expect(parsed[0].estimatedHours).toBe(4.5)

    // Second item
    expect(parsed[1].courseCode).toBe('MATH 240')
    expect(parsed[1].dueDay).toBe('Wed')
    expect(parsed[1].dueTime).toBe('17:00')
    expect(parsed[1].estimatedHours).toBe(3)

    // Third item
    expect(parsed[2].courseCode).toBe('CHEM 102')
    expect(parsed[2].dueDay).toBe('Thu')
    expect(parsed[2].dueTime).toBe('14:00')
    expect(parsed[2].estimatedHours).toBe(6)
  })
})

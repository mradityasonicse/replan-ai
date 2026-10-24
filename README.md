# ChronoFlow: Resilient Academic Week & Recovery Planner

> **Problem 1 Solution**: *"Build a tool that helps students turn an overwhelming week of classes, deadlines, and commitments into a realistic plan they can recover when things change."*

---

## 🎯 The Core Problem & Innovation

Most student planners (Google Calendar, Notion, Todoist) are **static**. When a student plans 4 hours of studying on Tuesday night, but their afternoon lab runs late or they burn out, the plan shatters. Manually dragging 15 blocks is demoralizing, triggering a **guilt spiral and total abandonment of the schedule**.

**ChronoFlow** solves this through **Capacity-Aware Slicing** and an **Autonomous Cascading Recovery Engine**:
1. **Realistic Cognitive Slicing**: Large 6-hour assignments are never dumped as one overwhelming block. ChronoFlow automatically slices deliverables into 45–90 minute Pomodoro-style sprints placed in peak cognitive energy windows before the deadline.
2. **Sanity Guardrails**: Enforces non-negotiable sleep windows (e.g., 8 hours guarded), meal breaks, and transition buffers between classes.
3. **The "Life Happened" 1-Click Recovery Engine**: When a student oversleeps, an assignment takes longer, or unexpected illness hits, ChronoFlow recalculates the rest of the week in milliseconds. It cascades displaced sessions into optimal open slots, protects critical deadlines, transparently explains trade-offs in plain English, and keeps the student calm.

---

## 🚀 Key Features

### 1. The Recovery Center & Disruption Simulator
- **Preset Crisis Triggers**:
  - ⏰ *"I overslept 2.5 hours today"*
  - 🔬 *"Lab session overran by 2 hours"*
  - 💥 *"Assignment is taking twice as long (+3 hours needed)"*
  - 🛌 *"Burnout / Exhaustion: Drop tonight's work and reset"*
- **Custom Disruption Slider**: Choose any day, start time, and lost hours (0.5h to 6.0h).
- **Interactive Visual Diff & Trade-Off Explainer**:
  - Explains exactly where displaced blocks were relocated.
  - Highlights sacrificed optional activities vs preserved deadlines.
  - Confidence meter (e.g. `95% Viable`).
  - Emergency Triage suggestions if capacity is mathematically exceeded.

### 2. Cognitive Capacity & Sanity Radar
- **Live 7-Day Capacity Telemetry**: Displays scheduled focus hours vs total waking hours.
- **Deficit Detection**: Flags days in deficit before the student crashes.
- **Sleep Protection Metric**: 100% guarded sleep schedules with bedtime anchors.

### 3. Natural Language Syllabus & Text Ingestion
- Paste raw WhatsApp assignment messages, professor emails, or syllabus snippets (e.g. `CS 210 Lab 3 due Friday 11:59pm 4.5 hours`).
- Automatically extracts course codes, due times, estimated effort, and slices them into the calendar.

### 4. Interactive Adaptive Weekly Canvas
- 7-day chronological view (Mon–Sun).
- Color-coded fixed lectures, auto-placed deep work sprints, and personal commitments.
- Real-time Web Audio API micro-haptics & chimes on block completion and plan recovery.
- One-click block bumping / disruption.

### 5. Calendar & Workspace Export
- **Standard RFC 5545 iCalendar (`.ics`)**: Imports directly into Google Calendar, Apple Calendar, and Microsoft Outlook.
- **Markdown Export**: Formatted checklists ready for Notion or Obsidian.

---

## 🛠️ Architecture & Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Custom Atmospheric Specular Edge Styling
- **Animations**: Framer Motion (spring physics)
- **Audio Feedback**: Native Web Audio API Synthesizer (zero external audio asset dependencies)
- **Test Suite**: Vitest (100% passing across scheduler, recovery solver, capacity metrics, parser, and iCal generator)

---

## 🧪 Verification & Test Harness

Run the automated test harness:
```bash
bun x vitest run
```

Output:
```
✓ src/tests/parser.test.ts (1 test)
✓ src/tests/scheduler.test.ts (3 tests)
✓ src/tests/ical.test.ts (1 test)
✓ src/tests/recovery.test.ts (2 tests)
✓ src/tests/capacity.test.ts (2 tests)

Test Files: 5 passed (5)
Tests: 9 passed (9)
```

Run the production build:
```bash
bun run build
```

Run dev server:
```bash
bun run dev
```

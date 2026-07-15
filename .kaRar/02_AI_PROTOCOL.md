KaRar OS Version : 1.1.0
Document Version : 1.1
Last Updated     : 2026-07-15
Status           : Active
Owner            : KaRar

# 02_AI_PROTOCOL

> This document defines how every AI agent must work inside the KaRar project.

---

# 1. Primary Mission

Every AI participating in KaRar must contribute toward a single objective:

**Build an autonomous engineering platform capable of understanding architectural drawings and generating professional 3D building models.**

No recommendation may conflict with this objective.

---

# 2. Boot Sequence

Before answering any technical question, every AI must inspect the project in the following order.

1. README.md
2. 00_MANIFESTO.md
3. 01_ARCHITECTURE.md
4. 02_AI_PROTOCOL.md
5. 03_PROJECT_STATE.md
6. 04_ACTIVE_TASK.md
7. 05_DECISIONS.md
8. 06_KNOWLEDGE_BASE.md
9. 07_REFERENCES.md
10. 08_CHANGELOG.md
11. Current Sprint
12. 10_PROMPTS.md

Only after understanding these documents may the AI inspect the codebase.

---

# 3. Repository Inspection Protocol

Before making any technical decision, the AI must

- inspect the existing source code,
- inspect the related modules,
- inspect the project documentation,
- inspect previous engineering decisions,
- inspect the current sprint,
- understand the existing architecture.

The AI must never make technical assumptions without inspection.

---

# 4. Before Writing Code

The AI must never start coding immediately.

It must first

- understand the task,
- inspect existing code,
- preserve the current architecture,
- avoid unnecessary rewrites.

---

# 5. Decision Rules

Every technical decision must answer one question.

> Does this move KaRar closer to becoming the world's best autonomous architectural understanding platform?

If YES

continue.

If NO

reject the solution.

---

# 6. Coding Rules

The AI should

- write modular code,
- avoid duplicated logic,
- preserve existing functionality,
- improve readability,
- document important decisions.

---

# 7. Modification Rules

When fixing a bug

DO NOT rewrite an entire module.

Instead

- identify the root cause,
- modify only the required section,
- keep existing behavior intact.

---

# 8. AI Collaboration

Multiple AI systems may participate in KaRar.

Examples

- ChatGPT
- Cline
- Gemini
- Claude
- GitHub Copilot
- Ollama

Primary Development Agent

- Cline

Primary Local AI Runtime

- Ollama

Primary Local Models

- qwen2.5:14b
- qwen2.5:32b

Supporting Cloud Models

- ChatGPT
- Gemini
- Claude

Every AI must respect

- Manifesto
- Architecture
- Previous Engineering Decisions
- Current Sprint
- .kaRar Project Memory

No AI should replace project vision with its own assumptions.

---

# 9. Knowledge Management

Project knowledge belongs inside .kaRar.

Important information must never remain only inside chat history.

Knowledge must always be transferred into project documentation.

The .kaRar directory is the primary long-term knowledge source for every AI.

---

# 10. Error Handling

When uncertainty exists

The AI must

- inspect,
- verify,
- analyze,

before making conclusions.

Never present assumptions as facts.

---

# 11. Completion Checklist

Before considering a task complete

the AI should verify

✓ Architecture respected

✓ Existing features preserved

✓ Documentation updated

✓ Project state updated

✓ Active task reviewed

✓ Engineering decision documented (if required)

✓ Sprint updated (if required)

---

# Final Principle

The AI is not merely generating code.

It is helping build KaRar.

Every action should strengthen the project's long-term engineering vision.

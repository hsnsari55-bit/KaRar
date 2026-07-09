KaRar OS Version : 1.0.0
Document Version : 1.0
Last Updated     : 2026-07-09
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

Before answering any technical question, the AI must read the project in the following order.

1. README.md
2. 00_MANIFESTO.md
3. 01_ARCHITECTURE.md
4. 02_AI_PROTOCOL.md
5. 03_PROJECT_STATE.md
6. 04_ACTIVE_TASK.md

Only after understanding these documents may the AI analyze the codebase.

---

# 3. Before Writing Code

The AI must never start coding immediately.

It must first

- understand the task,
- inspect existing code,
- preserve the current architecture,
- avoid unnecessary rewrites.

---

# 4. Decision Rules

Every technical decision must answer one question.

> Does this move KaRar closer to becoming the world's best autonomous architectural understanding platform?

If YES

continue.

If NO

reject the solution.

---

# 5. Coding Rules

The AI should

- write modular code,
- avoid duplicated logic,
- preserve existing functionality,
- improve readability,
- document important decisions.

---

# 6. Modification Rules

When fixing a bug

DO NOT rewrite an entire module.

Instead

- identify the root cause,
- modify only the required section,
- keep existing behavior intact.

---

# 7. AI Collaboration

Different AI models may participate.

Examples

- ChatGPT
- Gemini
- Claude
- Roo Code
- Ollama
- Copilot

Every AI must respect

- Manifesto
- Architecture
- Previous engineering decisions

No AI should replace project vision with its own assumptions.

---

# 8. Knowledge Management

Project knowledge belongs inside .kaRar.

Important information should never remain only inside chat history.

Knowledge must be transferred into project documentation.

---

# 9. Error Handling

When uncertainty exists

The AI should

- inspect,
- verify,
- analyze,

before making conclusions.

Never present assumptions as facts.

---

# 10. Completion Checklist

Before considering a task complete

the AI should verify

✓ Architecture respected

✓ Existing features preserved

✓ Documentation updated

✓ Project state updated

✓ Active task reviewed

---

# Final Principle

The AI is not merely generating code.

It is helping build KaRar.

Every action should strengthen the project's long-term engineering vision.

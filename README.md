# Project NEEV — Trainee Supervisor Program

**नींव — the foundation you build everything else on**

Neoteric Group's structured induction programme for Trainee Supervisors.
Batch 2026-01 · 12 trainees · joined 1 September 2026.

This repository holds the programme design, the source that generates the handbook and
the tracker, and the specification for the app being built to replace the spreadsheet.

---

## The programme in one table

| Stage | When | What |
|---|---|---|
| Phase 1 — Training | Months 1–4 · Sep–Dec 2026 | Classroom and site |
| Gateway Assessment | Month 5 · Jan 2027 | Theory + practical. Pass to continue; fail and the programme ends. |
| Phase 2 — Deployment | Months 5–9 · Jan–May 2027 | Allotted to one of four departments |
| Confirmation | 31 May 2027 | Confirmation letter, designation, revised terms |

**Four departments:** Supervision (Work) · Quality · Measurement · Store
**Terms:** ₹20,000 CTC/month · 09:00–18:00 · 4 offs per month
**Base site:** Zen Garden, Gwalior

## Who owns what

| Person | Role | Owns |
|---|---|---|
| **Deepti** | Training Supervisor | **Owns the programme.** Assessments, bands, trainer scheduling, department allotment, escalation, Saturday review with the CEO. |
| **Rajat** | Training Coordinator | **Runs it daily.** Morning brief, site-buddy coordination, 17:30 log review and signature, drill collection, attendance. |
| **Bharti** | Office Coordinator | Documents, training files, handbook issue, payroll data, HR interface. |
| Site buddies | ×4 | One per pod of three. Day-to-day supervision and the weekly rating. |

Reporting chain: Trainee → Site Buddy → Rajat (daily, 17:30) → Deepti (weekly) → Sponsor → CEO (monthly).

**The rule the app enforces: Rajat records, Deepti decides.** Rajat cannot set a band or
approve a department allotment.

## Rotation

Four pods of three, rotating through all four departments.

**Month 1 — taster.** Four blocks of 3–4 days each, September 14–29. Every pod sees every
department. Nobody becomes good at anything in four days; the point is that all four
department heads have watched all twelve people before anyone is allotted anywhere.

**Months 2–4 — immersion.** Same grid, a whole month per block, real scope with a real
consequence. Three departments deep, then a catch-up week in the fourth so nobody reaches
the Gateway with a blank space.

| Period | Pod 1 | Pod 2 | Pod 3 | Pod 4 |
|---|---|---|---|---|
| Month 2 · Oct | Supervision | Quality | Measurement | Store |
| Month 3 · Nov | Quality | Measurement | Store | Supervision |
| Month 4 · Dec | Measurement | Store | Supervision | Quality |
| Catch-up week | Store | Supervision | Quality | Measurement |

Every department hosts exactly one pod at a time — that is what makes it affordable in
senior supervision time.

## Assessment

Weighted score out of 100:

| Component | Weight |
|---|---|
| Daily log quality | 15% |
| Site buddy weekly rating | 15% |
| Weekly module tests | 15% |
| D11 checkpoint | 25% |
| Department drills | 15% |
| Capstone | 15% |

The D01 baseline is **not ranked**. It exists so that learning speed can be measured:

```
velocity = (score − baseline) ÷ (100 − baseline) × 100
```

A trainee who moves 30 → 70 captured 57% of the improvement available to them. One who
moves 65 → 75 captured 29%. The second has better marks and worse velocity. The batch
joined from different branches and different colleges, so raw marks would tell you mostly
about their school, not about them.

**Bands:** A (≥75 and velocity ≥55) · B (≥60) · C (≥45) · D (<45).

Band D is **not an exit** — the Gateway in Month 5 is the only exit point. But a band-D
trainee first told in January has been failed by the programme, not the other way round.

---

## What is in this repository

```
docs/
  programme-plan.html      The full programme plan — calendar, rotation, governance,
                           assessment design, and the offer-letter review.
  app-prototype.html       Clickable UI prototype of the tracker app, plus the build spec.
                           Open either file directly in a browser.

handbook/
  modules.js               Content for the 22 technical modules. Edit here.
  build.js                 Generates the handbook .docx from modules.js.

tracker/
  build_tracker.py         Generates the 11-sheet programme tracker .xlsx.

offer-letter/
  NEEV_Offer_Letter_...docx   The issued offer letter (headcount corrected to 12).
  review.md                   Nine clauses flagged for a decision, with reasoning.

app/
  SPEC.md                  Build specification for the tracker app — data model, API,
                           permissions, YouTube integration, offline behaviour, phasing.

dist/
  NEEV_Trainee_Supervisor_Handbook.docx    58 pages, 22 modules. Print 12 copies.
  NEEV_Programme_Tracker.xlsx              Until the app replaces it.
```

Built artefacts are committed to `dist/` on purpose — most people who need them do not
run builds.

## Rebuilding

**Handbook** (needs Node and the `docx` package):

```bash
cd handbook
npm install docx
node build.js          # writes ../dist/NEEV_Trainee_Supervisor_Handbook.docx
```

To change handbook content, edit `handbook/modules.js` — each module has the same six
sections: why it matters, what you must know, what you must be able to do, a field drill,
common site mistakes, and self-check questions. The self-check questions are the question
bank the assessments are drawn from, so changing them changes the tests.

**Tracker** (needs Python and `openpyxl`):

```bash
cd tracker
pip install openpyxl
python build_tracker.py    # writes ../dist/NEEV_Programme_Tracker.xlsx
```

## For the developer building the app

Start with **`app/SPEC.md`** and open **`docs/app-prototype.html`** in a browser next to
it. The prototype is the reference for behaviour; the spec is the reference for structure.
The role switcher in the prototype's top right shows what each person can and cannot do.

Ship order matters more than completeness here — the batch is already running, and a tool
that lands in December is a tool for Batch 02. v1 is the staff screens that replace the
spreadsheet.

## A note on the codes and values in the handbook

Indian Standard clauses quoted in the modules are given for orientation. The current
edition of the code and the project specification always govern. Anyone editing
`modules.js` should keep that framing rather than presenting a quoted figure as final.

---

Internal to Neoteric Group. Contains employee-programme material — keep this repository private.

const fs = require("fs");
const d = require("docx");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, TableOfContents,
  Header, Footer, PageNumber, LevelFormat, convertInchesToTwip,
} = d;

const MODULES = require("./modules.js");

const NAVY = "12355B";
const ACCENT = "B3641C";
const GREY = "5A5A5A";
const LIGHT = "EEF2F6";
const BAND = "DDE5EC";

// ---------- helpers ----------
const P = (text, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 60, after: o.after ?? 120, line: o.line ?? 276 },
  alignment: o.align,
  indent: o.indent,
  border: o.border,
  keepNext: o.keepNext,
  children: [new TextRun({ text, size: o.size ?? 21, color: o.color ?? "222222", bold: o.bold, italics: o.italics, font: "Calibri" })],
});

const RUNS = (runs, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 60, after: o.after ?? 120, line: 276 },
  alignment: o.align,
  indent: o.indent,
  children: runs.map(r => new TextRun({ ...r, size: r.size ?? 21, font: "Calibri" })),
});

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
  spacing: { before: 0, after: 220 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
  children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font: "Calibri" })],
});

const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, keepNext: true,
  spacing: { before: 260, after: 110 },
  children: [new TextRun({ text, bold: true, size: 25, color: NAVY, font: "Calibri" })],
});

const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3, keepNext: true,
  spacing: { before: 190, after: 80 },
  children: [new TextRun({ text, bold: true, size: 21.5, color: ACCENT, font: "Calibri" })],
});

const BULLET = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { before: 30, after: 70, line: 268 },
  children: [new TextRun({ text, size: 21, font: "Calibri" })],
});

let NUM_INSTANCE = 0;
const nextList = () => ++NUM_INSTANCE;
const NUM = (text, instance = 0) => new Paragraph({
  numbering: { reference: "numbers", level: 0, instance },
  spacing: { before: 30, after: 70, line: 268 },
  children: [new TextRun({ text, size: 21, font: "Calibri" })],
});

const RULE = () => new Paragraph({
  spacing: { before: 100, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9D3DC", space: 2 } },
  children: [new TextRun({ text: "", size: 2 })],
});

// callout box (single-cell table)
const CALLOUT = (title, lines, fill = LIGHT, barColor = ACCENT) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: {
    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    left: { style: BorderStyle.SINGLE, size: 18, color: barColor },
  },
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      children: [
        ...(title ? [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, size: 21, color: NAVY, font: "Calibri" })] })] : []),
        ...lines.map(l => new Paragraph({ spacing: { after: 60, line: 268 }, children: [new TextRun({ text: l, size: 20.5, font: "Calibri" })] })),
      ],
    })],
  })],
});

const cell = (text, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
  margins: { top: 70, bottom: 70, left: 110, right: 110 },
  verticalAlign: d.VerticalAlign.CENTER,
  children: (Array.isArray(text) ? text : [text]).map(t => new Paragraph({
    spacing: { before: 20, after: 20, line: 260 },
    alignment: o.align,
    children: [new TextRun({ text: t, size: o.size ?? 19.5, bold: o.bold, color: o.color ?? "222222", font: "Calibri" })],
  })),
});

const TABLE = (widths, headers, rows, opts = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: "B7C4CF" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "B7C4CF" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "B7C4CF" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "B7C4CF" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D4DCE4" },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D4DCE4" },
  },
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => cell(h, { w: widths[i], fill: NAVY, bold: true, color: "FFFFFF", size: 19.5 })),
    }),
    ...rows.map((r, ri) => new TableRow({
      children: r.map((c, i) => cell(c, { w: widths[i], fill: ri % 2 ? "F5F8FA" : undefined, bold: opts.boldFirst && i === 0 })),
    })),
  ],
});

// ---------- Part A content ----------
const cal = [
  ["D01", "Tue 01 Sep", "Induction, safety, code of conduct, baseline diagnostic test"],
  ["D02", "Wed 02 Sep", "Reading drawings I — architectural set, grids, levels, symbols"],
  ["D03", "Thu 03 Sep", "Reading drawings II — structural set, column & beam schedules, BBS"],
  ["D04", "Fri 04 Sep", "Measurement, mensuration, IS 1200 and the Measurement Book"],
  ["D05", "Sat 05 Sep", "Land survey & setting out — total station, grids, profiles"],
  ["D06", "Mon 07 Sep", "Levels & levelling — auto level, RL, level book, the 1-metre line"],
  ["D07", "Tue 08 Sep", "Cement — types, field tests, lab tests, storage, consumption control"],
  ["D08", "Wed 09 Sep", "Concrete & reinforcement — mix, slump, cubes, BBS, cover"],
  ["D09", "Thu 10 Sep", "Shuttering, masonry & block machinery; stores walkthrough"],
  ["D10", "Fri 11 Sep", "Estimation, BOQ, rate analysis; stores & procurement cycle"],
  ["D11", "Sat 12 Sep", "QC system, NCR, SWA + MONTH 1 CHECKPOINT ASSESSMENT and pod formation"],
];

const rot = [
  ["B1", "Mon 14 – Thu 17 Sep", "Supervision", "Quality", "Measurement", "Store"],
  ["B2", "Fri 18 – Tue 22 Sep", "Quality", "Measurement", "Store", "Supervision"],
  ["B3", "Wed 23 – Fri 25 Sep", "Measurement", "Store", "Supervision", "Quality"],
  ["B4", "Sat 26 – Tue 29 Sep", "Store", "Supervision", "Quality", "Measurement"],
];

const immersion = [
  ["Month 2", "October 2026", "Supervision", "Quality", "Measurement", "Store"],
  ["Month 3", "November 2026", "Quality", "Measurement", "Store", "Supervision"],
  ["Month 4", "December 2026", "Measurement", "Store", "Supervision", "Quality"],
  ["Last week", "December 2026", "Store", "Supervision", "Quality", "Measurement"],
];

const doc = new Document({
  creator: "Neoteric Group",
  title: "Project NEEV — Trainee Supervisor Handbook",
  description: "Modular training handbook for Trainee Supervisors, Project NEEV, Batch 2026-01",
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) } } } },
          { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.6), hanging: convertInchesToTwip(0.2) } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) } } } },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Calibri", size: 21 } } },
  },
  sections: [
    // ===== COVER =====
    {
      properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
      children: [
        new Paragraph({ spacing: { before: 2200, after: 0 }, children: [new TextRun({ text: "NEOTERIC GROUP", bold: true, size: 30, color: NAVY, font: "Calibri", characterSpacing: 60 })] }),
        new Paragraph({ spacing: { after: 700 }, border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: ACCENT, space: 8 } }, children: [new TextRun({ text: "Neoteric Properties  ·  Navayan Realty  ·  Heaven Heights", size: 20, color: GREY, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "PROJECT NEEV", bold: true, size: 72, color: NAVY, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: "the foundation you build everything else on", size: 26, italics: true, color: GREY, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 900 }, children: [new TextRun({ text: "Trainee Supervisor Handbook", size: 40, color: ACCENT, font: "Calibri" })] }),
        CALLOUT(null, [
          "Neoteric Trainee Supervisor Program  ·  Batch 2026-01  ·  12 trainees",
          "Phase 1 training: Months 1 to 4  ·  Gateway Assessment: Month 5",
          "Joining 1 September 2026  ·  Base site: Zen Garden, Gwalior",
        ], LIGHT, NAVY),
        new Paragraph({ spacing: { before: 1400 }, children: [new TextRun({ text: "Name: ______________________________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Pod: __________   Site Buddy: ______________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Training Coordinator: Rajat        Training Supervisor: Deepti", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 900 }, children: [new TextRun({ text: "This handbook is the property of Neoteric Group. Carry it on site every day.", size: 18, italics: true, color: GREY, font: "Calibri" })] }),
      ],
    },
    // ===== BODY =====
    {
      properties: { page: { margin: { top: 1100, bottom: 1000, left: 1100, right: 1100 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "C9D3DC", space: 4 } },
          children: [new TextRun({ text: "Neoteric Group  ·  Project NEEV  ·  Trainee Supervisor Handbook", size: 16, color: GREY, font: "Calibri" })],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: ["Page ", PageNumber.CURRENT], size: 16, color: GREY, font: "Calibri" })],
        })] }),
      },
      children: [
        // --- TOC ---
        new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } }, children: [new TextRun({ text: "Contents", bold: true, size: 32, color: NAVY, font: "Calibri" })] }),
        new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ================= PART A =================
        new Paragraph({
          spacing: { before: 0, after: 300 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
          children: [new TextRun({ text: "PART A  ·  The Programme", bold: true, size: 34, color: NAVY, font: "Calibri" })],
        }),

        H2("A1. Welcome"),
        P("You are joining Neoteric Group as a Trainee Supervisor under Project NEEV. Neev means foundation, and the name is meant literally: the next four months are the base that the rest of your career at this company is built on."),
        P("Your probation is nine months. The first four months are structured training — that is what this handbook covers. In Month 5 you sit the Gateway Assessment, and on clearing it you are allotted to one of four departments: Supervision (Work), Quality, Measurement, or Store. Months 5 to 9 are worked inside that department, and confirmation follows at the end of the nine months."),
        P("This handbook is modular. Each of the twenty-two technical modules stands on its own and follows the same structure, so you always know where to look. You are expected to read the module the evening before it is taught, not after."),
        P("Two things are worth saying clearly at the start. First, nobody expects you to know this material — that is why you are here. Ask every question you have, in front of everyone, every day. Second, nobody will forgive a false record. A checklist you sign for an inspection you did not perform is a disciplinary matter at this company, not a performance matter, and that standard applies from your first day."),
        P("One more thing, and it is the most useful sentence in this handbook. Nobody expects you to already know which of the four departments you belong in. Finding that out — for you and for the company — is what the next four months are actually for."),

        H2("A2. How to use this handbook"),
        BULLET("Every module has the same six sections: why it matters, what you must know, what you must be able to do, a field drill, common site mistakes, and self-check questions."),
        BULLET("The self-check questions at the end of every module are the question bank your assessments are drawn from. They are not optional reading."),
        BULLET("The field drill is a real task on a real site, not an exercise. Its output is submitted to Rajat, and from Month 2 to the department head you are attached to."),
        BULLET("Where an Indian Standard is quoted, it is quoted for orientation. Before you act on any value in this handbook, verify it against the current edition of the code and against the project specification, which always governs."),
        BULLET("Write in this handbook. Margins are for your own notes, the numbers your site actually uses, and the names of the people who taught you each item."),

        H2("A3. The nine months at a glance"),
        TABLE([1700, 1700, 5960], ["Stage", "When", "What happens"], [
          ["Month 1", "September 2026", "Foundation. All twelve together, learning the basics. The last two weeks are a taster in each of the four departments."],
          ["Months 2–4", "Oct – Dec 2026", "Three one-month immersions. Four pods of three, rotating through the departments, doing real work with real consequences."],
          ["Month 5", "January 2027", "GATEWAY ASSESSMENT — theory and practical. Clear it and you are allotted to a department. This is the decision point."],
          ["Months 5–9", "Jan – May 2027", "Working in your allotted department as a supervisor, under a reporting manager, judged on output rather than on learning."],
          ["End Month 9", "31 May 2027", "Confirmation letter, confirmed designation, revised terms."],
        ], { boldFirst: true }),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("The four departments", [
          "Supervision (Work) — getting work built correctly and on time, by people who do not report to you.",
          "Quality — deciding whether what was built is acceptable, and stopping it when it is not.",
          "Measurement — turning built work into numbers that can be paid.",
          "Store — controlling the 55 to 70 per cent of project cost that passes through the store.",
          "You will be allotted to one of these four at the Gateway. Everything before it exists to make that allotment obvious rather than surprising.",
        ], LIGHT, NAVY),

        H3("Month 1, Part 1 — Foundation (D01–D11, 1–12 September)"),
        TABLE([900, 1500, 6960], ["Day", "Date", "Focus"], cal, { boldFirst: true }),
        P("All twelve trainees together. Field in the morning, classroom module 16:00–17:30, daily log written and signed 17:30–18:00.", { before: 140, italics: true, size: 19.5, color: GREY }),

        H3("Month 1, Part 2 — Department taster (14–29 September)"),
        P("On 12 September the batch is split into four pods of three. Each pod then spends three or four days inside each of the four departments. Nobody becomes good at anything in four days — the point is that by 30 September you have stood inside all four jobs, and all four department heads have watched all twelve of you."),
        TABLE([700, 2100, 1640, 1640, 1640, 1640], ["Block", "Dates", "Pod 1", "Pod 2", "Pod 3", "Pod 4"], rot, { boldFirst: true }),
        P("Read a row across: from 14 to 17 September, Pod 1 is in Supervision while Pod 2 is in Quality, Pod 3 in Measurement and Pod 4 in Store. Then everyone moves one place along.", { before: 140, italics: true, size: 19.5, color: GREY }),

        H3("Months 2 to 4 — Department immersions"),
        P("The same idea, but each block is now a whole month, and you are given real work with a real consequence rather than being shown around. Three months deep in three departments, then one week in the fourth so that nobody walks into the Gateway with a blank space."),
        TABLE([1400, 1900, 1515, 1515, 1515, 1515], ["Period", "When", "Pod 1", "Pod 2", "Pod 3", "Pod 4"], immersion, { boldFirst: true }),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("What makes an immersion different from a visit", [
          "In September you watch the store. In October, if you are in Store, you own the reconciliation of two materials for the whole month and you sign it. In Quality you own the checklists for one floor. In Measurement you own the take-off for one flat type. In Supervision you own one trade on one floor.",
          "Small enough for you to control, real enough that getting it wrong shows. That is the standard for every scope you are given from Month 2 onwards.",
        ]),

        H2("A4. Your day"),
        TABLE([1700, 7660], ["Time", "What happens"], [
          ["09:00 – 09:15", "Report. Day brief from Rajat: what your pod is doing, where, and with whom."],
          ["09:15 – 13:00", "Field attachment with your Site Buddy. Observe, then assist, then do under supervision."],
          ["13:00 – 13:45", "Lunch."],
          ["13:45 – 16:00", "Field attachment continues. Field drill work for the day's module."],
          ["16:00 – 17:30", "Classroom module, taught by the day's subject expert."],
          ["17:30 – 18:00", "Write your daily log. Rajat reviews and signs. Questions raised and answered."],
          ["Evening", "Read tomorrow's module."],
        ], { boldFirst: true }),
        P("Working hours are 09:00 to 18:00 with four offs a month, as stated in your offer letter. In September the offs are the four Sundays.", { before: 140, italics: true, size: 19.5, color: GREY }),
        new Paragraph({ spacing: { before: 160 } }),
        CALLOUT("Eight early mornings", [
          "On 2, 5, 8, 14, 17, 21, 24 and 28 September you report at 07:30 instead of 09:00, and you leave at 16:30 on those days.",
          "The reason is the contractor's muster. Watching how manpower is actually counted, allotted and argued over at 07:30 is the best single lesson in labour management available anywhere on this site, and a 09:00 start would mean you never see it. These eight dates are fixed in advance so you can plan around them.",
        ]),

        H2("A5. Who you report to"),
        P("This is the question that decides whether a training programme works or quietly dissolves. The answer here is deliberately narrow, and two names carry most of it."),
        TABLE([2400, 6960], ["Who", "What they own"], [
          ["Rajat — Training Coordinator", "Runs the programme day to day. Gives the morning brief, coordinates your site buddy, reviews and signs your daily log every evening at 17:30, collects your field drills, keeps attendance. Anything about today goes to Rajat."],
          ["Deepti — Training Supervisor", "Owns the programme and its outcome. Assessments, your band, trainer scheduling, department allotment, escalation, and the Saturday review with the CEO. Anything about your assessment, your band or your future goes to Deepti."],
          ["Bharti — Office Coordinator", "Documents, your training file, handbook issue, attendance data to payroll, and the interface to HR. Anything about paperwork, records or your joining documents goes to Bharti."],
          ["Site Buddy", "Your day-to-day supervisor on site. One buddy per pod of three. Decides what you do each morning, corrects you in the field, and gives Rajat a weekly rating on you."],
          ["Module Trainer", "The subject expert who teaches a specific module. Owns you for that 90-minute session and the drill attached to it. Not your reporting line."],
          ["Programme Sponsor", "Head of Projects. Chairs the Saturday review. Owns trainer availability and resolves anything Deepti escalates."],
        ], { boldFirst: true }),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("The reporting chain, in one line", [
          "You  →  Site Buddy (during the day)  →  Rajat (17:30 daily log, every day)  →  Deepti (weekly)  →  Programme Sponsor and CEO (Saturday and monthly).",
          "Rajat runs it. Deepti owns it. Do not take the same question to both of them hoping for a different answer — they compare notes every week, and trying it is itself a thing that gets noticed.",
          "If a Project Manager or a contractor asks you to do something outside your programme, do it if it is safe and useful, then tell Rajat the same evening.",
        ]),

        H2("A6. How you will be assessed"),
        P("We are assessing two different things, and it is worth being explicit about both. The first is what you know. The second — which matters more to us — is how fast you learn, because that is what predicts what you will be worth in two years."),
        P("Everything in Month 1 is a checkpoint, not a gate. The gate is the Gateway Assessment in Month 5. The purpose of every checkpoint before it is to make sure that when you sit that assessment, neither you nor anybody else is surprised by the result."),
        TABLE([2400, 1100, 5860], ["Component", "Weight", "How it is measured"], [
          ["Baseline diagnostic (D01)", "0%", "Not scored for ranking. It establishes your starting point so your improvement can be measured."],
          ["Daily log quality", "15%", "Rated 1–5 every evening by the Training Coordinator. Completeness, accuracy, numbers, and whether the questions you ask are getting better."],
          ["Site Buddy weekly rating", "15%", "Initiative, discipline, safety behaviour, punctuality, and how you handle being corrected."],
          ["Weekly module tests", "15%", "Short written tests drawn from the self-check questions."],
          ["Month 1 checkpoint (D11)", "25%", "100 marks: 40 written, 30 practical field task, 30 behavioural and situational. Pods are formed from this result."],
          ["Department taster drills", "15%", "The field drill output from each of the four department blocks, marked by that department head."],
          ["Capstone presentation (D26)", "15%", "A 10-minute presentation on one real problem you found on site and what you recommend."],
        ], { boldFirst: true }),
        new Paragraph({ spacing: { before: 220 } }),
        H3("Learning Velocity Index"),
        P("Alongside your score we compute a Learning Velocity Index — the share of the improvement available to you that you actually captured, rather than the raw jump in marks. A trainee who moves from 30 to 70 captured 57 per cent of what was available to them. One who moves from 65 to 75 captured 29 per cent. The second has the better marks and the worse velocity."),
        P("This matters here more than in most places, because you have joined from different branches and different colleges and you are genuinely starting at different points. Judging you on September's raw marks would tell us mostly about your school, not about you. Velocity, not starting position, drives the scope you are given in each immersion."),
        new Paragraph({ spacing: { before: 200 } }),
        TABLE([1000, 2100, 6260], ["Band", "Meaning", "What it means for you"], [
          ["A", "Fast", "You are given the harder scope in each immersion, and you are watched as a future department lead."],
          ["B", "On track", "Standard immersion scope with daily supervision. This is where most people should be, and it is not a criticism."],
          ["C", "Developing", "A written improvement plan naming the two specific things to fix, a named mentor, and a re-check the following month."],
          ["D", "At risk", "An honest conversation in writing with Deepti. This is not an exit — the Gateway in Month 5 is the decision point. But you will be told plainly that you are on this path, and told early enough to change it."],
        ], { boldFirst: true }),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("Nobody should reach the Gateway surprised", [
          "Your offer letter makes Month 5 binary: clear the Gateway and you go forward, do not clear it and the programme ends. That is a fair term only if you have been told the truth every month before it.",
          "So you will be. Every month you will be told your band and the two specific things standing between you and the next one. If you are in trouble in September you will hear it in September, not in January.",
        ], "FBF0E4", ACCENT),

        H2("A7. Code of conduct and the integrity standard"),
        P("Most of what follows is ordinary professional conduct. One item is not, and it is the reason this section exists at all."),
        NUM("Safety first, always, including when it slows the work down. Nobody at Neoteric will ever be penalised for stopping unsafe work."),
        NUM("Every record you sign must be true. You sign a checklist only for an inspection you physically performed, at the location, at the time. A false record is a disciplinary matter, not a performance matter."),
        NUM("You may not accept anything of value from a contractor, vendor or supplier — not a meal, not a gift, not a favour. Report every offer to the Training Coordinator the same day. This is not about suspicion of you; it is about removing you from a position where you have to argue about it later."),
        NUM("You have no authority to commit the company on rates, payments, quantities or schedule. Say 'I will check and come back to you' and then come back."),
        NUM("Punctuality on a construction site is not a courtesy. A pour does not wait."),
        NUM("Treat every worker, gang leader and contractor with respect regardless of how you are treated. Your authority comes from being consistently right and consistently fair."),
        NUM("Confidentiality: drawings, rates, contracts, customer data and internal reports do not leave the company, and do not go onto personal devices or personal messaging groups."),
        NUM("Photographs on site are for documentation, filed in the company system — not for personal social media."),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("Stop-Work Authority applies to you from Day 1", [
          "Every employee of Neoteric Group, including a trainee in their first week, has the authority and the obligation to stop work that is unsafe or that will produce non-conforming permanent work.",
          "You will never be penalised for exercising it in good faith, and you do not need to be senior to use it. Stop the work, inform your Site Buddy and the Training Coordinator immediately, and write the log entry afterwards.",
        ], "FBF0E4", ACCENT),

        H2("A8. Site safety — the non-negotiables"),
        P("Read this page before you set foot on site tomorrow. Everything else in this handbook can wait a day. This cannot."),
        BULLET("Helmet on, chin strap fastened, and safety shoes on, from the moment you cross the barricade line. Every time. No exceptions for a 'quick look'."),
        BULLET("Full-body harness with a double lanyard for any work above 1.8 metres without edge protection, anchored to a fixed structure — never to the scaffold you are standing on."),
        BULLET("Never walk under a suspended load, and never stand under an active slab edge or a shaft opening."),
        BULLET("Never enter an excavation deeper than 1.5 metres that is not shored, benched or safely sloped."),
        BULLET("Never touch an electrical panel, board or connection. Report it. Electrical work is done only by a licensed electrician on a permit."),
        BULLET("Check the scaffold tag before you climb. Red tag means it may not be used, whatever anyone tells you."),
        BULLET("Know these before your first day ends: the assembly point, the first-aid room, the site emergency number, and the name of the Safety Officer."),
        new Paragraph({ spacing: { before: 200 } }),
        CALLOUT("If you see something unsafe", [
          "1. Stop the work. 2. Move people to safety. 3. Inform your Site Buddy and the Safety Officer immediately. 4. Inform the Training Coordinator. 5. Write it in your daily log the same evening.",
          "Do not wait to be sure you are right. It is far better to be wrong about a hazard than silent about one.",
        ], "FBEDED", "B03030"),

        // ================= PART B =================
        new Paragraph({
          pageBreakBefore: true,
          spacing: { before: 0, after: 300 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
          children: [new TextRun({ text: "PART B  ·  Technical Modules", bold: true, size: 34, color: NAVY, font: "Calibri" })],
        }),
        P("Twenty-two modules. Each follows the same structure. Modules M01 to M10 are taught in the first eleven days with the whole batch. The rest are covered inside your department blocks and immersions — but every module in this handbook is yours to read, whichever department you end up in, because the Gateway Assessment does not ask which department you were in last month."),
        new Paragraph({ spacing: { before: 200 } }),
        TABLE([900, 4200, 4260], ["Ref", "Module", "When"], MODULES.map(m => [m.id, m.title, m.days]), { boldFirst: true }),
        new Paragraph({ spacing: { before: 140 }, children: [new TextRun({ text: "Codes and values quoted in these modules are for orientation. Always verify against the current edition of the Indian Standard and against the project specification, which governs.", size: 19, italics: true, color: GREY, font: "Calibri" })] }),

        // modules
        ...MODULES.flatMap(m => { const doI = nextList(), ckI = nextList(); return [
          H1(`${m.id}  ·  ${m.title}`),
          RUNS([{ text: "When: ", bold: true, color: GREY, size: 19.5 }, { text: m.days, color: GREY, size: 19.5 }], { after: 160 }),
          CALLOUT("Why this matters", [m.why]),
          new Paragraph({ spacing: { before: 60 } }),
          H3("What you must know"),
          ...m.know.map(k => BULLET(k)),
          H3("What you must be able to do"),
          ...m.do.map(k => NUM(k, doI)),
          H3("Field drill"),
          P(m.drill),
          H3("Common site mistakes"),
          ...m.mistakes.map(k => BULLET(k)),
          H3("Self-check"),
          ...m.check.map(k => NUM(k, ckI)),
          new Paragraph({ spacing: { before: 200 } }),
          CALLOUT("My notes", ["", "", ""], "FAFBFC", "C9D3DC"),
        ]; }),

        // ================= PART C =================
        new Paragraph({
          pageBreakBefore: true,
          spacing: { before: 0, after: 300 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
          children: [new TextRun({ text: "PART C  ·  Quick Reference", bold: true, size: 34, color: NAVY, font: "Calibri" })],
        }),

        H2("C1. Numbers to know by heart"),
        P("Verify each against the current code and the project specification before you act on it. These are for orientation and for the conversation you have to hold on site without a phone in your hand."),
        TABLE([3400, 3400, 2560], ["Item", "Value", "Reference"], [
          ["Weight of steel bar per metre", "d² / 162 kg per metre (d in mm)", "Derived"],
          ["Cement bag", "50 kg", "IS 269 / IS 1489"],
          ["1 m³", "35.31 cft", "Conversion"],
          ["1 brass", "100 cft = 2.83 m³", "Trade unit"],
          ["Concrete cube size", "150 mm, tested at 7 and 28 days", "IS 516"],
          ["Cube sampling frequency", "1–5 m³: 1 sample · 6–15: 2 · 16–30: 3 · 31–50: 4 · then +1 per 50 m³", "IS 456, Table 11"],
          ["One cube sample", "3 cubes", "IS 456"],
          ["Slump — lightly reinforced", "25–75 mm (mix design governs)", "IS 456 / IS 1199"],
          ["Slump — heavily reinforced / pumped", "75–150 mm (mix design governs)", "IS 456 / IS 1199"],
          ["Cement initial setting time", "Not less than 30 minutes", "IS 4031 Pt 5"],
          ["Cement final setting time", "Not more than 600 minutes", "IS 4031 Pt 5"],
          ["Soundness (Le Chatelier)", "Not more than 10 mm expansion", "IS 4031 Pt 3"],
          ["Cement stack height", "Max 10 bags; 150–200 mm off floor; 300 mm clear of walls", "Good practice"],
          ["Cement usable age", "Retest if older than 3 months from manufacture", "Good practice"],
          ["Minimum curing period", "7 days (OPC); longer for blended cements and hot weather", "IS 456"],
          ["Deshuttering — vertical faces", "16–24 hours", "IS 456, Cl. 11.3"],
          ["Deshuttering — slab soffit (props left)", "3 days", "IS 456, Cl. 11.3"],
          ["Deshuttering — beam soffit (props left)", "7 days", "IS 456, Cl. 11.3"],
          ["Props — slab span ≤ 4.5 m / > 4.5 m", "7 days / 14 days", "IS 456, Cl. 11.3"],
          ["Props — beam span ≤ 6 m / > 6 m", "14 days / 21 days", "IS 456, Cl. 11.3"],
          ["Brick compressive strength (common burnt clay, lowest class)", "3.5 N/mm² minimum", "IS 1077"],
          ["Masonry height raised per day", "Generally 1.0–1.5 m maximum", "Good practice"],
          ["Mortar joint thickness", "10 mm, uniform", "Good practice"],
          ["Chicken mesh at RCC–masonry junction", "Typically 150 mm each side", "Project spec"],
          ["Internal plaster thickness", "12 mm typical (single coat)", "Project spec"],
          ["External plaster thickness", "15–20 mm typical (two coats)", "Project spec"],
          ["Plaster curing", "Minimum 7 days continuous", "Good practice"],
          ["Terrace slope", "1:100 to 1:120 to outlet", "Project spec"],
          ["Ponding test duration", "48–72 hours, witnessed and recorded", "Project spec"],
          ["Plumbing hydro test", "1.5–2× working pressure, held 24 hours, witnessed", "Project spec"],
          ["Trap water seal", "50 mm", "IS 1742 / project spec"],
          ["Electrical insulation resistance", "Commonly 1 MΩ minimum", "IS 732 / project spec"],
          ["Level book arithmetic check", "ΣBS − ΣFS = Last RL − First RL", "Survey"],
          ["Height of Instrument", "HI = RL of BM + Backsight", "Survey"],
          ["Right angle check without instrument", "3-4-5 rule; equal diagonals in a rectangle", "Survey"],
        ], { boldFirst: true }),

        H2("C2. Site documents and what each one proves"),
        TABLE([2200, 7160], ["Document", "What it proves"], [
          ["Indent", "What site said it needed, and when."],
          ["Purchase Order", "What was agreed, at what rate, on what terms."],
          ["Delivery Challan", "What the vendor claims he sent. Not proof of receipt."],
          ["GRN", "What we actually counted, inspected and accepted. This is the document that protects the company."],
          ["MRN", "What was issued, to whom, and against which work item."],
          ["Measurement Book", "What was physically built and measured. A legal document."],
          ["Site Diary", "What happened on site that day. The most useful document in any dispute."],
          ["DPR", "Planned versus actual, with quantities and reasons for variance."],
          ["QC Checklist", "That a named person physically inspected a named item at a named time."],
          ["NCR", "That a non-conformance was formally identified, actioned and verified closed."],
          ["SWA Log", "That work was stopped, why, by whom, and how it was resolved."],
          ["Test Records", "Cube, cement, steel, hydro, megger, ponding, earth resistance — with witness signature."],
          ["RA Bill", "Cumulative quantity, previously paid, payable now, less deductions."],
          ["Snag List", "Defect, location, agency, target date, closure signature, photographs."],
        ], { boldFirst: true }),

        H2("C3. Escalation matrix"),
        TABLE([3200, 3100, 3060], ["Situation", "Escalate to", "By when"], [
          ["Unsafe condition or act", "Stop work first, then Site Buddy + Safety Officer", "Immediately"],
          ["Injury or near-miss", "Safety Officer + Training Coordinator + Project Manager", "Immediately"],
          ["Work about to proceed past a hold point without inspection", "Site Buddy, then Project Manager", "Before the work proceeds"],
          ["Material rejected at gate", "Store In-charge + Site Buddy", "Before unloading"],
          ["Reinforcement cut or displaced by another trade", "Site Buddy + Project Manager; raise NCR", "Same day"],
          ["Drawing discrepancy or clash", "Site Buddy → Project Manager → Consultant", "Same day"],
          ["Contractor refuses an instruction", "Site Buddy, then Project Manager. Do not argue on site.", "Same day"],
          ["Offer of gift, favour or payment", "Training Coordinator directly", "Same day, in writing"],
          ["Instruction to sign an unperformed inspection", "Training Coordinator and Programme Sponsor directly", "Immediately"],
          ["Personal, welfare or stipend matter", "Training Coordinator, then HR Partner", "Same day"],
        ], { boldFirst: true }),

        H2("C4. Daily log — what a good entry contains"),
        P("Your log is reviewed and signed every evening. A log without numbers is not a log. Use this structure every day."),
        NUM("Date, site, area worked, and weather.", 900),
        NUM("Manpower deployed by agency and trade, and the output achieved against it.", 900),
        NUM("What I did today — with locations and quantities, not adjectives.", 900),
        NUM("What I observed — one specific thing I saw done well and one done badly, with the reason.", 900),
        NUM("What I checked or tested, the result, and who witnessed it.", 900),
        NUM("What I did not understand — the question I need answered tomorrow.", 900),
        NUM("Any safety observation, near-miss, NCR or SWA.", 900),
        NUM("Signature, and the Training Coordinator's signature.", 900),
        new Paragraph({ spacing: { before: 220 } }),
        CALLOUT("The test of a good log", [
          "Could a colleague who was not on site today reconstruct what happened, from your entry alone, two years from now? If not, the entry is incomplete.",
        ]),

        H2("C5. Site vocabulary"),
        P("Terms you will hear on site from the first morning. Learn them fast; nobody will slow down for you."),
        TABLE([2100, 2500, 4760], ["Site term", "Technical term", "Meaning"], [
          ["Dori / line dori", "String line", "Used to keep masonry and tiling in a straight line."],
          ["Thappi / dot", "Gauge / screed dot", "Small pat of mortar fixed to plumb, used to set plaster thickness."],
          ["Saria", "Reinforcement bar", "TMT steel bar."],
          ["Kadi / stirrup", "Lateral tie", "The rings binding the main bars in a column or beam."],
          ["Chhalla / cover block", "Cover block", "Spacer that holds the specified concrete cover."],
          ["Shuttering / ply", "Formwork", "The mould into which concrete is cast."],
          ["Prop / jack", "Prop", "Adjustable vertical support under slab and beam shuttering."],
          ["Vibrator / needle", "Immersion vibrator", "Compacts concrete and removes entrapped air."],
          ["Chattai / tarpaulin", "Covering", "Used for curing protection and rain cover."],
          ["Chhat dalna", "Slab casting", "The concrete pour for a floor slab."],
          ["Tarai", "Curing", "Keeping concrete or plaster continuously wet."],
          ["Chunai", "Masonry work", "Brick or block laying."],
          ["Plaster / palastar", "Plastering", "Cement mortar coat on masonry and RCC."],
          ["Sunk", "Sunken slab", "Lowered slab portion in a toilet for plumbing."],
          ["Chase / cutting", "Chasing", "Groove cut in a wall for conduit or pipe."],
          ["Hacking", "Hacking", "Roughening an RCC surface to give plaster a key."],
          ["Naka / trap", "Floor trap", "Drain point in a wet area."],
          ["Mistri", "Charge hand / mason", "Skilled worker leading a small gang."],
          ["Beldar", "Helper", "Unskilled assisting worker."],
          ["Thekedar", "Contractor", "The agency executing the work."],
          ["Muster", "Attendance", "The morning headcount of deployed labour."],
          ["Level / RL", "Reduced Level", "Height of a point relative to the site datum."],
          ["BM", "Benchmark", "The reference point all levels are taken from."],
        ], { boldFirst: true }),

        H2("C6. Your Phase 1 checklist"),
        P("Twenty-eight things you must have physically done, at least once, under supervision, before you sit the Gateway Assessment. Tick each as you complete it and get it signed. This page is what you bring to your Gateway review — an unsigned line is a gap you still have four months to close."),
        TABLE([700, 6800, 1860], ["#", "I have personally done this, at least once, under supervision", "Signed"], [
          ["1", "Set out a building grid with a total station and had it independently checked", ""],
          ["2", "Taken a full round of levels and closed the level book arithmetic check", ""],
          ["3", "Inspected and accepted or rejected a cement consignment at the gate", ""],
          ["4", "Inspected and accepted or rejected a steel consignment, including mass per metre", ""],
          ["5", "Performed a slump test and cast a set of cubes correctly", ""],
          ["6", "Completed and signed a pre-pour checklist after physically verifying every line", ""],
          ["7", "Checked shuttering for plumb, line, level and back-propping", ""],
          ["8", "Prepared a BBS for one element and reconciled the steel used against it", ""],
          ["9", "Checked a masonry wall for plumb, joint, bond and height raised in a day", ""],
          ["10", "Fixed plaster dots and screeds to plumb, and tap-tested a completed wall", ""],
          ["11", "Witnessed and recorded a ponding test end to end", ""],
          ["12", "Witnessed and recorded a plumbing hydro test before concealment", ""],
          ["13", "Witnessed and recorded a megger test and an earth resistance measurement", ""],
          ["14", "Approved a dry-laid tiling layout before fixing started", ""],
          ["15", "Received a consignment end to end and raised the GRN", ""],
          ["16", "Completed a physical stock verification and explained every variance", ""],
          ["17", "Prepared a monthly cement and steel reconciliation for one building", ""],
          ["18", "Taken off quantities for one flat and compared against the BOQ", ""],
          ["19", "Built a rate analysis from first principles for one item", ""],
          ["20", "Carried out a joint measurement with a contractor and recorded it in the MB", ""],
          ["21", "Checked an RA bill line by line and listed the discrepancies", ""],
          ["22", "Raised an NCR and followed it through to verified closure", ""],
          ["23", "Exercised Stop-Work Authority and completed the log", ""],
          ["24", "Produced a complete snag list for one flat and closed it out", ""],
          ["25", "Maintained a Site Diary and submitted a DPR every working day", ""],
          ["26", "Delivered a toolbox talk in Hindi to a gang of workers", ""],
          ["27", "Computed required manpower from a target and checked it against the muster", ""],
          ["28", "Presented a real site problem and a recommendation to the leadership team", ""],
        ]),
        new Paragraph({ spacing: { before: 300 } }),
        CALLOUT("At the end of Phase 1", [
          "You will not know everything. You will know enough to be useful, enough to be safe, and — most importantly — enough to know what you do not know and who to ask.",
          "You will also know which of the four departments you belong in, and so will we. That is what these four months are for.",
          "Neev means foundation. Build it properly and everything after it is easier. Welcome to Neoteric.",
        ], LIGHT, NAVY),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync("../dist/NEEV_Trainee_Supervisor_Handbook.docx", b);
  console.log("written", b.length, "bytes");
});

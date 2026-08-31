Context: I'm building an injury/chronic pain tracking app, informed by 
personal experience managing a 6+ year chronic sports injury across many 
doctors, physios, and treatments. The core problem this app solves: no 
way to track which treatments actually worked over time, and no way to 
quickly summarize years of medical history for a new doctor instead of 
manually writing it out each time.

I want to rework the current UI around a specific product framework. 
Before changing anything, read through the existing frontend code and 
compare it against this framework, then give me a gap analysis and a 
proposed plan. Do not edit any files yet.

## Product framework

**Core function:** Log injuries, symptoms, and treatments via free text 
(backend extracts structure). Critically, this is NOT just a log — every 
treatment entry needs an outcome tracked over time (did it help, for how 
long, did symptoms return).

**Core loop:** User logs an entry → gets light positive acknowledgment 
(subtle animation, haptic feedback, optional soft chime — NOT celebratory/
gamey, since this is a health app; the tone should feel like "noted and 
cared for," not "you win"). For treatment entries specifically, the app 
follows up days/weeks later asking how it worked out, closing the loop 
between "tried X" and "X worked/didn't work."

**Commitment mechanic:** A first-week tracking streak right after 
onboarding, framed as "building your baseline record," not a generic 
gamified streak. Milestone at day 7: show the user their own timeline 
taking shape, reinforcing that they now have something real to show a 
doctor.

**Accessory features:**
- Full entry log/timeline, filterable by type (symptom, treatment, visit)
- Consistency view (calendar/graph of tracking frequency over time)
- Treatment-outcome comparison view — this is the most important and 
  unique feature: a view that shows, per treatment type, what was tried 
  and what the recorded outcome was, so the user (and their doctor) can 
  see patterns like "cortisone injections helped for ~2 months each time" 
  or "this approach never moved the needle"
- AI-generated doctor-ready summary — condenses the full history into 
  something shareable, strictly organizational (never diagnostic, never 
  suggests treatment) per this app's core principle of "organize, don't 
  diagnose"
- Support for multiple entry/habit types with different logging cadence: 
  daily check-in style (e.g. "log pain level once a day") vs. volume-based 
  (e.g. "log each stretching session, could be 2-4x/day")

**Surface area constraint:** 5-7 screens total, no more. Target set:
1. Onboarding / create first injury profile
2. Home / today's check-in
3. Timeline (full history)
4. Log entry (add symptom/treatment/visit, with outcome follow-up 
   handled as a prompt/notification, not a dedicated screen)
5. Consistency + treatment-outcome insights view
6. Injury profile detail (for users tracking multiple injuries)
7. Settings

**Retention hook:** Daily (or twice-daily) gentle check-in notifications, 
supportive in tone (not guilt/streak-loss driven), plus specific outcome 
follow-ups tied to logged treatments ("it's been 2 weeks since your 
injection — how's it holding up?").

## What I need from you

1. Read through the current frontend codebase (all screens, components, 
   navigation structure).
2. Map what currently exists against the 7-screen target above — which 
   screens exist already, which are missing, which existing screens don't 
   map cleanly and may need to be split, merged, or removed.
3. Specifically check: is there any existing treatment-logging UI, and if 
   so, does it have a field/flow for outcome tracking? If not, this is the 
   most important gap to flag clearly.
4. Check current UI against UI_GUIDE.md (if present) to confirm any new/
   reworked screens would stay consistent with existing component library, 
   tokens, and patterns.
5. Propose specific changes needed to reach the target screen count and 
   feature set — as a list, each item independently approvable.
6. Flag anything in the current implementation that feels tonally off 
   for a health app (overly celebratory/gamified language or visuals that 
   would feel wrong given what users are actually going through).

Do not make any code changes yet — give me the analysis and proposed plan 
first, and wait for my go-ahead on each item.
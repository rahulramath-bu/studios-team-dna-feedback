# **Team DNA: Product Requirements**

**Status:** WIP | **Owner:** Sam Ryu

---

## **1\. Overview & Strategic Context**

### **What is Team DNA?**

Team DNA is a team-level assessment and social discovery experience that helps each team member understand themselves through a personality and behavioral lens, understand their teammates, and surface collective team strengths and blind spots. It lives within the Team Tooling suite and serves as foundational diagnostic infrastructure — both for the team's own self-awareness and as a persistent data layer that informs every other experience in the BetterUp platform.

### **Why now?**

Team DNA addresses a structural gap in the current platform: we have no persistent representation of how a person operates *in relationship to others*. Individual coaching improves the person; Team DNA improves the *relationships between people*. It is also a direct competitive response to tools like DISC, Hogan, and Valence — but with a critical differentiator: results don't sit in a PDF. They become living context across the platform.

### **Strategic alignment**

Team DNA directly supports:

* **Team Tooling vision**: Creates the "team as a unit" layer that connects individual development to team performance  
* **HTP platform stickiness**: Every assessment result feeds other products (Grow, Manage, Lead) rather than existing in isolation  
* **Management effectiveness motion**: Gives managers a shared vocabulary and insight layer to coach their teams more precisely  
* **Competitive differentiation**: No competitor (DISC, Valence, Hogan) closes the loop from diagnostic → coaching → team pulse → behavior change

---

## **2\. The Problem We're Solving**

| Perspective | Pain Point |
| ----- | ----- |
| **Individual contributor** | I don't know how my working style affects my teammates, or how to work better with someone who operates differently than me |
| **Manager** | I have no shared vocabulary with my team for talking about how we work together. I react to interpersonal friction but don't understand its root cause |
| **HR / People Partners** | We've deployed DISC or StrengthsFinder — but the results went into a folder and nothing changed. There's no action layer |
| **Team (as a unit)** | We know each other as people, but we've never explicitly mapped how we work best together or what we collectively tend to miss |

---

## **3\. Target Users**

* **Primary**: Intact teams of 3–12 people with a shared manager  
* **Secondary:** Intact, cross functional working teams   
* **Tertiary**: HR leaders who want org-level pattern visibility

---

## **4\. Core Concepts**

### **4.1 The “Role” Model**

Team DNA uses a flexible “team role” model (starting with the Big 5, but that can be leveraged by other personality assessments). Each person receives a **primary role** that describes:

* How they naturally show up at work  
* What they contribute most reliably to a team (strengths)  
* Where they may create friction or blind spots  
* How they prefer to receive information, feedback, and collaboration

**Design principles for the role model:**

* Strengths-first framing (no role is "bad")  
* Designed for BOTH team and individual context  
* Actionable at the team level — not just interesting at the individual level  
* Each role maps to specific team performance drivers it naturally supports and ones it tends to neglect

### **4.2 Assessment Design**

* **Length**: less than 10 minutes  
* **Format**: TBD (can we make this more narrative / experiential)?  
* **Feedback loop**: Individuals see their individual report / profile immediately upon completion; full results are unlocked once their full team has completed  
* **Retake policy**: Annual retake recommended; system flags when significant tenure or role change may warrant a refresh

---

## **5\. Core Feature Set**

### **5.1 Individual Profile ("My DNA")**

Each team member receives a personal profile page showing:

* **Primary role on the team** with a rich narrative description (what you bring, how you work, how you recharge, what frustrates you, and key motivators)  
* **Strength signals**: We can play around here with AI. Once we have the team performance framework, we should share the 2–3 team performance drivers you reliably activate.   
* **Watch-out zones**: We should play around here with AI. Once we have the team performance framework, The 1–2 drivers you may underinvest in (not framed as weaknesses — framed as "where you may need to lean on others")  
* **Collaboration style**: How you prefer to receive feedback, process conflict, communicate under pressure  
* **Tips for working with you**: A short, shareable guide your teammates can reference (e.g., "Give me context before asking for a decision" or "I process out loud — don't mistake thinking-aloud for commitment")

**Access**: All members must opt in at the start of the experience to confirm that they are okay with their profile being public to all within the organization. Their individual responses to an assessment, etc. will be kept confidential.

---

### **5.2 Pairwise View ("How We Work Together")**

When two team members have both completed their assessment, they can view a **relationship card** that surfaces:

* **Natural synergies**: Where your roles complement each other (e.g., "Your Execution orientation \+ their Strategic Vision archetype means you're well-suited to translate ideas into action")  
* **Potential tensions**: Where your working styles may create friction (e.g., "You both have low preference for process — agree upfront on who owns follow-through")  
* **Collaboration playbook**: 3–5 specific behavioral recommendations for this pair to work well together  
* **Communication tips**: How each person prefers to give and receive feedback — and how to bridge the gap

**Access model**: Each person can view their pairwise card with any teammate who has completed the assessment. Cards are visible to both parties. Managers can view all pairwise cards for their team.

**Privacy note**: Pairwise cards are generated from both profiles. Neither person sees raw scores or responses from the other — only the synthesized relationship view.

---

### **5.3 Team View ("Our DNA")**

A team-level dashboard visible to the whole team (not just the manager) that surfaces:

**Team composition map**

* Visual representation of role distribution across the team  
* Highlights role clusters (e.g., "5 of 8 members have Execution as a primary strength") and gaps (e.g., "No one on this team has Strategic Orientation as a primary archetype")

**Team superpowers**

* The 2–3 team performance drivers your team collectively activates with high reliability  
* Framed as: "As a team, you are wired to..." with behavioral examples of what this looks like in practice

**Team watch-outs (collective gaps)**

* The 1–2 team performance drivers that are under-represented across your team  
* Framed as: "As a team, you may tend to miss..." with concrete examples of what this looks like when it goes wrong  
* These gaps are **actionable** — each one links to relevant Team Pulse categories, Team Coaching workshop recommendations, and Grow prompts

**Team Questions**

* **Async discussion prompts**: After results are unlocked, the system surfaces 3–5 team discussion prompts designed to open conversation about what the results mean (e.g., "What's one thing you want your team to know about how you work best?")

---

## **6\. Privacy & Consent Model**

| Data type | Who can see it |
| ----- | ----- |
| Individual archetype \+ narrative | Self; teammates (if opted in); manager |
| Raw assessment responses | Self only |
| Pairwise cards | Both parties in the pair; manager |
| Team composition view | All team members; manager; HR (aggregated only) |
| AI coaching memory (individual and team DNA context) | AI coach \+ human coach; not exposed to manager |
| Org-level aggregations | HR leaders; senior leaders (anonymized) |

**Key principles:**

* No individual is identifiable in org-level   
* Assessment participation is opt in but socially normed 

---

## **7\. Success Metrics**

| Metric | First Quarter Signal | 1–2 Year Target |
| ----- | ----- | ----- |
| **Primary Metrics** |  |  |
| **% Completed Team DNA** | 25% of teams who have access to Team DNA complete the exercise | \>50% across all active teams |
| **Assessment completion rate** | \>70% of invited team members complete within 14 days of launch | \>80% across all active teams |
| **Perceived usefulness** | \>75% of participants rate their profile as "accurate" or "very accurate" | \>80% sustained |
| **Secondary Metrics** |  |  |
| **Pairwise card engagement** | \>50% of members view at least 1 pairwise cards within 30 days | \>70% |
| **Grow session context utilization** | AI coach references Team DNA context in \>30% of sessions for members with Team DNA profiles | \>60% |
| **Cross-product action rate** | \>30% of managers take a connected action (pulse, workshop, Grow prompt) within 4 weeks of team DNA unlock | \>50% |
| **Renewal/expansion signal** | At least 2 reference partners by end of Q3 citing Team DNA as a reason to renew or expand | 5+ reference partners |

---

## **8\. Timeline**

| Work | Driver | Deadline | Status |
| :---- | :---- | :---- | :---- |
| Requirements Doc \+ User Stories | Sam / Product | Complete V1 by May 11th | ✅Draft completed, but still WIP due to outstanding technical / design questions. |
| Prototype based on PRD | Sam / Darshan | Complete by May 15th | ✅ [Two prototypes](https://betterup.atlassian.net/wiki/spaces/PT/pages/6176702481/Team+DNA+Prototypes) delivered to test out basic Team DNA flow |
| Finalize Scope | All Team | Complete by May 22nd | In Progress |
| Engineering Scoping | Justin / Sophie | Complete by May 22nd | In Progress |
| Mid Fidelity Wires | Rahul / Preetoshi | Complete by June 1st To share with Biomarin to get final feedback | In Progress |
| Development | Justin / Sophie | Complete by June 22nd | Not Started |
| Testing | All Team | Complete by June 26th | Not Started |
| Launch | All Team | Complete by July 7th (Tuesday) | Not Started |

---

## **9\. User Stories**

| Category | User Stories / Acceptance Criteria | Requirements | Priority |
| :---- | :---- | :---- | :---- |
| Integrations | As an organization, I want to be able to use the personality assessment data that I’ve already invested in (e.g. DISC, Hogan, etc.). | Integrate with top 3 personality assessments in the market (used by top customers) | P2 |
| Reporting | As an organization, I want to be able to see aggregated team data that I can slice by function. | AI generated patterns on: **Org Composition Map** (in aggregate) **Strength signals**: 2–3 team performance drivers  **Watch-out zones**: 1–2 drivers you may underinvest in (not framed as weaknesses — framed as "where you may need to lean on others") | P0 (manual pull ONLY) |

| Category | User Stories / Acceptance Criteria | Requirements | Priority |
| :---- | :---- | :---- | :---- |
| Privacy | As a manager, I want to know how my data will be used and who will see it. I also want to know how my direct reports’ data will be used. | When a manager starts the Team DNA onboarding process, they must opt into sharing their “profile” (not assessment responses) with their org IF they don’t opt in, they won’t be able to move forward | P0 |
| Discovery | As a manager, I want to be recommended to do the Team DNA exercise with my team by my BetterUp coach. | Coach Enablement for Team DNA | P0 |
|  | As a manager, I want to be recommended to do the Team DNA exercise with my team through UME in the right moment. | UME Card or Supercard | P0 |
|  | As a manager, I want to receive an email update that the Team DNA exercise exists, why this tool would be helpful for me and my team and a clear link to start the experience. | Marketing Email | P0 |
| Value Prop / FTUX | As a manager, I want to know what we will get out of the experience, how long it will take, and what the outputs of the experience are before getting started. | Value Prop Messaging / FTUX | P0 |
| Team DNA Kickoff | As a manager, when I kick off the experience, the platform will notify my team that I want them to sign up for BU and go through the Team DNA flow. | Email Comms: Clear step in the flow to notify team members to take the DNA assessment | P0 |
| DNA “Assessment” | As a manager, I am taken through an interactive experience that helps me share about myself in the context of personality, working style, goals, etc. | AI Coach led activity? The experience should take less than 10 minutes to complete | P0 |
| Individual DNA Results / 1:1 Comparison | As a manager, I am able to see my own individual profile after I take the assessment, AND I can compare my profile with other people on my team. P2: Comparing your profile with others across the company (Valence has this) | Individual Report / Profile Personality / Archetype Strengths Potential Blind Spots Profile Comparison (1:1) Personality / Archetype Strengths Potential Blind Spots | P0 |
| Team DNA Results / Dashboard | As a manager, once my full team completes the assessment, I am able to see our team DNA results. | MVE: everyone has to complete the assessment before TEAM results are shown Team report / dashboard Mix of Archetypes Team Strengths Team Blind Spots Best ways to communicate and collaborate As a team, we are able to see LLM generated questions to use in our next 1:1 to talk about our results. | P0 |
| AI Coaching Integration | As a manager, when I chat with my AI Coach, it brings my team’s profiles into context when it is relevant to the conversation. | Each person's profile is stored as **persistent AI coaching memory** When a Grow member begins a session, their coach (AI or human) has context: primary role, strengths, watch-outs, collaboration style This makes coaching more targeted: instead of "tell me how you work," the AI coach can say "based on your profile, you tend to be strong at execution but may struggle with ambiguity — let's explore how that showed up this week" | P1 |
| Team Pulse Integration | As a manager, based on our team DNA results, I am recommended to use Team Pulse to check in on our \[team norms, blind spots, etc.\] | Configurable Team Pulse categories based on Team DNA results After Team DNA is complete, recommend a new category for the manager to pulse their team on \[team norms, blind spots, etc.\] | P1 |
| Team Coaching Session | As a manager, I have the OPTION to do a team coaching session to discuss team results. | Team Coaching session that walks the team through their results, how to use their strengths together to drive performance, and setting new team norms? | P2 |

| Category | User Stories / Acceptance Criteria | Requirements | Priority |
| :---- | :---- | :---- | :---- |
| Privacy | As a direct report, I want to know how my data will be used and who will see it. | When a member starts the Team DNA onboarding process, they must opt into sharing their “profile” (not assessment responses) with their org IF they don’t opt in, they won’t be able to move forward | P0 |
| Discovery | As a direct report, I want to be notified that my manager has kicked off a Team DNA experience and requests that I start the experience. | Email Slack / Teams Nudge | P0 |
| Grow Onboarding | As a direct report, I will set up an account and onboard with my AI coach, and get directed to the Team DNA experience. | Grow Onboarding directs to the Team DNA flow (need to identify if we cut some onboarding screens) | P0 |
| Value Prop / FTUX | As a direct report, I want to know what I will get out of the experience, how long it will take, and what the outputs of the experience are. | Value Prop Messaging / FTUX | P0 |
| DNA “Assessment” | As a direct report, I am taken through an interactive experience that helps me share about myself in the context of personality, working style, goals, etc. | AI Coach led activity? The experience should take less than 10 minutes to complete | P0 |
| Individual DNA Results / 1:1 Comparison | As a direct report, I am able to see my own individual profile after I take the assessment, AND I can compare my profile with other people on my team. **P2: Comparing your profile with others across the company (Valence has this)** | Individual Report / Profile Personality / Archetype Strengths Potential Blind Spots Profile Comparison (1:1) Personality / Archetype Strengths Potential Blind Spots | P0 |
| Team DNA Results / Dashboard | As a direct report, as my team completes the assessment, I am able to see our team DNA results | MVE: everyone has to complete the assessment before TEAM results are shown Team report / dashboard Mix of Archetypes Team Strengths Team Blind Spots Best ways to communicate and collaborate | P0 |
| AI Coaching Integration | As a direct report, when I chat with my AI Coach, it brings my team’s profiles into context when it is relevant to the conversation. | Each person's profile is stored as **persistent AI coaching memory** When a Grow member begins a session, their coach (AI or human) has context: primary role, strengths, watch-outs, collaboration style This makes coaching more targeted: instead of "tell me how you work," the AI coach can say "based on your profile, you tend to be strong at execution but may struggle with ambiguity — let's explore how that showed up this week" | P1 |
| Team Coaching Session | IF my manager decides to opt into a team coaching session, I want to be notified when it is scheduled, and have that on my calendar. | Team Coaching Session scheduled | P2 |

## **Open Questions:**

* Grow or New “free” account type?  
  * If Grow, notify Biomarin  
* What is the difference between Manager / Team-member for Team DNA?  
* Assessment versus new type of context gathering?  
* Team Representation (backend)  
* 

## 

## 

## **Appendix**

### Differentiation: How We Win Against DISC, Hogan, StrengthsFinder

| Dimension | DISC / StrengthsFinder / Hogan | Team DNA |
| ----- | ----- | ----- |
| **Action layer** | Results end in a report or PDF | Results connect directly to Team Coaching, Team Pulse, and Grow prompts |
| **Team vs. individual framing** | Individual-first; team view is an afterthought | Team-first by design; individual profile exists in service of the team |
| **Living context** | Static — results don't update or inform anything | Persistent memory — results feed AI coaching, manager dashboards, and pulse categories |
| **Connected to development** | No connection to ongoing L\&D | Individual profiles feed into Grow session context; gaps inform coaching focus |
| **Manager utility** | Manager may receive a team report; that's it | Manager has an action layer: push prompts, book workshops, run pulses on gap areas |
| **Science grounding** | Proprietary models, often with limited predictive validity for team outcomes | BU Labs-grounded model specifically tied to team performance drivers |
| **Freshness** | One-time event, rarely revisited | System flags when retakes are relevant; results evolve with the team |
| **Social** | Typically no social layer | Pairwise cards, discussion prompts, team view, "How to Work With Me" sharing |

**The core differentiation is this**: DISC tells you who you are. Team DNA tells you how to work better together *and then helps you actually do it.*

### Platform Integration: The Connected Layer (future state)

This is the section that makes Team DNA a platform feature rather than a point solution. Each result type generates persistent signals that flow into the rest of the ecosystem.

### **1 → Grow (Individual AI Coaching)**

* Each person's profile is stored as **persistent AI coaching memory**  
* When a Grow member begins a session, their coach (AI or human) has context: primary role, strengths, watch-outs, collaboration style  
* This makes coaching more targeted: instead of "tell me how you work," the AI coach can say "based on your profile, you tend to be strong at execution but may struggle with ambiguity — let's explore how that showed up this week"  
* Manager-pushed Grow prompts can be informed by team watch-outs (e.g., if the team has a collective gap in Alignment, the manager can push a prompt: "This week in your coaching session, explore how you personally contribute to alignment — or get in its way")

### **2 → Team Pulse**

* Team watch-out areas (collective gaps) are **automatically surfaced as recommended Team Pulse categories**  
* If a team's DNA shows a gap in Trust, the next Team Pulse setup wizard suggests adding a Trust pulse question  
* Over time, this creates a closed loop: DNA identifies the structural gap → Pulse monitors whether it's improving → interventions are recommended based on whether it moves  
* This loop is visible to the manager in the Manage dashboard

### **3 → Team Coaching (Workshops)**

* Team watch-outs directly populate the **workshop recommendation engine**  
* If a team has a gap in Communication, the platform surfaces the Communication workshop as a top recommendation (vs. a generic catalog)  
* Workshop content can be personalized to the team's archetype mix (e.g., a workshop for a team of mostly Executor archetypes looks different than one for a team of mostly Strategists)

### **4 → Manage (Manager Dashboard)**

* Manager's team view in Manage shows archetype distribution and watch-outs as persistent context  
* Before a 1:1 or team meeting, the manager sees a prompt: "Based on your team's DNA, consider opening today's retro with a check-in on \[watch-out area\]"  
* Pairwise cards are accessible from the manager's view of any two direct reports (useful for navigating conflicts or pairing people on projects)

### **5 → Lead (Senior Leader View)**

* Aggregate archetype distribution across teams (e.g., "Your org has a systemic gap in Energy archetypes — teams are wired to execute but may be at risk of burnout")  
* Identifies when team compositions may be misaligned with the team's stated mission (e.g., an innovation team with no Exploration/Growth archetypes)

### **6 → HR Organizational View**

* Anonymized, aggregated archetype distribution across the organization  
* Surfaces systemic gaps across the driver model (e.g., "Communication is the lowest-represented driver across all teams in Engineering")  
* Informs L\&D investment decisions: where to run workshops at scale, which coaching prompts to deploy broadly
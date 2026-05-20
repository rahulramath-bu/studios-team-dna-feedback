import { makePairId } from './teamDnaIds.js';

const GENERATED_AT = '2026-05-20T00:00:00.000Z';
const INPUT_VERSION = 'team-dna-mock-generated-insights-v1';

/**
 * Mock generated-insights payload factory.
 *
 * What: fixture data shaped like the ideal output of a future Team DNA AI
 * synthesis backend. It exists so the prototype can render the final product
 * experience before that backend exists.
 * How: combines local sample members with handcrafted team/person/duo copy and
 * returns normal `source: 'ai'` insight records. The UI should not be able to
 * tell whether those records came from this mock file or from a real API.
 * Port: do not port this as frontend AI logic. Replace the factory call in
 * `teamDnaMock.js` with real generated insight records from the backend, then
 * keep using the same adapter/rendering path.
 */

const PERSON_SYNTHESIS = {
  sergio: {
    title: 'The Landing Gear',
    summary:
      'Sergio helps ambitious work touch the ground without losing its shape. He is useful when a team has enough ideas and needs someone to turn the next move into something people can actually build.',
    workWith:
      'Bring Sergio the shape of the problem and the tradeoffs you already see. He will be more useful if the conversation has enough structure to land, but not so much that the answer is already decided.',
    bestFor:
      'Turning fuzzy product intent into an engineering path, finding the first buildable version, and keeping cross-functional work from drifting away from reality.',
    misread:
      'People may read his steadiness as low excitement. It is usually more accurate to read it as him testing whether the idea has legs.',
    pairGift: 'grounded momentum',
    pairNeed: 'a clear handoff before the work moves from exploration to build',
  },
  justin: {
    title: 'The Systems Spine',
    summary:
      'Justin gives the work a backbone. He is the person who can quietly hold a lot of moving parts, notice what will break later, and make the technical path feel sturdier than the conversation that produced it.',
    workWith:
      'Give Justin the real constraints early. He does not need a long performance around the idea; he needs enough context to make a durable call.',
    bestFor:
      'Architecture, cleanup, hard tradeoffs, technical closure, and any moment where the team needs fewer opinions and a stronger spine.',
    misread:
      'People may read his concise style as distance. It is usually a sign that he is already sorting the problem into what matters and what does not.',
    pairGift: 'technical gravity',
    pairNeed: 'enough context before he is asked to lock the system in place',
  },
  darshan: {
    title: 'The Signal Conductor',
    summary:
      'Darshan creates motion by making many lanes feel connected. He can hold engineering, channel strategy, and team energy at the same time, which makes him useful when scattered work needs one shared rhythm.',
    workWith:
      'Show Darshan the moving pieces and the decision that needs to happen next. He will usually help by sequencing the room and making the work easier to coordinate.',
    bestFor:
      'Team rallying, launch coordination, decision moments, and work that needs both high energy and high follow-through.',
    misread:
      'People may read his momentum as certainty. It is often more like active coordination: he is moving the room so the answer can become visible.',
    pairGift: 'coordinated lift',
    pairNeed: 'space to move quickly without skipping the quiet signal',
  },
  mae: {
    title: 'The Human Lens',
    summary:
      'Mae notices the human shape inside the work. She can turn scattered inputs into a story that feels coherent, especially when the team has been looking at the problem too mechanically.',
    workWith:
      'Give Mae the mess, not just the cleaned-up brief. She is often most useful when she can see the contradiction, the feeling, and the user tension before the team has over-solved it.',
    bestFor:
      'Sensemaking, product story, experience framing, critique, and turning scattered user or stakeholder signals into a direction people can feel.',
    misread:
      'People may read her slower synthesis as hesitation. It is often the work of finding the real shape instead of grabbing the easiest one.',
    pairGift: 'human sensemaking',
    pairNeed: 'room to name what the work should feel like before it becomes a plan',
  },
  sam: {
    title: 'The Risk Translator',
    summary:
      'Sam feels the risk in a room before everyone has words for it. Her value is not just spotting what could go wrong; it is turning that signal into a clearer product decision.',
    workWith:
      'Treat Sam’s concerns as product input, not emotional noise. Ask what decision, dependency, or user risk the concern is pointing toward.',
    bestFor:
      'Product calls under uncertainty, launch readiness, stakeholder alignment, and moments where the team needs care translated into a sharper next step.',
    misread:
      'People may read her vigilance as resistance. It is often protection: she is trying to keep the team from learning the hard thing too late.',
    pairGift: 'protective clarity',
    pairNeed: 'a path for concerns to become decisions instead of loops',
  },
  scott: {
    title: 'The Learning Architect',
    summary:
      'Scott keeps the team oriented toward what people will understand, remember, and grow from. He helps the work become more than a feature by asking what kind of experience it teaches.',
    workWith:
      'Bring Scott in when the team is deciding how something should make sense to a person over time. He will often see the learning path behind the interface.',
    bestFor:
      'Experience architecture, learning moments, content strategy, and work where adoption depends on understanding rather than exposure.',
    misread:
      'People may read his quietness as absence. It is often deep processing: he is looking for the pattern that makes the experience teach itself.',
    pairGift: 'patient meaning',
    pairNeed: 'time to let the deeper experience logic surface',
  },
  sophie: {
    title: 'The Calm Finisher',
    summary:
      'Sophie makes complexity feel less loud by steadily turning it into working software. She brings the kind of follow-through that lets other people stop carrying a problem in their heads.',
    workWith:
      'Give Sophie clear ownership and the context behind the ask. She will carry the work well, but the team should not make her guess which details matter most.',
    bestFor:
      'Implementation, multi-step technical work, quality passes, and moments where the team needs calm progress instead of more discussion.',
    misread:
      'People may read her calm as unlimited capacity. It is better to make priorities explicit so her reliability does not become the place messy work disappears.',
    pairGift: 'quiet completion',
    pairNeed: 'clear priority so her follow-through goes to the right thing',
  },
  rahul: {
    title: 'The Frame Breaker',
    summary:
      'Rahul is useful when the current answer is too obedient. He can loosen the frame, re-open the question, and help the team find a more interesting path than the one it inherited.',
    workWith:
      'Give Rahul permission to explore before asking him to converge. Then name the moment when the team is switching from opening possibilities to choosing one.',
    bestFor:
      'Early product exploration, concept generation, reframing, and moments where the team is stuck inside an answer that feels too small.',
    misread:
      'People may read his looseness as lack of seriousness. It is often his way of refusing to let the team over-commit to a mediocre frame.',
    pairGift: 'creative reframe',
    pairNeed: 'a visible moment when exploration becomes commitment',
  },
  preetoshi: {
    title: 'The Provocateur',
    summary:
      'Preetoshi pushes toward the version of the work that feels alive. He is most useful when the team needs taste, intensity, and a willingness to challenge the inherited frame.',
    workWith:
      'Do not bring Preetoshi only the safe version. Bring the real user experience problem and let him react to what feels dead, generic, or too small.',
    bestFor:
      'Experience vision, interaction quality, design direction, provocation, and moments where the team needs to raise its own expectations.',
    misread:
      'People may read his intensity as rejection. It is usually care for the experience arriving before the room has caught up.',
    pairGift: 'alive tension',
    pairNeed: 'permission to challenge the frame plus a clear moment to land the work',
  },
  jon: {
    title: 'The Studio Current',
    summary:
      'Jon carries creative momentum across people. He can make ambitious work feel socially possible, which matters when a team needs belief as much as it needs a plan.',
    workWith:
      'Give Jon the human stakes, not just the task list. He is useful when he can connect the work to energy, people, and the larger story.',
    bestFor:
      'Studio direction, team momentum, creative leadership, and moments where the group needs to believe the work is worth pushing for.',
    misread:
      'People may read his energy as only vision. It often also carries the social glue that keeps ambitious work from becoming lonely.',
    pairGift: 'shared belief',
    pairNeed: 'enough reality in the room to keep momentum from floating',
  },
  rainy: {
    title: 'The Evidence Keeper',
    summary:
      'Rainy gives the team a clearer relationship to what is actually true. She can keep curiosity from becoming myth by bringing method, evidence, and a calm read on human behavior.',
    workWith:
      'Bring Rainy the question behind the question. She will be most useful if she can help decide what would count as evidence before the team falls in love with an answer.',
    bestFor:
      'Research framing, measurement, evidence checks, behavioral interpretation, and moments where the team needs rigor without losing curiosity.',
    misread:
      'People may read her precision as slowing things down. It is usually the work of preventing the team from moving fast around a false assumption.',
    pairGift: 'evidence-backed curiosity',
    pairNeed: 'a clear question so rigor points somewhere useful',
  },
};

const PERSON_WORK_WITH_NOTES = {
  sergio: [
    'Bring me the problem, the goal, and the tradeoffs you already see.',
    "Give me enough shape to land the work, but don't decide the answer before I join.",
    'Ask me what the first buildable version could be.',
    'If I seem quiet, I am probably testing whether the idea has legs.',
    'Before a handoff, agree on what done means.',
  ],
  justin: [
    'Bring me the real constraints early.',
    'Skip the performance; give me the facts that change the system.',
    'Ask me what might break later.',
    'If I am brief, I am probably sorting what matters.',
    'Give me context before asking me to lock anything in.',
  ],
  darshan: [
    'Show me the moving pieces and the next decision.',
    'Let me help sequence the room.',
    'Tell me what needs momentum and what cannot be skipped.',
    'If I move fast, pause me for the quiet signal.',
    'End with owners, dates, and the next move.',
  ],
  mae: [
    'Bring me the messy version, not just the polished brief.',
    'Tell me what feels off before we over-solve it.',
    'Give me room to find the human story.',
    'If I am quiet, I may be finding the real shape.',
    'Ask what this should feel like before we plan it.',
  ],
  sam: [
    'Bring me the decision, the risk, and who it affects.',
    'Treat my worry as product signal, not noise.',
    'Ask me what could go wrong and what would make it safer.',
    'Help me turn concern into a decision.',
    'Do not wait until launch to ask what feels exposed.',
  ],
  scott: [
    'Bring me in when people need to understand the experience over time.',
    'Ask what the user should learn, not just what they should see.',
    'Give me time to find the deeper pattern.',
    'If I am quiet, I am probably processing the learning path.',
    'Use me to make the experience teach itself.',
  ],
  sophie: [
    'Give me clear ownership and why the work matters.',
    'Tell me which details matter most.',
    'Do not make me guess the priority.',
    'Check in before reliable work turns into invisible work.',
    'Hand me the next concrete step, not a vague pile.',
  ],
  rahul: [
    'Give me room to explore before asking me to choose.',
    'Bring me the question, not just the answer we inherited.',
    'Tell me when we are switching from ideas to commitment.',
    'Do not read looseness as not caring.',
    'Ask me what frame feels too small.',
  ],
  preetoshi: [
    'Bring me the real problem, not the safe version.',
    'Show me what feels dead, generic, or too small.',
    'Let me react before we smooth the idea down.',
    'Do not read intensity as rejection.',
    'Help me turn the strong reaction into a clear next move.',
  ],
  jon: [
    'Bring me the human stakes, not just the task list.',
    'Tell me why the work should matter to people.',
    'Use me when the team needs belief and momentum.',
    'Keep enough reality in the room so the vision can land.',
    'Do not read energy as only vision.',
  ],
  rainy: [
    'Bring me the question behind the question.',
    'Ask what evidence would change our mind.',
    'Bring me in before the team falls in love with the answer.',
    'Do not read precision as slowing things down.',
    'Let rigor make the idea stronger, not smaller.',
  ],
};

function pair(title, summary, pairingManual, bestFor, misread, watchOut) {
  return {
    title,
    summary,
    pairingManual,
    bestFor,
    misread,
    watchOut,
  };
}

const PAIR_SYNTHESIS = {
  [makePairId('sergio', 'justin')]: pair(
    'The Build Partners',
    'Sergio and Justin turn uncertainty into something buildable. Sergio keeps the path connected to product reality; Justin gives it the technical backbone to hold.',
    'Start with the tradeoffs, not the theater. Sergio can shape the practical path while Justin tests whether the system underneath can carry it.',
    'Architecture calls, implementation planning, and moments where the team needs ambition translated into durable engineering.',
    'This pair can look quieter than it is. A lot of the work is happening in constraint-sorting before anyone says the obvious answer.',
    'Do not wait until the end to name the tradeoff. Put the product need and the technical constraint in the same sentence early.'
  ),
  [makePairId('sergio', 'darshan')]: pair(
    'The Launch Rails',
    'Darshan creates motion; Sergio keeps that motion on rails. Together they can move a group quickly without letting the practical path disappear.',
    'Let Darshan sequence the room and Sergio pressure-test the landing. The pair works best when speed and feasibility are both treated as first-class signals.',
    'Launch planning, cross-functional coordination, and decisions where momentum needs a buildable track.',
    'People may read Sergio as slowing Darshan down. More often, he is helping the launch energy survive contact with reality.',
    'Make the landing criteria visible before the room gets excited. It keeps speed from turning into cleanup.'
  ),
  [makePairId('sergio', 'mae')]: pair(
    'The Grounded Story Pair',
    'Mae finds the human shape of the work; Sergio helps it become something a team can actually build. The pair is useful when a feeling needs a path.',
    'Give Mae room to name what the experience should feel like, then let Sergio turn that into constraints and next steps.',
    'Experience framing, product shaping, and turning user tension into an engineering path.',
    'This pair can look like it is moving between two languages. That is the point: one protects meaning, the other protects the path.',
    'Do not jump from feeling straight to tasks. Name the experience principle first, then decide what gets built.'
  ),
  [makePairId('sergio', 'sam')]: pair(
    'The Readiness Loop',
    'Sam feels the risk signal; Sergio helps convert it into a buildable plan. Together they are strong at making readiness more concrete.',
    'Ask Sam what feels exposed, then ask Sergio what change would make that risk easier to carry. The pair works when concern becomes design input.',
    'Launch readiness, product risk calls, and moments where the team needs care translated into a practical next step.',
    'Sam may sound like she is adding friction, while Sergio may sound like he is narrowing. Together they are usually trying to make the work safer to ship.',
    'Do not leave risk as a mood. Turn it into one decision, one owner, or one test.'
  ),
  [makePairId('sergio', 'scott')]: pair(
    'The Teaching Bridge',
    'Scott sees what people need to understand; Sergio helps create the bridge from that understanding into the product. The pair makes learning feel buildable.',
    'Let Scott name the learning path and Sergio name the implementation path. The best version is when those become the same path.',
    'Onboarding, adoption moments, experience architecture, and products that only work if people understand them over time.',
    'This pair may look slower at the beginning because both are looking for the shape beneath the feature.',
    'Do not reduce the learning idea to content too quickly. Decide what the user should be able to do differently after the experience.'
  ),
  [makePairId('sergio', 'sophie')]: pair(
    'The Delivery Pair',
    'Sergio and Sophie make progress feel less noisy. Sergio clarifies the path; Sophie steadily carries it through.',
    'Give them ownership that is clear enough to land but flexible enough to adjust. They do not need much drama to make a thing real.',
    'Implementation, quality passes, technical cleanup, and work that needs reliable forward motion.',
    'Their steadiness can hide how much they are carrying. Make priority explicit so reliability does not become invisible labor.',
    'Check that the right thing is being finished, not just that something is being finished.'
  ),
  [makePairId('sergio', 'rahul')]: pair(
    'The Spark-to-Landing Pair',
    'Rahul opens the frame; Sergio helps it touch the ground. The pair is useful when a strange idea needs a practical first version.',
    'Give Rahul room to loosen the inherited answer, then ask Sergio what version of it could survive the first build.',
    'Concept exploration, early prototyping, and turning a wild direction into the first credible artifact.',
    'Sergio may seem too grounding and Rahul may seem too loose. The useful work is the handoff between those instincts.',
    'Name when exploration ends and landing begins. Otherwise the handoff becomes the conflict.'
  ),
  [makePairId('sergio', 'preetoshi')]: pair(
    'The Taste-and-Build Pair',
    'Preetoshi pushes toward the version that feels alive; Sergio helps keep that intensity attached to a buildable path.',
    'Let Preetoshi name what feels dead or generic, then let Sergio identify the smallest move that would make the better version real.',
    'Experience quality, prototype direction, and moments where the team needs high taste without losing feasibility.',
    'People may mistake this pair for taste versus pragmatism. The better read is taste looking for a path.',
    'Do not flatten the strong reaction too quickly. Translate it into a product move before deciding it is too much.'
  ),
  [makePairId('sergio', 'jon')]: pair(
    'The Studio Track',
    'Jon creates belief and creative current; Sergio gives that current a track. Together they can make ambitious work feel possible and buildable.',
    'Start with the human stakes, then ask what path lets the team actually move. Belief and constraints both need airtime.',
    'Studio direction, early planning, and work that needs momentum without floating away from delivery.',
    'Jon may sound like he is expanding the frame while Sergio sounds like he is narrowing it. That tension is useful when both are explicit.',
    'Keep one eye on the story and one eye on the next owner. The pair works when both stay visible.'
  ),
  [makePairId('sergio', 'rainy')]: pair(
    'The Evidence Rail',
    'Rainy asks what would count as true; Sergio asks what would count as buildable. Together they give the work a rail before it runs.',
    'Bring them the question and the constraint. Rainy can sharpen the evidence standard while Sergio turns the answer into a practical path.',
    'Research-to-product handoffs, experiment framing, and technical planning that needs evidence behind it.',
    'This pair can be misread as cautious. Usually they are protecting the team from building confidently around a weak premise.',
    'Decide what evidence is enough before engineering starts carrying the answer.'
  ),
  [makePairId('justin', 'darshan')]: pair(
    'The Operating Core',
    'Darshan moves the system of people; Justin stabilizes the system of code. Together they can turn scattered effort into a real operating rhythm.',
    'Let Darshan coordinate the moving pieces and Justin lock the technical spine. The pair works when people-flow and system-flow stay connected.',
    'Operational planning, platform work, and moments where leadership energy needs a strong engineering center.',
    'Darshan may look fast and Justin may look terse. Together that can be a very efficient rhythm if context is shared early.',
    'Do not ask for a technical lock before the decision context is clear.'
  ),
  [makePairId('justin', 'mae')]: pair(
    'The Quiet Framework Pair',
    'Mae finds the human meaning; Justin builds the frame that can hold it. This pair turns soft signals into a system the team can trust.',
    'Give Mae space to surface the user tension, then let Justin shape the technical structure around what matters most.',
    'Experience systems, product architecture, and translating design intent into durable implementation.',
    'Their work may look quiet because both are processing below the surface. Do not confuse that with lack of direction.',
    'Make the core user promise explicit before the technical shape hardens.'
  ),
  [makePairId('justin', 'sam')]: pair(
    'The Risk System',
    'Sam catches what could go wrong; Justin turns that signal into a stronger system. Together they make risk less emotional and more actionable.',
    'Let Sam name the concern plainly. Then ask Justin what architecture, sequencing, or tradeoff would reduce the risk.',
    'Readiness reviews, technical risk, launch decisions, and product calls with hidden dependencies.',
    'Sam may sound alarmed and Justin may sound clipped. The useful version is concern becoming a technical decision.',
    'Do not let the risk loop repeat. Convert the worry into one system question.'
  ),
  [makePairId('justin', 'scott')]: pair(
    'The Patient Builders',
    'Scott protects the learning path; Justin protects the system path. Together they can make a product easier to understand and harder to break.',
    'Start with what the user needs to learn, then ask what technical shape makes that learning reliable.',
    'Learning experiences, platform-supported content, and product flows where clarity needs engineering discipline.',
    'This pair may resist shallow fixes. That is useful when the real problem is structural.',
    'Do not solve the visible confusion without checking whether the system is creating it.'
  ),
  [makePairId('justin', 'sophie')]: pair(
    'The Closure Pair',
    'Justin and Sophie close loops. Justin steadies the technical spine; Sophie carries the work through with calm precision.',
    'Give them clear ownership and the real constraints. They will be strongest when the goal is stable enough to finish well.',
    'Bug cleanup, production hardening, implementation details, and work where the team needs less debate and more closure.',
    'Their reliability can make messy upstream decisions look cleaner than they are. Protect them from becoming the cleanup default.',
    'Make sure the decision is actually made before this pair starts finishing it.'
  ),
  [makePairId('justin', 'rahul')]: pair(
    'The Frame-to-System Pair',
    'Rahul breaks the frame; Justin locks the usable one into place. The pair can turn exploration into a system, if the switch is named.',
    'Let Rahul explore first. Then give Justin the version worth stabilizing, with enough context to know what should survive.',
    'Prototype-to-platform handoffs, concept hardening, and turning a new direction into technical shape.',
    'Rahul may keep reopening while Justin wants the frame to hold. That is useful until the commit point, and expensive after it.',
    'Name the commit point out loud. Before it, explore; after it, protect the agreed shape.'
  ),
  [makePairId('justin', 'preetoshi')]: pair(
    'The Sharp Systems Pair',
    'Preetoshi raises the taste bar; Justin makes the system strong enough to carry it. This pair is useful when the better experience needs real infrastructure.',
    'Let Preetoshi name the quality gap and Justin name the structural cost. The pair works when neither signal gets minimized.',
    'Interaction quality, architectural tradeoffs, and moments where polish depends on deeper engineering choices.',
    'This can look like intensity meeting resistance. Usually it is a higher standard looking for the system that can support it.',
    'Translate taste into system requirements before deciding whether it is realistic.'
  ),
  [makePairId('justin', 'jon')]: pair(
    'The Momentum Frame Pair',
    'Jon brings belief and motion; Justin gives that motion a frame that does not wobble. Together they can make a bold direction feel technically serious.',
    'Let Jon name why the work matters, then let Justin name what has to be true for it to hold.',
    'Studio bets, technical strategy, and moments where momentum needs a stronger foundation.',
    'Jon may create energy faster than Justin is ready to endorse. That gap is useful if it turns into clearer assumptions.',
    'Separate excitement from commitment. The pair works when belief gets tested before it becomes a promise.'
  ),
  [makePairId('justin', 'rainy')]: pair(
    'The Proof Stack',
    'Rainy sharpens the evidence; Justin sharpens the system. Together they help the team build on what is true, not just what is persuasive.',
    'Ask Rainy what would prove the premise and Justin what the system needs to make that premise durable.',
    'Research-backed engineering, measurement systems, and hard product calls where truth and implementation both matter.',
    'This pair can feel exacting. That exactness is usually the work of protecting the team from expensive false confidence.',
    'Do not skip the evidence standard just because the technical path is available.'
  ),
  [makePairId('darshan', 'mae')]: pair(
    'The Human Launch Pair',
    'Darshan creates coordinated motion; Mae keeps the motion connected to the human story. Together they can launch work without losing its soul.',
    'Let Mae name what the experience should mean, then let Darshan move the team around that shared story.',
    'Launch narratives, cross-functional alignment, and experience work that needs both emotional clarity and team momentum.',
    'Darshan may move before Mae has finished sensing the shape. Give the human read enough time before sequencing the room.',
    'Do not turn the story into a status plan too early. The launch works better when meaning leads the motion.'
  ),
  [makePairId('darshan', 'sam')]: pair(
    'The Warm Command Pair',
    'Darshan drives coordinated action; Sam keeps the action aware of risk and care. Together they can make decisions that move and still protect people.',
    'Let Darshan create the next step and Sam name what needs to be protected before the step is final.',
    'Stakeholder moments, product readiness, and team calls where speed needs emotional and operational awareness.',
    'Darshan may read concern as drag; Sam may read speed as exposure. The useful version names both signals.',
    'Before closing the decision, ask what risk the decision creates for users, team, or trust.'
  ),
  [makePairId('darshan', 'scott')]: pair(
    'The Learning Rally',
    'Darshan rallies people around the work; Scott makes sure the work teaches. Together they can turn adoption into a shared team motion.',
    'Let Scott define the learning arc and Darshan coordinate the people and timing around it.',
    'Adoption, enablement, team rollout, and work that needs people to understand and act.',
    'Momentum can outrun comprehension. Scott is the useful brake that keeps motion from becoming noise.',
    'Check whether people actually understand the thing before pushing them to move with it.'
  ),
  [makePairId('darshan', 'sophie')]: pair(
    'The Calm Launch',
    'Darshan creates launch energy; Sophie turns that energy into finished work. Together they make motion feel dependable.',
    'Darshan can set direction and urgency; Sophie needs clean ownership and priority so the work lands well.',
    'Launch execution, implementation pushes, and coordinated work where calm follow-through matters.',
    'Sophie may carry more than the room sees because Darshan can create a lot of motion quickly.',
    'Make the priority order visible before the work fans out.'
  ),
  [makePairId('darshan', 'rahul')]: pair(
    'The Fast Reframe Pair',
    'Rahul breaks open the idea; Darshan turns the opened frame into motion. Together they can move fast from new possibility to shared direction.',
    'Give Rahul space to disrupt the inherited answer, then let Darshan decide how the team should move around the new option.',
    'Early concept work, creative sprints, and moments where a team needs both novelty and momentum.',
    'They can move very quickly before the landing is clear. That speed is exciting and risky.',
    'Pause once after the reframe to ask what has actually been chosen.'
  ),
  [makePairId('darshan', 'preetoshi')]: pair(
    'The Voltage Rail',
    'Darshan supplies coordinated lift; Preetoshi supplies taste and voltage. Together they can raise the ambition of a room and move it somewhere.',
    'Let Preetoshi name what needs to feel more alive, then let Darshan turn that energy into a sequence the team can follow.',
    'Creative direction, studio pushes, and moments where ambition needs to become shared motion.',
    'The pair can feel intense. It works when voltage has a rail instead of becoming pure heat.',
    'Decide what the intensity is for. Then give it an owner, a next step, and a stop point.'
  ),
  [makePairId('darshan', 'jon')]: pair(
    'The Signal Boosters',
    'Darshan coordinates the room; Jon gives it belief. Together they can make a team feel like the work is possible and worth moving for.',
    'Use Jon to connect the work to human stakes and Darshan to make the next move clear.',
    'Team momentum, launches, studio direction, and moments where people need both belief and coordination.',
    'This pair can create a lot of lift. The watch-out is assuming lift equals alignment.',
    'After the room feels energized, ask what each person thinks they are doing next.'
  ),
  [makePairId('darshan', 'rainy')]: pair(
    'The Evidence Conductors',
    'Darshan moves people through the decision; Rainy makes sure the decision is attached to evidence. Together they can make rigor feel actionable.',
    'Let Rainy define the evidence standard and Darshan sequence the decision around it.',
    'Research readouts, decision forums, and strategic calls where evidence needs to shape action.',
    'Darshan may want to move as soon as the signal feels clear; Rainy may want to make sure the signal is real.',
    'Agree on what evidence is enough before the room tries to decide.'
  ),
  [makePairId('mae', 'sam')]: pair(
    'The Care Lens Pair',
    'Mae reads the human story; Sam reads the risk underneath it. Together they are strong at noticing what a product moment may do to people.',
    'Give them access to the messy human signal. Mae can frame the experience, while Sam names what needs protection.',
    'User-sensitive product decisions, research synthesis, and moments where the team needs emotional precision.',
    'The pair may surface more caution than the room wants. That caution often contains the real user issue.',
    'Turn the concern into a design question so it does not stay as a feeling.'
  ),
  [makePairId('mae', 'scott')]: pair(
    'The Meaning Pair',
    'Mae finds the emotional shape; Scott finds the learning shape. Together they make experiences feel coherent over time.',
    'Let Mae name what the moment should feel like and Scott name what the person should come to understand.',
    'Experience strategy, learning design, onboarding, and product moments that need meaning to unfold.',
    'This pair can stay in sensemaking too long if no one asks what should happen next.',
    'After the meaning is clear, force one concrete move the product should make.'
  ),
  [makePairId('mae', 'sophie')]: pair(
    'The Soft Landing Pair',
    'Mae gives the work human softness; Sophie helps it land without drama. Together they can make careful experiences real.',
    'Let Mae protect the feeling and Sophie protect the finish. The pair works when detail and care both have ownership.',
    'Polished implementation, experience cleanup, and moments where a subtle product move needs to land well.',
    'Mae may keep refining the feeling while Sophie is ready to finish the shape. Name the quality bar before the final pass.',
    'Decide what “good enough” means for the human experience, not just for the ticket.'
  ),
  [makePairId('mae', 'rahul')]: pair(
    'The Open Frame Pair',
    'Rahul loosens the question; Mae finds the human truth inside the loosened frame. Together they can get a team unstuck from a stale answer.',
    'Let Rahul challenge the inherited frame and Mae test whether the new frame actually means something to people.',
    'Concept exploration, product story, and moments where the current answer feels too small.',
    'They can keep opening the frame if no one names the moment to choose.',
    'Capture the strongest reframe before chasing the next one.'
  ),
  [makePairId('mae', 'preetoshi')]: pair(
    'The Taste Mirror Pair',
    'Preetoshi pushes for aliveness; Mae reflects the human truth back into it. Together they can make taste less arbitrary and more felt.',
    'Let Preetoshi react honestly to what feels dead, then let Mae ground the reaction in the user or emotional story.',
    'Design direction, critique, and experience work where taste needs a human explanation.',
    'This pair can feel subjective from the outside. The useful move is translating reaction into a principle.',
    'Ask what human feeling the taste decision is protecting.'
  ),
  [makePairId('mae', 'jon')]: pair(
    'The Story Current Pair',
    'Mae finds the story; Jon gives it current. Together they can make a direction feel emotionally clear and socially possible.',
    'Let Mae shape the meaning and Jon carry the belief into the room.',
    'Creative direction, narrative alignment, and work where the team needs to feel why the direction matters.',
    'The story can become bigger than the next step. Keep one practical landing point in view.',
    'After the story lands, ask what the team should do differently tomorrow.'
  ),
  [makePairId('mae', 'rainy')]: pair(
    'The Human Evidence Pair',
    'Mae reads the human texture; Rainy checks what the evidence can actually support. Together they keep insight both felt and true.',
    'Let Mae sense the meaning and Rainy define what would prove or challenge it.',
    'Research synthesis, user interpretation, and product calls where feeling and evidence both matter.',
    'Mae may move from pattern to meaning faster than Rainy is ready to endorse. That gap is useful.',
    'Separate “this feels true” from “we have enough evidence.” Then decide what to do with each.'
  ),
  [makePairId('sam', 'scott')]: pair(
    'The Care Channel',
    'Sam notices what may hurt or fail; Scott notices what people need to understand. Together they turn care into clearer guidance.',
    'Let Sam name the risk and Scott shape the learning path that reduces it.',
    'Readiness, enablement, trust-sensitive product flows, and moments where users need help moving safely.',
    'This pair can carry a lot of concern on behalf of others. Give that concern a direct path into the product.',
    'Ask what the user needs to understand so the risk becomes smaller.'
  ),
  [makePairId('sam', 'sophie')]: pair(
    'The Safe Ship Pair',
    'Sam catches the readiness signal; Sophie helps the work ship calmly. Together they can make finishing feel safer.',
    'Let Sam name what feels exposed and Sophie name what needs to be done next. The pair works when concern becomes sequence.',
    'Launch readiness, PM-engineering handoffs, quality passes, and careful delivery.',
    'Sam may keep scanning while Sophie is ready to close. That is useful until the unresolved risk is named.',
    'Make a short risk list, choose which risks matter, and ship against that list.'
  ),
  [makePairId('sam', 'rahul')]: pair(
    'The Risk-and-Idea Pair',
    'Rahul opens possibilities; Sam catches what those possibilities might expose. Together they can make exploration more responsible.',
    'Let Rahul generate without immediate shutdown, then let Sam translate the real risks into design constraints.',
    'Early product bets, concept testing, and work where novelty needs a trust check.',
    'Rahul may experience caution as constraint; Sam may experience looseness as exposure.',
    'Give the idea one free round before risk review. Then make the risk review concrete.'
  ),
  [makePairId('sam', 'preetoshi')]: pair(
    'The Live Wire Check Pair',
    'Preetoshi raises the voltage; Sam checks what that voltage might cost. Together they can make bold work safer and more precise.',
    'Let Preetoshi name the alive version and Sam name the risk hidden inside it. The best output is bolder and clearer.',
    'High-stakes experience decisions, launch quality, and moments where intensity needs a trust check.',
    'This pair can look like push versus worry. The better read is aliveness meeting protection.',
    'Turn the strong reaction and the worry into one design decision before either one hardens.'
  ),
  [makePairId('sam', 'jon')]: pair(
    'The Belief Check Pair',
    'Jon builds belief; Sam tests whether the belief is safe enough to act on. Together they can keep momentum honest.',
    'Let Jon connect the work to energy and people, then let Sam name what must be true before the team moves.',
    'Studio bets, stakeholder alignment, and product calls where excitement needs readiness.',
    'Jon may feel Sam is cooling the room; Sam may feel Jon is moving before the risk is metabolized.',
    'Before committing, ask what could make this exciting idea unsafe, unclear, or unfair.'
  ),
  [makePairId('sam', 'rainy')]: pair(
    'The Signal Lab',
    'Sam feels early warning signals; Rainy helps test what those signals mean. Together they turn concern into evidence.',
    'Let Sam surface the worry and Rainy design the question that can sort it.',
    'Risk research, product readiness, user trust, and moments where intuition needs evidence.',
    'They can spend too long validating risk if no one defines enough evidence.',
    'Decide what evidence would change the plan before collecting more of it.'
  ),
  [makePairId('scott', 'sophie')]: pair(
    'The Patient Finishers',
    'Scott shapes what people need to learn; Sophie helps the work arrive calmly and completely. Together they can make clarity real.',
    'Let Scott define the learning path and Sophie own the steady implementation path.',
    'Learning flows, adoption surfaces, and careful product implementation.',
    'This pair may be too quiet about progress. Make the invisible work visible before others assume it is not moving.',
    'Share the learning goal and the shipping status in the same update.'
  ),
  [makePairId('scott', 'rahul')]: pair(
    'The Learning Reframe Pair',
    'Rahul opens a stranger question; Scott turns it into something people can understand. Together they can make novelty teachable.',
    'Let Rahul loosen the frame and Scott decide how someone would actually learn their way through it.',
    'Concept exploration, learning design, and experience work where novelty needs comprehension.',
    'Rahul may chase the interesting frame while Scott waits for the teachable one.',
    'Ask what the user would need to learn for the new frame to work.'
  ),
  [makePairId('scott', 'preetoshi')]: pair(
    'The Experience Tuning Pair',
    'Preetoshi hears when an experience feels dead; Scott hears whether it will teach itself. Together they can tune both feeling and comprehension.',
    'Let Preetoshi raise the quality bar and Scott test whether the user can understand the improved version.',
    'Experience critique, onboarding, learning moments, and interaction quality.',
    'This pair can get subtle. The risk is polishing the feeling without naming the learning move.',
    'Tie every taste improvement to what the user now understands or feels more clearly.'
  ),
  [makePairId('scott', 'jon')]: pair(
    'The Meaning Current Pair',
    'Jon carries belief; Scott turns belief into understanding. Together they can make a team feel the work and know how to move with it.',
    'Let Jon create energy around the story and Scott shape the path people need to follow.',
    'Adoption, team storytelling, enablement, and creative direction that needs to become understandable.',
    'Belief can outrun comprehension. Scott is the useful check on whether people can actually follow.',
    'After the story lands, ask what people now know how to do.'
  ),
  [makePairId('scott', 'rainy')]: pair(
    'The Teaching Proof Pair',
    'Scott asks what people need to understand; Rainy asks how we know that is true. Together they make learning more evidence-based.',
    'Let Scott define the learning hypothesis and Rainy define the evidence check.',
    'Learning research, content strategy, onboarding, and behavior-change product work.',
    'This pair can stay in evaluation if no one names the next product move.',
    'Decide what learning evidence is enough to change the experience.'
  ),
  [makePairId('sophie', 'rahul')]: pair(
    'The Loose-to-Done Pair',
    'Rahul opens the idea; Sophie helps it become finished work. Together they can move from looseness to done, if the handoff is clean.',
    'Let Rahul explore, then give Sophie the chosen shape with clear priority and ownership.',
    'Prototype handoffs, implementation of exploratory ideas, and moments where creative looseness needs delivery.',
    'Rahul may keep changing the frame after Sophie starts finishing. That is where the pair can fray.',
    'Name the chosen version before Sophie starts carrying it.'
  ),
  [makePairId('sophie', 'preetoshi')]: pair(
    'The Polish Handoff Pair',
    'Preetoshi raises the experience bar; Sophie carries the chosen improvement into working software. Together they can make taste shippable.',
    'Let Preetoshi name the quality gap, then protect Sophie from moving targets once the fix is chosen.',
    'UI polish, experience details, implementation quality, and prototype-to-product handoffs.',
    'The pair can strain if critique keeps arriving after the work has entered finish mode.',
    'Set a critique window and a finish window. Do not blend them silently.'
  ),
  [makePairId('sophie', 'jon')]: pair(
    'The Calm Current Pair',
    'Jon creates creative current; Sophie turns it into steady progress. Together they can keep ambitious work moving without making it feel frantic.',
    'Let Jon carry the why and Sophie carry the concrete next step. The pair works when story and ownership stay linked.',
    'Studio execution, implementation follow-through, and creative work that needs calm delivery.',
    'Jon may keep expanding the energy while Sophie is trying to close the loop.',
    'Keep one clear priority in front of the creative current.'
  ),
  [makePairId('sophie', 'rainy')]: pair(
    'The Evidence Finishers',
    'Rainy sharpens what is true; Sophie helps the answer become finished work. Together they can turn research into reliable product movement.',
    'Let Rainy define the evidence and Sophie define the implementation path.',
    'Research-to-build handoffs, quality work, measurement-informed product changes, and careful delivery.',
    'This pair can be overly careful if no one defines the moment to ship.',
    'Decide what evidence is enough, then let the work move.'
  ),
  [makePairId('rahul', 'preetoshi')]: pair(
    'The Wild Room',
    'Rahul loosens the frame; Preetoshi electrifies it. Together they can make the work feel suddenly less obedient and much more alive.',
    'This pair shines early, when the team needs to break out of the obvious answer. Add a landing partner when it is time to commit.',
    'Visioning, provocation, concept generation, and moments where the team needs to rediscover ambition.',
    'This pair can generate heat faster than structure. That is exciting, but it needs a landing ritual.',
    'Capture the strongest idea before the room chases the next charge.'
  ),
  [makePairId('rahul', 'jon')]: pair(
    'The Creative Current Pair',
    'Rahul opens the possibility; Jon gives it social current. Together they can make a new direction feel worth believing in.',
    'Let Rahul reframe the work and Jon connect the reframe to people, energy, and story.',
    'Early studio ideas, creative direction, and moments where a team needs permission to imagine bigger.',
    'They may create belief before the practical path exists. That is useful only if someone names the next test.',
    'After the creative lift, ask what would prove this deserves more time.'
  ),
  [makePairId('rahul', 'rainy')]: pair(
    'The Curious Proof Pair',
    'Rahul asks the stranger question; Rainy asks how to know if it is true. Together they make curiosity more rigorous.',
    'Let Rahul open the question and Rainy define the cleanest way to test it.',
    'Researchable product bets, concept validation, and exploratory work that needs evidence before it scales.',
    'Rahul may want to keep playing with the idea while Rainy wants to pin down the evidence.',
    'Choose one question to test before opening the next one.'
  ),
  [makePairId('preetoshi', 'jon')]: pair(
    'The Studio Voltage',
    'Preetoshi brings taste and provocation; Jon brings belief and studio current. Together they can make the room want the work to be better.',
    'This pair shines when the team needs ambition, not just alignment. Then make the chosen direction concrete before the energy dissipates.',
    'Creative leadership, experience vision, studio rituals, and moments where the team needs to raise its standards.',
    'They can make everything feel important. The work is deciding what is actually worth the voltage.',
    'Name the one standard the room is raising right now.'
  ),
  [makePairId('preetoshi', 'rainy')]: pair(
    'The Taste Test Pair',
    'Preetoshi pushes for the version that feels alive; Rainy tests what the evidence can support. Together they can keep taste sharp and honest.',
    'Let Preetoshi name the experience instinct and Rainy decide what evidence would strengthen or challenge it.',
    'Design critique, research-backed experience decisions, and moments where taste needs proof without becoming bland.',
    'The pair can feel like instinct versus evidence. The better version is instinct learning what would make it trustworthy.',
    'Ask what evidence would make the taste call stronger, not smaller.'
  ),
  [makePairId('jon', 'rainy')]: pair(
    'The Proof Current Pair',
    'Jon creates belief; Rainy keeps belief connected to evidence. Together they can make a direction feel inspiring without becoming myth.',
    'Let Jon carry the human story and Rainy define the evidence standard underneath it.',
    'Research readouts, strategy, studio direction, and moments where the team needs both inspiration and truth.',
    'Jon may move from signal to story faster than Rainy is ready to endorse.',
    'Make room for the story, then ask what evidence keeps it honest.'
  ),
};

function makeGuidanceCard(id, label, sections) {
  const normalizedSections = Array.isArray(sections) ? sections : [sections];

  return {
    id,
    kind: 'guidance',
    label,
    data: {
      guidance: {
        sections: normalizedSections.map((section) => ({
          label: section.label,
          body: section.body,
        })),
      },
    },
  };
}

function makeWatchOut(items) {
  return {
    items: items.map((item, index) => ({
      traitKey: item.traitKey ?? `ai-${index}`,
      type: 'ai',
      title: item.title,
      body: item.body,
    })),
  };
}

function getFirstName(member) {
  return member.name.split(' ')[0];
}

function getPronouns(member) {
  const pronouns = member?.pronouns;

  if (pronouns?.subject && pronouns?.object && pronouns?.possessive) {
    return pronouns;
  }

  return {
    subject: 'they',
    object: 'them',
    possessive: 'their',
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getWorkWithLabel(member) {
  return `How to work with ${getPronouns(member).object}`;
}

function getWhereShinesLabel(member) {
  return `Where ${getPronouns(member).subject} shines`;
}

function lowercaseFirst(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function getFirstSentence(value) {
  return value.split(/(?<=\.)\s+/)[0];
}

function getBestForShort(value) {
  const firstClause = value.split(', and moments')[0];
  const parts = firstClause
    .replace(/\.$/, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  return parts[0] ?? firstClause;
}

function makePairTrySections(first, second, pairSynthesis) {
  return [
    {
      body: getFirstSentence(pairSynthesis.pairingManual),
    },
    {
      body: pairSynthesis.watchOut,
    },
    {
      body: 'Before starting, agree on what each person owns.',
    },
    {
      body: 'If it feels tense, ask what each person is trying to protect.',
    },
    {
      body: 'End with one owner, one next step, and one check-in.',
    },
  ];
}

function makeTeamTrySections() {
  return [
    {
      body: 'Open the frame first, then name the exact thing the team is committing to now.',
    },
    {
      body: 'Give invention, proof, delivery, taste, and care each a visible role.',
    },
    {
      body: 'Before a handoff, say what “done” means in one concrete sentence.',
    },
    {
      body: 'Invite one quiet read before the room treats momentum as agreement.',
    },
    {
      body: 'Do not treat range as messiness; turn different instincts into named jobs.',
    },
  ];
}

function makePersonWorkWithSections(member, synthesis) {
  const notes = PERSON_WORK_WITH_NOTES[member.id] ?? [
    getFirstSentence(synthesis.workWith),
    `Bring this person into ${lowercaseFirst(getBestForShort(synthesis.bestFor))}.`,
    getFirstSentence(synthesis.misread),
  ];

  return notes.map((body) => ({ body }));
}

function getScoreBand(member, trait) {
  const score = getScore(member, trait);

  if (score >= 70) return 'high';
  if (score <= 35) return 'low';
  return 'middle';
}

function getPersonSpectrumReads(member) {
  const pronouns = getPronouns(member);
  const subject = pronouns.subject;
  const possessive = pronouns.possessive;
  const capitalPossessive = capitalize(possessive);
  const openness = getScoreBand(member, 'openness');
  const conscientiousness = getScoreBand(member, 'conscientiousness');
  const extraversion = getScoreBand(member, 'extraversion');
  const agreeableness = getScoreBand(member, 'agreeableness');
  const neuroticism = getScoreBand(member, 'neuroticism');

  return {
    openness:
      openness === 'high'
        ? `With ideas, ${subject} tends to push past the obvious answer and look for the more alive frame.`
        : openness === 'low'
          ? `With ideas, ${subject} tends to trust what has already been proven before opening a new frame.`
          : `With ideas, ${subject} tends to test new angles against what will actually hold.`,
    conscientiousness:
      conscientiousness === 'high'
        ? `With plans, ${subject} tends to turn intent into owners, standards, and next steps.`
        : conscientiousness === 'low'
          ? `With plans, ${subject} tends to keep the path loose until the work has a shape worth landing.`
          : `With plans, ${subject} tends to use enough structure to move without making the work stiff.`,
    extraversion:
      extraversion === 'high'
        ? `${capitalPossessive} energy tends to move outward, making momentum easier for the room to feel.`
        : extraversion === 'low'
          ? `${capitalPossessive} energy tends to build quietly before it turns into a visible contribution.`
          : `${capitalPossessive} energy tends to move between quiet processing and active participation.`,
    agreeableness:
      agreeableness === 'high'
        ? `With people, ${subject} tends to protect trust, tone, and the room around the work.`
        : agreeableness === 'low'
          ? `With people, ${subject} tends to protect the direct read, even when the room gets less comfortable.`
          : `With people, ${subject} tends to balance directness with care for how the message lands.`,
    neuroticism:
      neuroticism === 'high'
        ? `Under pressure, ${subject} tends to notice the risk signal early and look for what needs protection.`
        : neuroticism === 'low'
          ? `Under pressure, ${subject} tends to stay steady and help the room keep moving.`
          : `Under pressure, ${subject} tends to read the signal, name it, and move toward one next step.`,
  };
}

function makePersonInsight(member) {
  const synthesis = PERSON_SYNTHESIS[member.id];

  if (!synthesis) {
    return null;
  }

  return {
    id: `person-${member.id}-ai`,
    source: 'ai',
    generatedAt: GENERATED_AT,
    inputVersion: INPUT_VERSION,
    eyebrow: member.name,
    title: synthesis.title,
    summary: [{ text: synthesis.summary }],
    spectrumReads: getPersonSpectrumReads(member),
    watchOut: makeWatchOut([
      {
        title: 'When the signal needs a landing place.',
        body: synthesis.misread,
      },
      {
        title: 'When the room needs the useful version.',
        body: synthesis.workWith,
      },
    ]),
    cards: [
      makeGuidanceCard(
        `${member.id}-work-with`,
        getWorkWithLabel(member),
        makePersonWorkWithSections(member, synthesis)
      ),
      makeGuidanceCard(`${member.id}-where-shines`, getWhereShinesLabel(member), {
        body: synthesis.bestFor,
      }),
    ],
  };
}

function getScore(member, trait) {
  return member?.bigFive?.[trait] ?? 50;
}

function getHigherMember(first, second, trait) {
  return getScore(first, trait) >= getScore(second, trait) ? first : second;
}

function getLowerMember(first, second, trait) {
  return getScore(first, trait) < getScore(second, trait) ? first : second;
}

function makePairInsight(first, second) {
  const firstSynthesis = PERSON_SYNTHESIS[first.id];
  const secondSynthesis = PERSON_SYNTHESIS[second.id];
  const pairId = makePairId(first.id, second.id);
  const pairSynthesis = PAIR_SYNTHESIS[pairId];

  if (!firstSynthesis || !secondSynthesis || !pairSynthesis) {
    return null;
  }

  const firstName = first.name.split(' ')[0];
  const secondName = second.name.split(' ')[0];
  const higherOpenness = getFirstName(getHigherMember(first, second, 'openness'));
  const lowerOpenness = getFirstName(getLowerMember(first, second, 'openness'));
  const higherStructure = getFirstName(
    getHigherMember(first, second, 'conscientiousness')
  );
  const lowerStructure = getFirstName(
    getLowerMember(first, second, 'conscientiousness')
  );
  const higherEnergy = getFirstName(getHigherMember(first, second, 'extraversion'));
  const lowerEnergy = getFirstName(getLowerMember(first, second, 'extraversion'));
  const warmer = getFirstName(getHigherMember(first, second, 'agreeableness'));
  const moreDirect = getFirstName(getLowerMember(first, second, 'agreeableness'));
  const moreVigilant = getFirstName(getHigherMember(first, second, 'neuroticism'));
  const steadier = getFirstName(getLowerMember(first, second, 'neuroticism'));

  return {
    id: `pair-${makePairId(first.id, second.id)}-ai`,
    source: 'ai',
    generatedAt: GENERATED_AT,
    inputVersion: INPUT_VERSION,
    eyebrow: `${firstName} x ${secondName}`,
    title: pairSynthesis.title,
    summary: [
      { text: pairSynthesis.summary },
    ],
    spectrumReads: {
      openness: `With ideas, ${higherOpenness} stretches the frame while ${lowerOpenness} tests what can hold.`,
      conscientiousness: `With plans, ${higherStructure} wants the path clear while ${lowerStructure} keeps room to move.`,
      extraversion: `The energy works best when ${higherEnergy} can speak it out and ${lowerEnergy} gets a quieter first pass.`,
      agreeableness: `With people, ${moreDirect} protects the direct read while ${warmer} helps it land with care.`,
      neuroticism: `Under pressure, ${moreVigilant} catches the early signal while ${steadier} helps decide what needs action.`,
    },
    watchOut: makeWatchOut([
      {
        title: 'When the pair needs its own rule.',
        body: pairSynthesis.watchOut,
      },
      {
        title: 'When one rhythm becomes the default.',
        body: `This pair works best when ${firstName}'s need and ${secondName}'s need are both visible. If one rhythm silently wins, the other person will start compensating instead of collaborating.`,
      },
    ]),
    cards: [
      makeGuidanceCard(
        `${makePairId(first.id, second.id)}-pairing-manual`,
        'Try this together',
        makePairTrySections(first, second, pairSynthesis)
      ),
      makeGuidanceCard(
        `${makePairId(first.id, second.id)}-where-shines`,
        'Where this pair shines',
        {
          body: pairSynthesis.bestFor,
        }
      ),
    ],
  };
}

function makePairInsights(members) {
  const pairs = {};

  members.forEach((first, firstIndex) => {
    members.slice(firstIndex + 1).forEach((second) => {
      const insight = makePairInsight(first, second);

      if (insight) {
        pairs[makePairId(first.id, second.id)] = insight;
      }
    });
  });

  return pairs;
}

export function makeMockTeamDnaGeneratedInsights({ team, members }) {
  return {
    team: {
      id: `team-${team.id}-ai`,
      source: 'ai',
      generatedAt: GENERATED_AT,
      inputVersion: INPUT_VERSION,
      eyebrow: 'Team',
      title: 'The Possibility Studio',
      isEditable: true,
      summary: [
        {
          text: `${team.name} reads like a high-possibility team with a wide range in how people turn ideas into finished work. The team will see more possibilities than most groups, but it will need unusually explicit handoffs so that creative motion becomes shared progress.`,
        },
      ],
      spectrumReads: {
        openness: 'With ideas, this team tends to open many possible paths before choosing which one deserves a real test.',
        conscientiousness: 'With plans, this team works best when “done” is named early and handoffs are made explicit.',
        extraversion: 'The energy is mixed, so the team works best when quiet reads are invited before decisions close.',
        agreeableness: 'With people, this team works best when directness and warmth both get a visible role.',
        neuroticism: 'Under pressure, this team works best when risk signals are sorted before they spread.',
      },
      watchOut: makeWatchOut([
        {
          title: 'When creative motion outruns the handoff.',
          body: 'This team can open a lot of doors quickly. The watch-out is leaving too many people with different pictures of what was actually chosen.',
        },
        {
          title: 'When range gets mistaken for messiness.',
          body: 'The team has many useful instincts. It works best when those instincts are named as roles instead of treated as competing personalities.',
        },
      ]),
      cards: [
        makeGuidanceCard(
          'team-work-with',
          'Try this as a team',
          makeTeamTrySections()
        ),
        makeGuidanceCard('team-where-shines', 'Where this team shines', {
          body: 'This team shines in fuzzy product bets, new experience directions, research-to-product synthesis, and work that needs both imagination and a real path into the product.',
        }),
      ],
    },
    people: Object.fromEntries(
      members
        .map((member) => [member.id, makePersonInsight(member)])
        .filter(([, insight]) => Boolean(insight))
    ),
    pairs: makePairInsights(members),
  };
}

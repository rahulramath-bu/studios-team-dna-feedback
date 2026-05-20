import { makePairId } from './teamDnaIds.js';

const cards = [
  { id: 'block-1', label: 'Other info block' },
  { id: 'block-2', label: 'Other info block' },
  { id: 'block-3', label: 'Other info block' },
];

export const teamDnaDataset = {
  team: {
    id: 'flighthouse',
    name: 'Flighthouse',
  },
  members: [
    {
      id: 'sergio',
      name: 'Sergio Canales',
      role: 'Manager, Engineering',
      avatarUrl: '/team-dna/avatars/sergio-canales.png',
      assessmentComplete: true,
      // Placeholder scores are AI-assisted guesses for demo behavior only.
      // Replace with assessment-backed scores when the real data seam arrives.
      bigFive: {
        openness: 55,
        conscientiousness: 86,
        extraversion: 58,
        agreeableness: 62,
        neuroticism: 26,
      },
    },
    {
      id: 'justin',
      name: 'Justin Schiff',
      role: 'Staff Full-Stack Engineer',
      avatarUrl: '/team-dna/avatars/justin-schiff.png',
      assessmentComplete: true,
      bigFive: {
        openness: 63,
        conscientiousness: 82,
        extraversion: 38,
        agreeableness: 58,
        neuroticism: 31,
      },
    },
    {
      id: 'darshan',
      name: 'Darshan Bhatt',
      role: 'Manager, Engineering / Channel Manager',
      avatarUrl: '/team-dna/avatars/darshan-bhatt.png',
      assessmentComplete: true,
      bigFive: {
        openness: 60,
        conscientiousness: 79,
        extraversion: 54,
        agreeableness: 68,
        neuroticism: 34,
      },
    },
    {
      id: 'mae',
      name: 'Mae Gowda',
      role: 'Principal Product Designer',
      avatarUrl: '/team-dna/avatars/mae-gowda.png',
      assessmentComplete: true,
      bigFive: {
        openness: 88,
        conscientiousness: 62,
        extraversion: 46,
        agreeableness: 76,
        neuroticism: 48,
      },
    },
    {
      id: 'sam',
      name: 'Sam Ryu',
      role: 'Director, Product Management',
      avatarUrl: '/team-dna/avatars/sam-ryu.png',
      assessmentComplete: true,
      bigFive: {
        openness: 72,
        conscientiousness: 74,
        extraversion: 67,
        agreeableness: 64,
        neuroticism: 36,
      },
    },
    {
      id: 'scott',
      name: 'Scott Baker',
      role: 'Director, Learning Experience Design',
      avatarUrl: '/team-dna/avatars/scott-baker.png',
      assessmentComplete: true,
      bigFive: {
        openness: 82,
        conscientiousness: 66,
        extraversion: 52,
        agreeableness: 80,
        neuroticism: 43,
      },
    },
    {
      id: 'sophie',
      name: 'Sophie Yuan',
      role: 'Full-Stack Engineer',
      avatarUrl: '/team-dna/avatars/rahul-ramath.png',
      assessmentComplete: true,
      bigFive: {
        openness: 64,
        conscientiousness: 78,
        extraversion: 42,
        agreeableness: 72,
        neuroticism: 38,
      },
    },
    {
      id: 'rahul',
      name: 'Rahul Ramath',
      role: 'Staff Product Designer, Apps',
      avatarUrl: '/team-dna/avatars/preetoshi.png',
      assessmentComplete: true,
      bigFive: {
        openness: 91,
        conscientiousness: 44,
        extraversion: 72,
        agreeableness: 51,
        neuroticism: 46,
      },
    },
    {
      id: 'preetoshi',
      name: 'Preetoshi',
      role: 'Senior Experience Designer, BetterUp Studio',
      avatarUrl: '/team-dna/avatars/jon-blomgren.png',
      assessmentComplete: true,
      bigFive: {
        openness: 94,
        conscientiousness: 39,
        extraversion: 69,
        agreeableness: 58,
        neuroticism: 54,
      },
    },
    {
      id: 'jon',
      name: 'Jon Blomgren',
      role: 'Director, Studios',
      avatarUrl: '/team-dna/avatars/rainy-gu.png',
      assessmentComplete: true,
      bigFive: {
        openness: 84,
        conscientiousness: 61,
        extraversion: 76,
        agreeableness: 63,
        neuroticism: 33,
      },
    },
    {
      id: 'rainy',
      name: 'Rainy Gu',
      role: 'Research Scientist',
      avatarUrl: '/team-dna/avatars/rainy-gu-field.png',
      assessmentComplete: true,
      bigFive: {
        openness: 76,
        conscientiousness: 87,
        extraversion: 34,
        agreeableness: 69,
        neuroticism: 41,
      },
    },
  ],
  insights: {
    team: {
      id: 'team',
      eyebrow: 'Team',
      title: 'Flighthouse',
      isEditable: true,
      summary: [
        {
          text: "A team wired for momentum. Most members naturally push ideas forward rather than wait for permission. When Flighthouse believes in something, it moves fast. You generate energy around new initiatives and aren't afraid to rethink how things are done. This team's creative output punches well above its size.",
        },
      ],
      cards,
    },
    people: {
      sergio: {
        id: 'person-sergio',
        eyebrow: 'Sergio Canales',
        title: 'The Operator',
        summary: [
          {
            text: 'Sergio brings the kind of engineering leadership that turns ambiguity into a working path. He gives the team steadiness, sequence, and a sense of what can actually ship without draining the room.',
          },
        ],
        cards,
      },
      justin: {
        id: 'person-justin',
        eyebrow: 'Justin Schiff',
        title: 'The Systems Builder',
        summary: [
          {
            text: 'Justin is the person who can hold the whole stack in his head without making everyone else stare at the machinery. He brings technical depth, patience, and a bias toward sturdy decisions that survive contact with reality.',
          },
        ],
        cards,
      },
      darshan: {
        id: 'person-darshan',
        eyebrow: 'Darshan Bhatt',
        title: 'The Conductor',
        summary: [
          {
            text: 'Darshan helps the team coordinate across moving lanes. He brings operational clarity and enough relational awareness to keep the work connected across engineering, channels, and product direction.',
          },
        ],
        cards,
      },
      mae: {
        id: 'person-mae',
        eyebrow: 'Mae Gowda',
        title: 'The Sensemaker',
        summary: [
          {
            text: 'Mae sees the shape behind the mess. She brings design judgment, emotional read, and the ability to turn scattered inputs into a product story people can feel and follow.',
          },
        ],
        cards,
      },
      sam: {
        id: 'person-sam',
        eyebrow: 'Sam Ryu',
        title: 'The Strategist',
        summary: [
          {
            text: 'Sam gives momentum a direction. He can translate uncertainty into product bets, keep the team pointed at outcomes, and make the next decision feel less like a leap and more like a move.',
          },
        ],
        cards,
      },
      scott: {
        id: 'person-scott',
        eyebrow: 'Scott Baker',
        title: 'The Experience Architect',
        summary: [
          {
            text: 'Scott brings the learning lens that keeps the work from becoming merely functional. He sees how people grow through an experience and helps the team design for understanding, not just usage.',
          },
        ],
        cards,
      },
      sophie: {
        id: 'person-sophie',
        eyebrow: 'Sophie Yuan',
        title: 'The Quiet Finisher',
        summary: [
          {
            text: 'Sophie brings calm implementation gravity. She helps ideas become real through careful technical follow-through, and she makes complexity feel less noisy by steadily turning it into working software.',
          },
        ],
        cards,
      },
      rahul: {
        id: 'person-rahul',
        eyebrow: 'Rahul Ramath',
        title: 'The Innovator',
        summary: [
          { text: 'As an ' },
          { text: 'Innovator', emphasis: true },
          {
            text: ', Rahul asks "what if we didn\'t do it that way at all?" Rahul brings creative tension that keeps the team from settling into comfortable patterns. He processes out loud, thinks in possibilities, and has a knack for reframing problems in ways that open up better solutions.',
          },
        ],
        cards,
      },
      preetoshi: {
        id: 'person-preetoshi',
        eyebrow: 'Preetoshi',
        title: 'The Provocateur',
        summary: [
          {
            text: 'Preetoshi pushes the team toward the version of the work that feels alive. They bring taste, intensity, and a willingness to break inherited assumptions when the current frame is too small for the user experience.',
          },
        ],
        cards,
      },
      jon: {
        id: 'person-jon',
        eyebrow: 'Jon Blomgren',
        title: 'The Studio Lead',
        summary: [
          {
            text: 'Jon brings the connective charge of a studio leader. He can hold vision, energy, and team momentum at once, helping creative work feel ambitious without losing the people needed to make it real.',
          },
        ],
        cards,
      },
      rainy: {
        id: 'person-rainy',
        eyebrow: 'Rainy Gu',
        title: 'The Evidence Keeper',
        summary: [
          {
            text: 'Rainy gives the team a grounded relationship to what is actually true. She brings rigor, pattern recognition, and the ability to turn human behavior into evidence the team can design from.',
          },
        ],
        cards,
      },
    },
    pairs: {
      [makePairId('rahul', 'sergio')]: {
        id: 'pair-rahul-sergio',
        eyebrow: 'Rahul x Sergio',
        title: 'The Balancers',
        summary: [
          { text: 'Rahul', emphasis: true },
          { text: ', as an innovator, charges forward; ' },
          { text: 'Sergio', emphasis: true },
          {
            text: ', as an implementor, makes sure it lands. Together they create a rhythm of exploration and execution that neither brings alone. Ideas get bolder and more grounded when these two are in the room together.',
          },
        ],
        cards,
      },
    },
  },
};

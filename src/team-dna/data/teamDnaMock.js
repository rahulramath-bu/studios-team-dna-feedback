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
      name: 'Sergio Morales',
      avatarUrl: 'https://i.pravatar.cc/240?img=12',
      assessmentComplete: true,
      bigFive: {
        openness: 48,
        conscientiousness: 84,
        extraversion: 54,
        agreeableness: 58,
        neuroticism: 28,
      },
    },
    {
      id: 'nolan',
      name: 'Nolan Pierce',
      avatarUrl: 'https://i.pravatar.cc/240?img=11',
      assessmentComplete: true,
      bigFive: {
        openness: 57,
        conscientiousness: 78,
        extraversion: 44,
        agreeableness: 66,
        neuroticism: 36,
      },
    },
    {
      id: 'arjun',
      name: 'Arjun Mehta',
      avatarUrl: 'https://i.pravatar.cc/240?img=13',
      assessmentComplete: true,
      bigFive: {
        openness: 72,
        conscientiousness: 62,
        extraversion: 51,
        agreeableness: 47,
        neuroticism: 39,
      },
    },
    {
      id: 'mara',
      name: 'Mara Ellis',
      avatarUrl: 'https://i.pravatar.cc/240?img=47',
      assessmentComplete: true,
      bigFive: {
        openness: 68,
        conscientiousness: 55,
        extraversion: 42,
        agreeableness: 82,
        neuroticism: 61,
      },
    },
    {
      id: 'june',
      name: 'June Park',
      avatarUrl: 'https://i.pravatar.cc/240?img=32',
      assessmentComplete: true,
      bigFive: {
        openness: 74,
        conscientiousness: 69,
        extraversion: 38,
        agreeableness: 76,
        neuroticism: 44,
      },
    },
    {
      id: 'owen',
      name: 'Owen Clark',
      avatarUrl: 'https://i.pravatar.cc/240?img=60',
      assessmentComplete: true,
      bigFive: {
        openness: 41,
        conscientiousness: 73,
        extraversion: 36,
        agreeableness: 71,
        neuroticism: 31,
      },
    },
    {
      id: 'leon',
      name: 'Leon Hayes',
      avatarUrl: 'https://i.pravatar.cc/240?img=59',
      assessmentComplete: true,
      bigFive: {
        openness: 46,
        conscientiousness: 52,
        extraversion: 77,
        agreeableness: 64,
        neuroticism: 34,
      },
    },
    {
      id: 'mateo',
      name: 'Mateo Costa',
      avatarUrl: 'https://i.pravatar.cc/240?img=3',
      assessmentComplete: true,
      bigFive: {
        openness: 63,
        conscientiousness: 47,
        extraversion: 81,
        agreeableness: 45,
        neuroticism: 52,
      },
    },
    {
      id: 'rahul',
      name: 'Rahul Ramath',
      avatarUrl: 'https://i.pravatar.cc/240?img=68',
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
      id: 'imani',
      name: 'Imani Brooks',
      avatarUrl: 'https://i.pravatar.cc/240?img=50',
      assessmentComplete: true,
      bigFive: {
        openness: 79,
        conscientiousness: 57,
        extraversion: 69,
        agreeableness: 73,
        neuroticism: 43,
      },
    },
    {
      id: 'elliot',
      name: 'Elliot Price',
      avatarUrl: 'https://i.pravatar.cc/240?img=15',
      assessmentComplete: true,
      bigFive: {
        openness: 39,
        conscientiousness: 88,
        extraversion: 35,
        agreeableness: 49,
        neuroticism: 27,
      },
    },
    {
      id: 'sofia',
      name: 'Sofia Lin',
      avatarUrl: 'https://i.pravatar.cc/240?img=49',
      assessmentComplete: true,
      bigFive: {
        openness: 83,
        conscientiousness: 52,
        extraversion: 58,
        agreeableness: 86,
        neuroticism: 55,
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
      sergio: {
        id: 'person-sergio',
        eyebrow: 'Sergio Morales',
        title: 'The Implementor',
        summary: [
          {
            text: 'Sergio turns open questions into forward motion. He notices where ideas need structure, sequence, and a next concrete step. He keeps creative energy from becoming foggy by helping the team decide what can be tried now.',
          },
        ],
        cards,
      },
      mara: {
        id: 'person-mara',
        eyebrow: 'Mara Ellis',
        title: 'The Signal Finder',
        summary: [
          {
            text: 'Mara reads the emotional temperature of a room quickly. She catches weak signals early, names what feels unsaid, and helps the team make choices that people can actually stand behind.',
          },
        ],
        cards,
      },
      june: {
        id: 'person-june',
        eyebrow: 'June Park',
        title: 'The Synthesizer',
        summary: [
          {
            text: 'June connects ideas without flattening them. She can hold competing inputs, find the shared thread, and turn scattered thinking into a direction the team can rally around.',
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

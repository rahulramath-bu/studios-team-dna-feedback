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
    },
    {
      id: 'nolan',
      name: 'Nolan Pierce',
      avatarUrl: 'https://i.pravatar.cc/240?img=11',
      assessmentComplete: true,
    },
    {
      id: 'arjun',
      name: 'Arjun Mehta',
      avatarUrl: 'https://i.pravatar.cc/240?img=13',
      assessmentComplete: true,
    },
    {
      id: 'mara',
      name: 'Mara Ellis',
      avatarUrl: 'https://i.pravatar.cc/240?img=47',
      assessmentComplete: true,
    },
    {
      id: 'june',
      name: 'June Park',
      avatarUrl: 'https://i.pravatar.cc/240?img=32',
      assessmentComplete: true,
    },
    {
      id: 'owen',
      name: 'Owen Clark',
      avatarUrl: 'https://i.pravatar.cc/240?img=60',
      assessmentComplete: true,
    },
    {
      id: 'leon',
      name: 'Leon Hayes',
      avatarUrl: 'https://i.pravatar.cc/240?img=59',
      assessmentComplete: true,
    },
    {
      id: 'mateo',
      name: 'Mateo Costa',
      avatarUrl: 'https://i.pravatar.cc/240?img=3',
      assessmentComplete: true,
    },
    {
      id: 'rahul',
      name: 'Rahul Ramath',
      avatarUrl: 'https://i.pravatar.cc/240?img=68',
      assessmentComplete: true,
    },
    {
      id: 'imani',
      name: 'Imani Brooks',
      avatarUrl: 'https://i.pravatar.cc/240?img=50',
      assessmentComplete: true,
    },
    {
      id: 'elliot',
      name: 'Elliot Price',
      avatarUrl: 'https://i.pravatar.cc/240?img=15',
      assessmentComplete: true,
    },
    {
      id: 'sofia',
      name: 'Sofia Lin',
      avatarUrl: 'https://i.pravatar.cc/240?img=49',
      assessmentComplete: true,
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
    fallbackPair: {
      id: 'pair-fallback',
      eyebrow: 'Team pair',
      title: 'The Complement',
      summary: [
        {
          text: 'This pair creates useful contrast. One person tends to widen the field of possibilities while the other helps shape that energy into something the team can use. The value is not sameness; it is how their differences give the work more range.',
        },
      ],
      cards,
    },
  },
};

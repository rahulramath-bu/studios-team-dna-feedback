import { makeTeamDnaAiInsights } from './teamDnaAiSynthesis.js';

/**
 * Demo Team DNA dataset.
 *
 * What: realistic local sample team, avatar paths, Big Five scores, pronouns,
 * and the minimal card shell for the standalone prototype.
 * How: uses the same view-model shape the data adapter expects, so the UI can
 * generate team/person/duo insights from scores instead of handcrafted prose.
 * Port: do not ship these people, avatar paths, or guessed scores as product
 * data. Keep only the shape as a reference for the monolith API mapper.
 */
const team = {
  id: 'flighthouse',
  name: 'Flighthouse',
};

const members = [
    {
      id: 'sergio',
      name: 'Sergio Canales',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Manager, Engineering',
      avatarUrl: '/team-dna/avatars/sergio-canales.png',
      assessmentComplete: true,
      // Demo scores mirror provided Team DNA prototype outputs where available.
      // `neuroticism` is stored as emotional reactivity, so it inverses the
      // source "Emotional Stability" score.
      bigFive: {
        openness: 62,
        conscientiousness: 78,
        extraversion: 64,
        agreeableness: 74,
        neuroticism: 28,
      },
    },
    {
      id: 'justin',
      name: 'Justin Schiff',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Staff Full-Stack Engineer',
      avatarUrl: '/team-dna/avatars/justin-schiff.png',
      assessmentComplete: true,
      bigFive: {
        openness: 66,
        conscientiousness: 95,
        extraversion: 24,
        agreeableness: 42,
        neuroticism: 18,
      },
    },
    {
      id: 'darshan',
      name: 'Darshan Bhatt',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Manager, Engineering / Channel Manager',
      avatarUrl: '/team-dna/avatars/darshan-bhatt.png',
      assessmentComplete: true,
      bigFive: {
        openness: 94,
        conscientiousness: 92,
        extraversion: 86,
        agreeableness: 82,
        neuroticism: 16,
      },
    },
    {
      id: 'mae',
      name: 'Mae Gowda',
      pronouns: { subject: 'she', object: 'her', possessive: 'her' },
      role: 'Principal Product Designer',
      avatarUrl: '/team-dna/avatars/mae-gowda.png',
      assessmentComplete: true,
      bigFive: {
        openness: 92,
        conscientiousness: 52,
        extraversion: 38,
        agreeableness: 80,
        neuroticism: 52,
      },
    },
    {
      id: 'sam',
      name: 'Sam Ryu',
      pronouns: { subject: 'she', object: 'her', possessive: 'her' },
      role: 'Director, Product Management',
      avatarUrl: '/team-dna/avatars/sam-ryu.png',
      assessmentComplete: true,
      bigFive: {
        openness: 55,
        conscientiousness: 74,
        extraversion: 70,
        agreeableness: 84,
        neuroticism: 86,
      },
    },
    {
      id: 'scott',
      name: 'Scott Baker',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Director, Learning Experience Design',
      avatarUrl: '/team-dna/avatars/scott-baker.png',
      assessmentComplete: true,
      bigFive: {
        openness: 84,
        conscientiousness: 50,
        extraversion: 26,
        agreeableness: 90,
        neuroticism: 12,
      },
    },
    {
      id: 'sophie',
      name: 'Sophie Yuan',
      pronouns: { subject: 'she', object: 'her', possessive: 'her' },
      role: 'Full-Stack Engineer',
      avatarUrl: '/team-dna/avatars/rahul-ramath.png',
      assessmentComplete: true,
      bigFive: {
        openness: 74,
        conscientiousness: 96,
        extraversion: 50,
        agreeableness: 94,
        neuroticism: 32,
      },
    },
    {
      id: 'rahul',
      name: 'Rahul Ramath',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Staff Product Designer, Apps',
      avatarUrl: '/team-dna/avatars/preetoshi.png',
      assessmentComplete: true,
      bigFive: {
        openness: 90,
        conscientiousness: 24,
        extraversion: 42,
        agreeableness: 58,
        neuroticism: 24,
      },
    },
    {
      id: 'preetoshi',
      name: 'Preetoshi',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Senior Experience Designer, BetterUp Studio',
      avatarUrl: '/team-dna/avatars/jon-blomgren.png',
      assessmentComplete: true,
      bigFive: {
        openness: 98,
        conscientiousness: 22,
        extraversion: 78,
        agreeableness: 46,
        neuroticism: 60,
      },
    },
    {
      id: 'jon',
      name: 'Jon Blomgren',
      pronouns: { subject: 'he', object: 'him', possessive: 'his' },
      role: 'Director, Studios',
      avatarUrl: '/team-dna/avatars/rainy-gu.png',
      assessmentComplete: true,
      bigFive: {
        openness: 88,
        conscientiousness: 66,
        extraversion: 76,
        agreeableness: 38,
        neuroticism: 24,
      },
    },
    {
      id: 'rainy',
      name: 'Rainy Gu',
      pronouns: { subject: 'she', object: 'her', possessive: 'her' },
      role: 'Research Scientist',
      avatarUrl: '/team-dna/avatars/rainy-gu-field.png',
      assessmentComplete: true,
      bigFive: {
        openness: 96,
        conscientiousness: 86,
        extraversion: 22,
        agreeableness: 78,
        neuroticism: 14,
      },
    },
  ];

const aiInsights = makeTeamDnaAiInsights({ team, members });

export const teamDnaDataset = {
  team,
  members,
  insights: {
    team: aiInsights.team,
    people: aiInsights.people,
    pairs: aiInsights.pairs,
  },
};

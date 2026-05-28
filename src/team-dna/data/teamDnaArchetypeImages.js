import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';
import { getCombinedFallbackRole } from './teamDnaFallbackRoles.js';
import { buildTeamShapeContributions } from './teamDnaTeamShape.js';

const ARCHETYPE_IMAGE_URLS = {
  'systems-innovator': new URL(
    '../assets/archetype-images/systems-innovator.jpg',
    import.meta.url
  ).href,
  'adaptive-inventor': new URL(
    '../assets/archetype-images/adaptive-inventor.jpg',
    import.meta.url
  ).href,
  'practical-implementer': new URL(
    '../assets/archetype-images/practical-implementer.jpg',
    import.meta.url
  ).href,
  'flexible-stabilizer': new URL(
    '../assets/archetype-images/flexible-stabilizer.jpg',
    import.meta.url
  ).href,
  'energizing-innovator': new URL(
    '../assets/archetype-images/energizing-innovator.jpg',
    import.meta.url
  ).href,
  'quiet-inventor': new URL(
    '../assets/archetype-images/quiet-inventor.jpg',
    import.meta.url
  ).href,
  'practical-mobilizer': new URL(
    '../assets/archetype-images/practical-mobilizer.jpg',
    import.meta.url
  ).href,
  'grounded-synthesizer': new URL(
    '../assets/archetype-images/grounded-synthesizer.jpg',
    import.meta.url
  ).href,
  'inclusive-innovator': new URL(
    '../assets/archetype-images/inclusive-innovator.jpg',
    import.meta.url
  ).href,
  'constructive-challenger': new URL(
    '../assets/archetype-images/constructive-challenger.jpg',
    import.meta.url
  ).href,
  'grounded-harmonizer': new URL(
    '../assets/archetype-images/grounded-harmonizer.jpg',
    import.meta.url
  ).href,
  'reality-tester': new URL(
    '../assets/archetype-images/reality-tester.jpg',
    import.meta.url
  ).href,
  'risk-sensing-innovator': new URL(
    '../assets/archetype-images/risk-sensing-innovator.jpg',
    import.meta.url
  ).href,
  'calm-explorer': new URL(
    '../assets/archetype-images/calm-explorer.jpg',
    import.meta.url
  ).href,
  'practical-sentinel': new URL(
    '../assets/archetype-images/practical-sentinel.jpg',
    import.meta.url
  ).href,
  'steady-pragmatist': new URL(
    '../assets/archetype-images/steady-pragmatist.jpg',
    import.meta.url
  ).href,
  'action-organizer': new URL(
    '../assets/archetype-images/action-organizer.jpg',
    import.meta.url
  ).href,
  'quiet-implementer': new URL(
    '../assets/archetype-images/quiet-implementer.jpg',
    import.meta.url
  ).href,
  'agile-mobilizer': new URL(
    '../assets/archetype-images/agile-mobilizer.jpg',
    import.meta.url
  ).href,
  'responsive-synthesizer': new URL(
    '../assets/archetype-images/responsive-synthesizer.jpg',
    import.meta.url
  ).href,
  'collaborative-implementer': new URL(
    '../assets/archetype-images/collaborative-implementer.jpg',
    import.meta.url
  ).href,
  'standards-setter': new URL(
    '../assets/archetype-images/standards-setter.jpg',
    import.meta.url
  ).href,
  'flexible-harmonizer': new URL(
    '../assets/archetype-images/flexible-harmonizer.jpg',
    import.meta.url
  ).href,
  'adaptive-challenger': new URL(
    '../assets/archetype-images/adaptive-challenger.jpg',
    import.meta.url
  ).href,
  'prepared-implementer': new URL(
    '../assets/archetype-images/prepared-implementer.jpg',
    import.meta.url
  ).href,
  'steady-finisher': new URL(
    '../assets/archetype-images/steady-finisher.jpg',
    import.meta.url
  ).href,
  'adaptive-sentinel': new URL(
    '../assets/archetype-images/adaptive-sentinel.jpg',
    import.meta.url
  ).href,
  'calm-improviser': new URL(
    '../assets/archetype-images/calm-improviser.jpg',
    import.meta.url
  ).href,
  'team-energizer': new URL(
    '../assets/archetype-images/team-energizer.jpg',
    import.meta.url
  ).href,
  'direct-mobilizer': new URL(
    '../assets/archetype-images/direct-mobilizer.jpg',
    import.meta.url
  ).href,
  'reflective-connector': new URL(
    '../assets/archetype-images/reflective-connector.jpg',
    import.meta.url
  ).href,
  'quiet-challenger': new URL(
    '../assets/archetype-images/quiet-challenger.jpg',
    import.meta.url
  ).href,
  'alert-mobilizer': new URL(
    '../assets/archetype-images/alert-mobilizer.jpg',
    import.meta.url
  ).href,
  'steady-mobilizer': new URL(
    '../assets/archetype-images/steady-mobilizer.jpg',
    import.meta.url
  ).href,
  'vigilant-synthesizer': new URL(
    '../assets/archetype-images/vigilant-synthesizer.jpg',
    import.meta.url
  ).href,
  'calm-synthesizer': new URL(
    '../assets/archetype-images/calm-synthesizer.jpg',
    import.meta.url
  ).href,
  'protective-harmonizer': new URL(
    '../assets/archetype-images/protective-harmonizer.jpg',
    import.meta.url
  ).href,
  'steady-harmonizer': new URL(
    '../assets/archetype-images/steady-harmonizer.jpg',
    import.meta.url
  ).href,
  'candid-sentinel': new URL(
    '../assets/archetype-images/candid-sentinel.jpg',
    import.meta.url
  ).href,
  'calm-challenger': new URL(
    '../assets/archetype-images/calm-challenger.jpg',
    import.meta.url
  ).href,
};

function getTraitDirection(score) {
  if (score >= 67) {
    return 'high';
  }

  if (score <= 33) {
    return 'low';
  }

  return 'middle';
}

function getRankedSignals(member) {
  const scores = member?.bigFive ?? {};

  return BIG_FIVE_TRAITS.map((trait) => {
    const score = scores[trait.key] ?? 50;

    return {
      trait: trait.key,
      score,
      direction: getTraitDirection(score),
      distance: Math.abs(score - 50),
    };
  }).sort((a, b) => b.distance - a.distance);
}

export function getArchetypeImageForMember(member) {
  const [primary, secondary] = getRankedSignals(member);
  const role = getCombinedFallbackRole(primary, secondary);
  const imageUrl = role?.slug ? ARCHETYPE_IMAGE_URLS[role.slug] : null;

  if (!role || !imageUrl) {
    return null;
  }

  return {
    ...role,
    imageUrl,
    alt: `${role.title} abstract role illustration`,
  };
}

export function getArchetypeImageForTeam(members) {
  const contributions = buildTeamShapeContributions(members);
  const images = contributions
    .flatMap((contribution) => contribution.members)
    .map((member) => getArchetypeImageForMember(member))
    .filter(Boolean)
    .filter(
      (image, index, allImages) =>
        allImages.findIndex((entry) => entry.slug === image.slug) === index
    )
    .slice(0, 3);

  return {
    key: 'team-shape',
    slug: 'team-shape',
    title: 'Team Shape',
    alt: 'Abstract team shape illustration',
    images,
    contributions,
  };
}

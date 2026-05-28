/**
 * Team DNA frontend view-model contract.
 *
 * This file is intentionally type-only. The standalone prototype is plain JS,
 * but the monolith port should turn this contract into real TypeScript types
 * near the generated API adapter.
 *
 * The important rule: UI components consume this normalized shape, not raw
 * backend responses. Mock fixture data, deterministic fallback copy, and future
 * AI-generated insight payloads should all map into this same contract.
 */

export type TeamDnaTraitKey =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism';

export type TeamDnaInsightSource = 'deterministic' | 'ai' | 'override';
export type TeamDnaGenerationStatus =
  | 'not_ready'
  | 'pending'
  | 'ready'
  | 'failed'
  | 'stale';

export type TeamDnaPronouns = {
  subject: string;
  object: string;
  possessive: string;
};

export type TeamDnaBigFiveScores = Record<TeamDnaTraitKey, number>;

export type TeamDnaTeam = {
  id: string;
  name: string;
  meta?: Record<string, unknown>;
};

export type TeamDnaMember = {
  id: string;
  name: string;
  pronouns?: TeamDnaPronouns;
  role?: string;
  avatarUrl?: string | null;
  assessmentComplete: boolean;
  bigFive?: TeamDnaBigFiveScores;
  meta?: Record<string, unknown>;
};

export type TeamDnaInsightSummaryPart = {
  text: string;
  emphasis?: boolean;
};

export type TeamDnaBigFiveBloomCard = {
  id: string;
  kind: 'bigFiveBloom';
  label: string;
  showLabel?: boolean;
  data: {
    subjects: TeamDnaMember[];
    traits?: unknown;
  };
};

export type TeamDnaBigFiveSpectrumCard = {
  id: string;
  kind: 'bigFiveSpectrumList';
  label: string;
  showLabel?: boolean;
  data: {
    subjects: TeamDnaMember[];
    traits?: unknown;
    reads?: Partial<Record<TeamDnaTraitKey, string>>;
  };
};

export type TeamDnaArchetypeImageCard = {
  id: string;
  kind: 'archetypeImage';
  label: string;
  showLabel?: boolean;
  data: {
    image: {
      key?: string;
      slug?: string;
      title?: string;
      imageUrl?: string;
      alt?: string;
      images?: Array<{
        key: string;
        slug: string;
        title: string;
        imageUrl: string;
        alt?: string;
      }>;
      contributions?: Array<{
        key: string;
        label: string;
        description: string;
        members: TeamDnaMember[];
      }>;
    };
  };
};

export type TeamDnaTeamShapeContributionsCard = {
  id: string;
  kind: 'teamShapeContributions';
  label: string;
  showLabel?: boolean;
  data: {
    contributions: Array<{
      key: string;
      label: string;
      description: string;
      members: TeamDnaMember[];
    }>;
  };
};

export type TeamDnaWatchOutItem = {
  traitKey: string;
  type?: 'deterministic' | 'ai' | 'override';
  title: string;
  body: string;
};

export type TeamDnaWatchOutCard = {
  id: string;
  kind: 'watchOut';
  label: string;
  showLabel?: boolean;
  data: {
    watchOut: {
      items: TeamDnaWatchOutItem[];
    };
  };
};

export type TeamDnaMeetingBehaviorCard = {
  id: string;
  kind: 'meetingBehavior';
  label: string;
  showLabel?: boolean;
  data: {
    meetingBehavior: {
      items: TeamDnaWatchOutItem[];
    };
  };
};

export type TeamDnaGuidanceSection = {
  label?: string;
  body: string;
};

export type TeamDnaGuidanceCard = {
  id: string;
  kind: 'guidance';
  label: string;
  showLabel?: boolean;
  iconName?: string;
  data: {
    guidance: {
      sections: TeamDnaGuidanceSection[];
    };
  };
};

export type TeamDnaInsightCard =
  | TeamDnaBigFiveBloomCard
  | TeamDnaBigFiveSpectrumCard
  | TeamDnaArchetypeImageCard
  | TeamDnaTeamShapeContributionsCard
  | TeamDnaWatchOutCard
  | TeamDnaMeetingBehaviorCard
  | TeamDnaGuidanceCard;

export type TeamDnaInsight = {
  id: string;
  source?: TeamDnaInsightSource;
  generatedAt?: string;
  inputVersion?: string;
  generationLifecycle?: {
    status: TeamDnaGenerationStatus;
    target: {
      id: string;
      scope: 'team' | 'person' | 'duo';
      teamId: string;
      memberIds: string[];
      completedCount: number;
      totalCount: number;
      minimumCompletedCount: number;
      canGenerateTeam: boolean;
      canGenerateTeamEarly: boolean;
    };
    isPrototypeSimulation?: boolean;
  };
  eyebrow: string;
  title: string;
  entityEyebrow?: string;
  entityTitle?: string;
  isEditable?: boolean;
  summary: TeamDnaInsightSummaryPart[];
  spectrumReads?: Partial<Record<TeamDnaTraitKey, string>>;
  watchOut?: {
    items: TeamDnaWatchOutItem[];
  };
  meetingBehavior?: {
    items: TeamDnaWatchOutItem[];
  };
  cards: TeamDnaInsightCard[];
};

export type TeamDnaDataset = {
  team: TeamDnaTeam;
  members: TeamDnaMember[];
  insights: {
    team?: TeamDnaInsight;
    people?: Record<string, TeamDnaInsight>;
    pairs?: Record<string, TeamDnaInsight>;
  };
};

export type TeamDnaSelection = [] | [string] | [string, string];

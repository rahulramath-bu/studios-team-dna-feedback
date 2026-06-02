import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from 'motion/react';
import { BetterUpIcon } from '../team-dna/components/BetterUpIcon.jsx';
import { InsightPanel } from '../team-dna/components/InsightPanel.jsx';
import { getInsightForSelection } from '../team-dna/data/teamDnaAdapter.js';
import { useTeamDnaPressable } from '../team-dna/hooks/useTeamDnaPressable.js';
import {
  IMAGE_BREAK_URLS,
  LIKERT_OPTIONS,
  TEAM_DNA_ASSESSMENT_STORAGE_KEY,
  buildAssessmentSteps,
  generateTeamDnaProfile,
  scoreBigFive,
  scoreWorkingStyle,
  serializeAssessmentEnginePayload,
} from './teamDnaAssessmentModel.js';
import { HalftoneHand } from './HalftoneHand.jsx';
import {
  OnboardingFaceCluster,
  OnboardingTraitPreview,
} from './OnboardingVisuals.jsx';
import { TeamDnaEmptyPreview } from '../team-dna/components/TeamDnaEmptyPreview.jsx';
import './teamDnaAssessment.css';

const FLOW_STEPS = {
  ACCOUNT: 'account',
  VALUE: 'value',
  WELCOME: 'welcome',
  QUESTIONS: 'questions',
  AVATAR: 'avatar',
  PROCESSING: 'processing',
  REVIEW: 'review',
};

const SOUNDS = {
  cardSelect: '/sounds/card-select.wav',
  optionShow: '/sounds/option-show.wav',
  click: '/sounds/click.wav',
  loadingComplete: '/sounds/loading-complete.wav',
};
const DEMO_AVATAR_URL = '/team-dna/avatars/demo-indian-woman.png';

const QUESTION_FADE = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};

const CAPTURE_COUNTDOWN_START = 3;
const CAPTURE_TICK_MS = 1200;
const CAPTURE_ABSORB_MS = 1400;
const CAPTURE_FLASH_MS = 180;
const CAPTURE_FREEZE_MS = 900;
const PHOTO_INTRO_MS = 1160;
const SNAPSHOT_QUALITY = 0.92;
const LIKERT_ADVANCE_MS = 260;
const IMAGE_CHOICE_ADVANCE_MS = 430;
const INTERSTITIAL_HOLD_MS = 520;
const INTERSTITIAL_LETTER_STAGGER_MS = 22;
const INTERSTITIAL_LETTER_FADE_MS = 240;
const PROGRESS_FORWARD_DURATION_S = 0.5;
const PROFILE_GENERATION_MS = 850;
const PROFILE_LOADER_MIN_DWELL_MS = 1800;
const PROFILE_LOADER_COMPLETION_HOLD_MS = 1180;
const LIKERT_FAN = [
  { rotate: -4.2, x: -18, y: 20 },
  { rotate: -2.1, x: -9, y: 6 },
  { rotate: 0, x: 0, y: 0 },
  { rotate: 2.1, x: 9, y: 6 },
  { rotate: 4.2, x: 18, y: 20 },
];
const LIKERT_STACK_SPACING = 288;
const BIG_FIVE_HIGHLIGHTS = {
  tdna_b5_extraversion_1: 'energy',
  tdna_b5_agreeableness_1: 'included',
  tdna_b5_conscientiousness_1: 'clear plan',
  tdna_b5_neuroticism_1: 'potential problems',
  tdna_b5_openness_1: 'new ideas',
  tdna_b5_extraversion_2: 'keep my thoughts',
  tdna_b5_agreeableness_2: 'challenge ideas',
  tdna_b5_conscientiousness_2: 'details open',
  tdna_b5_neuroticism_2: 'stay calm',
  tdna_b5_openness_2: 'familiar approaches',
  tdna_b5_extraversion_3: 'out loud',
  tdna_b5_agreeableness_3: 'common ground',
  tdna_b5_conscientiousness_3: 'follow through',
  tdna_b5_neuroticism_3: 'unresolved',
  tdna_b5_openness_3: 'connect ideas',
  tdna_b5_extraversion_4: 'quiet time',
  tdna_b5_agreeableness_4: 'does not make sense',
  tdna_b5_conscientiousness_4: 'without much structure',
  tdna_b5_neuroticism_4: 'rarely worry',
  tdna_b5_openness_4: 'already works',
};

const ROLE_IMAGE_SIGNALS = {
  Mobilizer: ['extraversion', 'high'],
  'Reflective Synthesizer': ['extraversion', 'low'],
  Innovator: ['openness', 'high'],
  'Practical Stabilizer': ['openness', 'low'],
  Implementer: ['conscientiousness', 'high'],
  'Adaptive Responder': ['conscientiousness', 'low'],
  Harmonizer: ['agreeableness', 'high'],
  'Candid Challenger': ['agreeableness', 'low'],
  'Steadying Presence': ['neuroticism', 'low'],
  'Vigilant Sentinel': ['neuroticism', 'high'],
};

function useAssessmentSound(src, volume = 0.35) {
  const audioRef = useRef(null);

  return useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [src, volume]);
}

function readStoredDraft() {
  if (typeof window === 'undefined') return null;
  if (!window.localStorage) return null;
  const params = new URLSearchParams(window.location.search);
  if (params.has('fresh') || params.has('welcome') || params.has('demo')) return null;

  try {
    return JSON.parse(
      window.localStorage.getItem(TEAM_DNA_ASSESSMENT_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function getAssessmentDemoMode() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('demo') ?? '';
}

function getAssessmentDemoQuestionIndex(total) {
  if (typeof window === 'undefined') return 0;
  const params = new URLSearchParams(window.location.search);
  const requestedIndex = Number(params.get('q'));

  if (!Number.isFinite(requestedIndex)) return 0;
  return Math.max(0, Math.min(total - 1, requestedIndex));
}

function buildDemoResponses(steps) {
  const values = {};

  steps.forEach((step, index) => {
    if (step.kind === 'workingStyle') {
      values[step.id] = index % 2 === 0 ? 68 : 38;
      return;
    }

    if (step.kind === 'imageChoice') {
      values[step.id] = step.item.options[index % step.item.options.length]?.id;
      return;
    }

    if (step.kind === 'interstitial') {
      values[step.id] = true;
      return;
    }

    values[step.id] = [5, 4, 2, 3, 4][index % 5];
  });

  return values;
}

function buildDemoResponsesBeforeStep(steps, activeIndex) {
  return Object.fromEntries(
    Object.entries(buildDemoResponses(steps)).filter(([stepId]) => {
      const stepIndex = steps.findIndex((step) => step.id === stepId);
      return stepIndex >= 0 && stepIndex < activeIndex;
    })
  );
}

function writeStoredDraft(draft) {
  if (typeof window === 'undefined') return;
  if (!window.localStorage) return;
  try {
    window.localStorage.setItem(
      TEAM_DNA_ASSESSMENT_STORAGE_KEY,
      JSON.stringify(draft)
    );
  } catch {
    // Prototype persistence is best-effort. The monolith port should persist
    // with authenticated API mutations instead of browser storage.
  }
}

function clearStoredDraft() {
  if (typeof window === 'undefined') return;
  if (!window.localStorage) return;
  window.localStorage.removeItem(TEAM_DNA_ASSESSMENT_STORAGE_KEY);
}

function copyText(value) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(value);
}

function preloadImageUrls(urls) {
  if (typeof window === 'undefined') return;

  urls
    .filter(Boolean)
    .forEach((url) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
    });
}

function collectInsightImageUrls(insight) {
  return insight.cards.flatMap((card) => {
    if (card.kind !== 'archetypeImage') return [];

    const image = card.data?.image;
    const images = image?.images?.length ? image.images : image ? [image] : [];

    return images.map((entry) => entry.imageUrl).filter(Boolean);
  });
}

function buildArchetypeImageScores(roles, bigFive) {
  const imageScores = { ...bigFive };
  const roleNames = [roles?.primary, roles?.secondary].filter(Boolean);

  roleNames.forEach((roleName, index) => {
    const [traitKey, pole] = ROLE_IMAGE_SIGNALS[roleName] ?? [];
    if (!traitKey || !pole) return;

    imageScores[traitKey] =
      pole === 'high'
        ? index === 0 ? 86 : 74
        : index === 0 ? 14 : 26;
  });

  return imageScores;
}

/**
 * Surface 1 standalone route.
 *
 * What: real local Team DNA assessment flow with the same product seams the
 * monolith implementation will need: assessment answers, avatar capture,
 * generated profile review, and privacy choices.
 * How: stores only a prototype draft in localStorage. The assessment payload is
 * shaped like monolith `responses` while avatar/profile/privacy stay outside
 * the submitted assessment because submitted assessments cannot be freely
 * edited.
 * Port: replace localStorage with authenticated API mutations, replace the
 * deterministic generator with the server-side Team DNA profile generation
 * endpoint, and replace prototype item IDs with real AssessmentItem keys.
 */
export function TeamDnaAssessmentPage({ onNavigate }) {
  const pageRef = useRef(null);
  const confirmPressTargetRef = useRef(null);
  const skipNextPersistRef = useRef(false);
  const assessmentSteps = useMemo(() => buildAssessmentSteps(), []);
  const demoMode = useMemo(getAssessmentDemoMode, []);
  const isDemoMode = Boolean(demoMode);
  const demoResponses = useMemo(
    () => buildDemoResponses(assessmentSteps),
    [assessmentSteps]
  );
  const demoVisibleResponses = useMemo(
    () =>
      demoMode === 'questions'
        ? buildDemoResponsesBeforeStep(
            assessmentSteps,
            getAssessmentDemoQuestionIndex(assessmentSteps.length)
          )
        : demoMode === 'review'
          ? demoResponses
          : {},
    [assessmentSteps, demoMode, demoResponses]
  );
  const demoProfile = useMemo(() => {
    if (demoMode !== 'review') return null;

    return generateTeamDnaProfile({
      bigFive: scoreBigFive(demoResponses),
      workingStyle: scoreWorkingStyle(demoResponses),
      name: 'Jordan',
      avatarDataUrl: DEMO_AVATAR_URL,
    });
  }, [demoMode, demoResponses]);
  const storedDraft = useMemo(readStoredDraft, []);
  const [flowStep, setFlowStep] = useState(
    () => {
      if (demoMode === 'account') return FLOW_STEPS.ACCOUNT;
      if (demoMode === 'value') return FLOW_STEPS.VALUE;
      if (demoMode === 'welcome') return FLOW_STEPS.WELCOME;
      if (demoMode === 'questions') return FLOW_STEPS.QUESTIONS;
      if (demoMode === 'avatar') return FLOW_STEPS.AVATAR;
      if (demoMode === 'processing') return FLOW_STEPS.PROCESSING;
      if (demoMode === 'review') return FLOW_STEPS.REVIEW;
      if (storedDraft?.profile) return FLOW_STEPS.REVIEW;
      // A fresh start opens the onboarding (account → value → welcome) before
      // the quiz so the user journey begins with sign-up + the value framing.
      return FLOW_STEPS.ACCOUNT;
    }
  );
  const [questionIndex, setQuestionIndex] = useState(
    () =>
      demoMode === 'questions'
        ? getAssessmentDemoQuestionIndex(assessmentSteps.length)
        : 0
  );
  const [responses, setResponses] = useState(
    () => (isDemoMode ? demoVisibleResponses : storedDraft?.responses ?? {})
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState(
    () =>
      demoMode === 'avatar' || demoMode === 'review'
        ? DEMO_AVATAR_URL
        : storedDraft?.avatarDataUrl ?? ''
  );
  const [profile, setProfile] = useState(
    () => demoProfile ?? storedDraft?.profile ?? null
  );
  const [profileReady, setProfileReady] = useState(() => demoMode === 'processing');
  const [profileCopy, setProfileCopy] = useState(
    () => demoProfile?.copy ?? storedDraft?.profile?.copy ?? {}
  );
  const seenInterstitialIdsRef = useRef(new Set());
  const [privacy, setPrivacy] = useState(() => ({
    profileVisibility:
      storedDraft?.privacy?.profileVisibility ??
      storedDraft?.profile?.meta?.profileVisibility ??
      'teams',
    pairComparisonVisibility:
      storedDraft?.privacy?.pairComparisonVisibility ??
      storedDraft?.profile?.meta?.pairComparisonVisibility ??
      'teams',
  }));
  const [debugOpen, setDebugOpen] = useState(false);
  const playOptionShow = useAssessmentSound(SOUNDS.optionShow, 0.3);
  const playCardSelect = useAssessmentSound(SOUNDS.cardSelect, 0.4);
  const playClick = useAssessmentSound(SOUNDS.click, 0.25);
  const currentQuestion = assessmentSteps[questionIndex];
  const answeredCount = assessmentSteps.filter((step) =>
    responses[step.id] !== undefined
  ).length;
  const progress = currentQuestion
    ? ((questionIndex + 1) / assessmentSteps.length) * 100
    : 100;
  const bigFive = useMemo(() => scoreBigFive(responses), [responses]);
  const workingStyle = useMemo(() => scoreWorkingStyle(responses), [responses]);
  const assessmentEnginePayload = useMemo(
    () => serializeAssessmentEnginePayload(responses),
    [responses]
  );
  const debugPayload = useMemo(
    () => ({
      flowStep,
      questionIndex,
      answeredCount,
      assessmentEnginePayload,
      bigFive,
      workingStyle,
      avatar: {
        hasAvatar: Boolean(avatarDataUrl),
        persistence: 'localStorage prototype; monolith should use profile avatar upload pipeline',
      },
      generatedProfile: profile
        ? {
            ...profile,
            copy: profileCopy,
            meta: {
              ...profile.meta,
              ...privacy,
            },
          }
        : null,
    }),
    [
      answeredCount,
      assessmentEnginePayload,
      avatarDataUrl,
      bigFive,
      flowStep,
      privacy,
      profile,
      profileCopy,
      questionIndex,
      workingStyle,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '\\') {
        setDebugOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When this page runs inside the demo viewer iframe, report progress so the
  // demo control panel can follow along as the user clicks through the real
  // surface (not just when they use the demo's own next/prev controls).
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;
    window.parent.postMessage(
      {
        type: 'team-dna-demo-progress',
        demo: flowStep,
        q: questionIndex,
      },
      '*'
    );
  }, [flowStep, questionIndex]);

  useEffect(() => {
    const pageNode = pageRef.current;
    if (!pageNode) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target.closest(
        'button, label, input[type="range"], [data-press-sound], [data-confirm-sound]'
      );
      if (!target || !pageNode.contains(target)) return;
      if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;

      confirmPressTargetRef.current = target.dataset.confirmSound
        ? target
        : null;
      const sound = target.dataset.pressSound ?? 'click';
      if (sound === 'none') return;
      if (sound === 'select') {
        playCardSelect();
        return;
      }
      playClick();
    };
    const handlePointerUp = (event) => {
      const confirmTarget = confirmPressTargetRef.current;
      confirmPressTargetRef.current = null;
      if (!confirmTarget || !pageNode.contains(confirmTarget)) return;
      if (
        event.target !== confirmTarget &&
        !confirmTarget.contains(event.target)
      ) {
        return;
      }

      if (confirmTarget.dataset.confirmSound === 'select') {
        playCardSelect();
      }
    };
    const handlePointerCancel = () => {
      confirmPressTargetRef.current = null;
    };

    pageNode.addEventListener('pointerdown', handlePointerDown, true);
    pageNode.addEventListener('pointerup', handlePointerUp, true);
    pageNode.addEventListener('pointercancel', handlePointerCancel, true);
    return () => {
      pageNode.removeEventListener('pointerdown', handlePointerDown, true);
      pageNode.removeEventListener('pointerup', handlePointerUp, true);
      pageNode.removeEventListener('pointercancel', handlePointerCancel, true);
    };
  }, [playCardSelect, playClick]);

  useEffect(() => {
    if (flowStep !== FLOW_STEPS.QUESTIONS || !currentQuestion) return undefined;

    const timer = window.setTimeout(playOptionShow, 180);
    return () => window.clearTimeout(timer);
  }, [currentQuestion?.id, flowStep, playOptionShow]);

  useEffect(() => {
    preloadImageUrls(IMAGE_BREAK_URLS);
  }, []);

  useEffect(() => {
    if (isDemoMode) return;

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    writeStoredDraft({
      responses,
      avatarDataUrl,
      profile: profile
        ? {
            ...profile,
            avatarDataUrl,
            copy: profileCopy,
            meta: {
              ...profile.meta,
              ...privacy,
            },
          }
        : null,
      privacy,
      updatedAt: new Date().toISOString(),
    });
  }, [avatarDataUrl, isDemoMode, privacy, profile, profileCopy, responses]);

  const resetStoredAssessment = () => {
    skipNextPersistRef.current = true;
    clearStoredDraft();
    seenInterstitialIdsRef.current.clear();
    setFlowStep(FLOW_STEPS.WELCOME);
    setQuestionIndex(0);
    setResponses({});
    setAvatarDataUrl('');
    setProfile(null);
    setProfileReady(false);
    setProfileCopy({});
    setPrivacy({
      profileVisibility: 'teams',
      pairComparisonVisibility: 'teams',
    });
    setDebugOpen(false);
  };

  const setResponse = (questionId, value) => {
    setResponses((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const goToNextQuestion = () => {
    let nextIndex = questionIndex + 1;

    while (
      nextIndex < assessmentSteps.length &&
      assessmentSteps[nextIndex]?.kind === 'interstitial' &&
      seenInterstitialIdsRef.current.has(assessmentSteps[nextIndex].id)
    ) {
      nextIndex += 1;
    }

    if (nextIndex < assessmentSteps.length) {
      setQuestionIndex(nextIndex);
      return;
    }

    setFlowStep(FLOW_STEPS.AVATAR);
  };

  const goToPreviousQuestion = () => {
    if (questionIndex > 0) {
      let previousIndex = questionIndex - 1;

      while (
        previousIndex > 0 &&
        assessmentSteps[previousIndex]?.kind === 'interstitial'
      ) {
        previousIndex -= 1;
      }

      setQuestionIndex(previousIndex);
      return;
    }

    setFlowStep(FLOW_STEPS.WELCOME);
  };

  const startProcessing = () => {
    setProfileReady(false);
    setFlowStep(FLOW_STEPS.PROCESSING);

    window.setTimeout(() => {
      const nextProfile = generateTeamDnaProfile({
        bigFive,
        workingStyle,
        name: 'Jordan',
        avatarDataUrl,
      });
      setProfile(nextProfile);
      setProfileCopy(nextProfile.copy);
      setPrivacy({
        profileVisibility: 'teams',
        pairComparisonVisibility: 'teams',
      });
      setProfileReady(true);
    }, PROFILE_GENERATION_MS);
  };

  const saveAndContinue = () => {
    const nextProfile = {
      ...profile,
      avatarDataUrl,
      copy: profileCopy,
      meta: {
        ...(profile?.meta ?? {}),
        ...privacy,
        savedAt: new Date().toISOString(),
      },
    };

    setProfile(nextProfile);
    writeStoredDraft({
      responses,
      avatarDataUrl,
      profile: nextProfile,
      privacy,
      updatedAt: new Date().toISOString(),
    });
    // After finishing the assessment, land directly on a populated team read
    // rather than the empty team page, so the direct-report flow continues
    // straight into the team view.
    onNavigate('/team-dna?demo=team');
  };

  return (
    <main
      ref={pageRef}
      className="team-dna-assessment-page"
      aria-label="Team DNA assessment"
    >
      {flowStep === FLOW_STEPS.QUESTIONS && (
        <AssessmentProgress
          current={questionIndex + 1}
          total={assessmentSteps.length}
          progress={progress}
        />
      )}

      <AnimatePresence mode="wait">
        {flowStep === FLOW_STEPS.ACCOUNT && (
          <AccountStep
            key="account"
            onContinue={() => setFlowStep(FLOW_STEPS.VALUE)}
          />
        )}

        {flowStep === FLOW_STEPS.VALUE && (
          <ValueStep
            key="value"
            onStart={() => setFlowStep(FLOW_STEPS.WELCOME)}
          />
        )}

        {flowStep === FLOW_STEPS.WELCOME && (
          <WelcomeStep
            key="welcome"
            onStart={() => setFlowStep(FLOW_STEPS.QUESTIONS)}
          />
        )}

        {flowStep === FLOW_STEPS.QUESTIONS && currentQuestion && (
          <motion.div key={currentQuestion.id} className="tdna-question-frame">
            <button
              type="button"
              className="tdna-fixed-back"
              onClick={goToPreviousQuestion}
            >
              <BetterUpIcon name="ChevronLeft" size={18} strokeWidth={2.2} />
              <span>Back</span>
            </button>
            <QuestionStep
              step={currentQuestion}
              value={responses[currentQuestion.id]}
              onChange={(value) => setResponse(currentQuestion.id, value)}
              onInterstitialSeen={(id) => seenInterstitialIdsRef.current.add(id)}
              onNext={goToNextQuestion}
            />
          </motion.div>
        )}

        {flowStep === FLOW_STEPS.AVATAR && (
          <AvatarStep
            key="avatar"
            avatarDataUrl={avatarDataUrl}
            onAvatarChange={setAvatarDataUrl}
            onContinue={startProcessing}
          />
        )}

        {flowStep === FLOW_STEPS.PROCESSING && (
          <ProcessingStep
            key="processing"
            readyToExit={profileReady}
            onExitComplete={() => setFlowStep(FLOW_STEPS.REVIEW)}
          />
        )}

        {flowStep === FLOW_STEPS.REVIEW && profile && (
          <ReviewStep
            key="review"
            avatarDataUrl={avatarDataUrl}
            bigFive={bigFive}
            profile={profile}
            profileCopy={profileCopy}
            onAvatarChange={setAvatarDataUrl}
            onSave={saveAndContinue}
          />
        )}
      </AnimatePresence>

      {!isDemoMode && (
        <>
          <button
            type="button"
            className="team-dna-dev-tab"
            onClick={() => setDebugOpen((current) => !current)}
            aria-pressed={debugOpen}
          >
            Debug <span>\</span>
          </button>

          <DebugPanel
            isOpen={debugOpen}
            payload={debugPayload}
            onClose={() => setDebugOpen(false)}
            onReset={resetStoredAssessment}
          />
        </>
      )}
    </main>
  );
}

function DnaMark() {
  return (
    <BetterUpIcon
      className="tdna-dna-mark"
      name="Dna"
      size={40}
      strokeWidth={1.7}
    />
  );
}

const ONBOARDING_FADE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
};

function BrandMark() {
  return (
    <span className="tdna-onboarding-brand">
      <BetterUpIcon name="Dna" size={18} strokeWidth={1.8} />
      Team DNA
    </span>
  );
}

const ACCOUNT_SLIDES = [
  {
    id: 'collaborate',
    visual: 'traits',
    title: 'See how you actually collaborate',
    body: 'Honest answers become a clear read of how you and your teammates work best together.',
  },
  {
    id: 'strengths',
    visual: 'cluster',
    title: 'Know the real strengths and friction',
    body: 'Get genuine strengths, blind spots, and where working styles rub — not generic personality labels.',
  },
  {
    id: 'coach',
    visual: 'chat',
    bubbles: [
      'How should I approach this 1:1?',
      'Here’s what works best with their style.',
    ],
    title: 'Debrief it with your AI coach',
    body: 'Turn the read into action — talk any pairing or tension through with your AI coach.',
  },
];

const ACCOUNT_SLIDE_MS = 5200;

function AccountAside() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ACCOUNT_SLIDES.length);
    }, ACCOUNT_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const slide = ACCOUNT_SLIDES[index];

  return (
    <aside className="tdna-onboarding-aside" aria-hidden="true">
      <div className="tdna-onboarding-aside-top">
        <BrandMark />
      </div>

      <div className="tdna-onboarding-carousel">
        <div className="tdna-onboarding-stage">
          <button
            type="button"
            className="tdna-onboarding-nav-arrow tdna-onboarding-nav-arrow--prev"
            onClick={() =>
              setIndex(
                (current) =>
                  (current - 1 + ACCOUNT_SLIDES.length) % ACCOUNT_SLIDES.length
              )
            }
            aria-label="Previous slide"
          >
            <BetterUpIcon name="ChevronLeft" size={16} strokeWidth={2.2} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              className="tdna-onboarding-slide"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="tdna-onboarding-slide-visual">
                {slide.visual === 'chat' ? (
                  <div className="tdna-onboarding-chat">
                    <span className="tdna-onboarding-bubble">
                      {slide.bubbles[0]}
                    </span>
                    <span className="tdna-onboarding-bubble tdna-onboarding-bubble--reply">
                      {slide.bubbles[1]}
                    </span>
                  </div>
                ) : slide.visual === 'traits' ? (
                  <OnboardingTraitPreview />
                ) : (
                  <OnboardingFaceCluster />
                )}
              </div>
              <div className="tdna-onboarding-slide-copy">
                <h2>{slide.title}</h2>
                <p>{slide.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            className="tdna-onboarding-nav-arrow tdna-onboarding-nav-arrow--next"
            onClick={() =>
              setIndex((current) => (current + 1) % ACCOUNT_SLIDES.length)
            }
            aria-label="Next slide"
          >
            <BetterUpIcon name="ChevronRight" size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="tdna-onboarding-dots">
          {ACCOUNT_SLIDES.map((entry, dotIndex) => (
            <button
              type="button"
              key={entry.id}
              className="tdna-onboarding-dot"
              data-active={dotIndex === index ? 'true' : undefined}
              onClick={() => setIndex(dotIndex)}
              aria-label={`Show slide ${dotIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function AccountStep({ onContinue }) {
  const [email, setEmail] = useState('jordan.rivera@biomarin.com');
  const [password, setPassword] = useState('teamdna2026');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreeShare, setAgreeShare] = useState(true);
  const canContinue = email.trim() && password.trim() && agreeTerms && agreeShare;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (canContinue) onContinue();
  };

  return (
    <motion.section
      className="tdna-onboarding tdna-onboarding--account"
      {...ONBOARDING_FADE}
    >
      <AccountAside />

      <div className="tdna-onboarding-main">
        <form className="tdna-onboarding-card" onSubmit={handleSubmit}>
          <header className="tdna-onboarding-card-head">
            <h1>Create your account</h1>
            <p className="tdna-onboarding-card-sub">
              Set up your Team DNA profile to begin.
            </p>
          </header>

          <label className="tdna-field">
            <span className="tdna-field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="tdna-field">
            <span className="tdna-field-label">Set your password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <span className="tdna-field-hint">
              8 character minimum with a mix of numbers, uppercase, and lowercase
              letters.
            </span>
          </label>

          <div className="tdna-consent">
            <label className="tdna-consent-row">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) => setAgreeTerms(event.target.checked)}
              />
              <span>
                I agree to the <a href="#consent">Acceptable Use Policy</a> and{' '}
                <a href="#consent">Privacy Policy</a>.
              </span>
            </label>
            <label className="tdna-consent-row">
              <input
                type="checkbox"
                checked={agreeShare}
                onChange={(event) => setAgreeShare(event.target.checked)}
              />
              <span>
                I understand my profile and Big Five results will be{' '}
                <strong>visible to everyone in my organization</strong>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="bu-button bu-button--primary tdna-onboarding-submit"
            disabled={!canContinue}
          >
            Continue
            <span aria-hidden="true">&rarr;</span>
          </button>
        </form>
      </div>
    </motion.section>
  );
}

function ValueStep({ onStart }) {
  return (
    <motion.section
      className="tdna-onboarding tdna-onboarding--value"
      {...ONBOARDING_FADE}
    >
      <aside className="tdna-onboarding-aside tdna-onboarding-aside--value">
        <div className="tdna-onboarding-value-copy">
          <span className="tdna-onboarding-invite">
            <span className="tdna-onboarding-invite-avatar">
              <img src="/team-dna/avatars/sam-ryu.png" alt="" />
            </span>
            <span className="tdna-onboarding-invite-text">
              <strong>Sam Ryu</strong> invited you to join Sample Team
            </span>
          </span>

          <h1>Work better together.</h1>

          <p className="tdna-onboarding-value-lede">
            You’ve been added to a team. Answer a few quick questions to unlock
            how you and your teammates work best together.
          </p>

          <ul className="tdna-onboarding-value-points">
            <li>A clear read on how you work — your strengths and blind spots.</li>
            <li>See where you and a teammate click, and where you’ll clash.</li>
            <li>Practical ways to work better with anyone on your team.</li>
          </ul>

          <div className="tdna-onboarding-value-actions">
            <button
              type="button"
              className="bu-button bu-button--primary tdna-onboarding-submit"
              onClick={onStart}
            >
              Get started
              <span aria-hidden="true">&rarr;</span>
            </button>
            <span className="tdna-onboarding-value-meta">Takes about 10 min</span>
          </div>

          <p className="tdna-onboarding-value-footnote">
            <BetterUpIcon name="Info" size={13} strokeWidth={2} />
            Your Team DNA profile is visible to everyone in your organization.
          </p>
        </div>
      </aside>

      <div className="tdna-onboarding-main tdna-onboarding-main--value">
        <TeamDnaEmptyPreview />
      </div>
    </motion.section>
  );
}

function WelcomeStep({ onStart }) {
  return (
    <motion.section className="tdna-welcome" {...QUESTION_FADE}>
      <div className="tdna-welcome-lines" aria-hidden="true">
        <span className="tdna-line tdna-line-h tdna-line-h-1" />
        <span className="tdna-line tdna-line-h tdna-line-h-2" />
        <span className="tdna-line tdna-line-h tdna-line-h-3" />
        <span className="tdna-line tdna-line-h tdna-line-h-4" />
        <span className="tdna-line tdna-line-v tdna-line-v-1" />
        <span className="tdna-line tdna-line-v tdna-line-v-2" />
        <span className="tdna-line tdna-line-v tdna-line-v-3" />
        <span className="tdna-line tdna-line-v tdna-line-v-4" />
        <span className="tdna-plus tdna-plus-1" />
        <span className="tdna-plus tdna-plus-2" />
      </div>
      <div className="tdna-welcome-media" aria-hidden="true">
        <motion.div
          className="tdna-hand-stage"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{
            delay: 0.1,
            duration: 0.62,
            ease: [0.215, 0.61, 0.355, 1],
          }}
        >
          <HalftoneHand className="tdna-halftone-hand" />
        </motion.div>
      </div>
      <div className="tdna-welcome-content">
        <div className="tdna-welcome-copy">
          <DnaMark />
          <p className="tdna-kicker">Team DNA</p>
          <h1>Now, let’s map how you work.</h1>
          <p className="tdna-welcome-body">
            A few quick questions on how you move through work and relate to
            teammates. Your answers build your profile, using the{' '}
            <strong>Big Five</strong>
            <a
              aria-label="Goldberg 1990 Big Five factor structure source"
              href="https://doi.org/10.1037/0022-3514.59.6.1216"
              rel="noreferrer"
              target="_blank"
              title="Goldberg, L. R. (1990). An alternative description of personality: The Big-Five factor structure."
            >
              [1]
            </a>{' '}
            framework.
          </p>
          <div className="tdna-welcome-actions">
            <button type="button" className="tdna-primary-action" onClick={onStart}>
              Begin assessment <span>10 min</span>
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AssessmentProgress({ current, total, progress }) {
  const stepProgress = 100 / total;
  const journeyRatio = total <= 1 ? 1 : (current - 1) / (total - 1);
  const optimisticMultiplier = 0.62 + Math.pow(1 - journeyRatio, 0.72) * 0.78;
  const optimisticProgress = Math.min(
    100,
    progress + stepProgress * optimisticMultiplier
  );
  const mountedRef = useRef(false);
  const previousCurrentRef = useRef(current);
  const [progressAnimation, setProgressAnimation] = useState({
    width: `${optimisticProgress}%`,
    transition: { duration: 0 },
  });

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      previousCurrentRef.current = current;
      setProgressAnimation({
        width: `${optimisticProgress}%`,
        transition: { duration: 0 },
      });
      return undefined;
    }

    const isMovingBack = current < previousCurrentRef.current;
    previousCurrentRef.current = current;

    if (isMovingBack) {
      setProgressAnimation({
        width: `${optimisticProgress}%`,
        transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
      });
      return undefined;
    }

    setProgressAnimation({
      width: `${optimisticProgress}%`,
      transition: {
        duration: PROGRESS_FORWARD_DURATION_S,
        ease: [0.22, 1, 0.36, 1],
      },
    });
  }, [current, optimisticProgress]);

  return (
    <div className="tdna-progress" aria-label={`Question ${current} of ${total}`}>
      <motion.div
        className="tdna-progress-bar"
        initial={false}
        animate={{ width: progressAnimation.width }}
        transition={progressAnimation.transition}
      />
    </div>
  );
}

function QuestionStep({
  step,
  value,
  onChange,
  onInterstitialSeen,
  onNext,
}) {
  const isBigFive = step.kind === 'bigFive';
  const isWorkingStyle = step.kind === 'workingStyle';
  const [selectedValue, setSelectedValue] = useState(null);
  const isSelecting = selectedValue !== null;

  if (step.kind === 'interstitial') {
    return (
      <InterstitialBreak
        item={step.item}
        onNext={onNext}
        onSeen={onInterstitialSeen}
      />
    );
  }

  if (step.kind === 'imageChoice') {
    return (
      <ImageChoiceBreak
        item={step.item}
        selectedValue={selectedValue}
        onSelect={(optionId) => {
          if (isSelecting) return;
          setSelectedValue(optionId);
          window.setTimeout(onNext, IMAGE_CHOICE_ADVANCE_MS);
        }}
      />
    );
  }

  const handleNext = () => {
    if (isWorkingStyle && value === undefined) {
      onChange(50);
    }
    onNext();
  };
  const handleLikertSelect = (nextValue) => {
    if (isSelecting) return;

    onChange(nextValue);
    setSelectedValue(nextValue);
    window.setTimeout(onNext, LIKERT_ADVANCE_MS);
  };

  return (
    <motion.section className="tdna-question-shell" {...QUESTION_FADE}>
      <div className="tdna-question-card" data-kind={step.kind}>
        <motion.h2
          style={getQuestionTypographyStyle(step.item.text)}
          animate={{
            opacity: isSelecting ? 0 : 1,
            y: isSelecting ? -12 : 0,
          }}
          transition={{ duration: 0.24 }}
        >
          {isBigFive ? (
            <HighlightedQuestionText item={step.item} />
          ) : (
            step.item.text
          )}
        </motion.h2>
        {isBigFive ? (
          <LikertControl
            value={value}
            selectedValue={selectedValue}
            onChange={handleLikertSelect}
          />
        ) : (
          <WorkingStyleControl
            item={step.item}
            value={value}
            onChange={onChange}
          />
        )}
        {isWorkingStyle && (
          <div className="tdna-step-actions">
            <button
              type="button"
              className="tdna-primary-action"
              data-confirm-sound="select"
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function InterstitialBreak({ item, onNext, onSeen }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const text = item.text;
  const letters = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    const enterDuration =
      letters.length * INTERSTITIAL_LETTER_STAGGER_MS +
      INTERSTITIAL_LETTER_FADE_MS;
    const exitDuration =
      letters.length * INTERSTITIAL_LETTER_STAGGER_MS +
      INTERSTITIAL_LETTER_FADE_MS;
    const leaveTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, enterDuration + INTERSTITIAL_HOLD_MS);
    const nextTimer = window.setTimeout(() => {
      onSeen(item.id);
      onNext();
    }, enterDuration + INTERSTITIAL_HOLD_MS + exitDuration + 80);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(nextTimer);
    };
  }, [item.id, letters.length, onNext, onSeen]);

  return (
    <motion.section
      className="tdna-break-shell"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <h2 aria-label={text}>
        {letters.map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="tdna-break-letter"
            aria-hidden="true"
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: isLeaving ? 0 : 1,
              y: isLeaving ? -8 : 0,
            }}
            transition={{
              delay: (index * INTERSTITIAL_LETTER_STAGGER_MS) / 1000,
              duration: INTERSTITIAL_LETTER_FADE_MS / 1000,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {letter === ' ' ? '\u00a0' : letter}
          </motion.span>
        ))}
      </h2>
    </motion.section>
  );
}

function ImageChoiceBreak({ item, selectedValue, onSelect }) {
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const imageUrls = item.options.map((option) => option.imageUrl).filter(Boolean);

    Promise.all(
      imageUrls.map(
        (url) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = resolve;
            image.src = url;

            if (image.decode) {
              image.decode().then(resolve).catch(resolve);
            }
          })
      )
    ).then(() => {
      if (!isCancelled) {
        setImagesReady(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [item.options]);

  return (
    <motion.section className="tdna-question-shell tdna-image-choice-shell" {...QUESTION_FADE}>
      <div className="tdna-question-card" data-kind="imageChoice">
        <motion.h2
          animate={{
            opacity: selectedValue ? 0 : 1,
            y: selectedValue ? -12 : 0,
          }}
          transition={{ duration: 0.24 }}
        >
          {item.text}
        </motion.h2>
        <AnimatePresence mode="wait">
          {imagesReady && (
            <motion.div
              key="image-choice-grid"
              className="tdna-image-choice-grid"
              role="radiogroup"
              aria-label={item.text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {item.options.map((option, index) => (
                <ImageChoiceOption
                  key={option.id}
                  index={index}
                  option={option}
                  selectedValue={selectedValue}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function ImageChoiceOption({ index, option, selectedValue, onSelect }) {
  const { pressed, handlers } = useTeamDnaPressable({
    disabled: selectedValue !== null,
  });
  const isSelected = selectedValue === option.id;
  const isFading = selectedValue !== null && !isSelected;
  const direction = index === 0 ? -1 : 1;

  return (
    <motion.button
      type="button"
      className="tdna-image-choice-option"
      data-confirm-sound="select"
      data-selected={isSelected || undefined}
      aria-label={option.label}
      {...handlers}
      initial={{ opacity: 0, y: 24, x: direction * 24, rotate: direction * 2.2 }}
      animate={{
        opacity: isFading ? 0 : 1,
        x: isSelected ? 0 : direction * 10,
        y: isSelected ? -12 : 0,
        rotate: isSelected ? 0 : direction * 1.6,
        scale: pressed ? 1.025 : isSelected ? 1.04 : 1,
      }}
      whileHover={
        selectedValue === null
          ? {
              y: -10,
              rotate: direction * 0.8,
              scale: 1.018,
              transition: {
                type: 'spring',
                stiffness: 1200,
                damping: 28,
                mass: 0.32,
              },
            }
          : undefined
      }
      transition={{
        type: 'spring',
        stiffness: selectedValue === null ? 430 : 900,
        damping: selectedValue === null ? 31 : 34,
        mass: selectedValue === null ? 0.78 : 0.48,
      }}
      onClick={() => onSelect(option.id)}
      role="radio"
      aria-checked={isSelected}
    >
      <span className="tdna-image-choice-media" aria-hidden="true">
        <img src={option.imageUrl} alt="" />
      </span>
    </motion.button>
  );
}

function HighlightedQuestionText({ item }) {
  const phrase = BIG_FIVE_HIGHLIGHTS[item.id];
  if (!phrase) return item.text;

  const startIndex = item.text.toLowerCase().indexOf(phrase.toLowerCase());
  if (startIndex === -1) return item.text;

  const endIndex = startIndex + phrase.length;
  const highlightText = item.text.slice(startIndex, endIndex);

  return (
    <>
      {item.text.slice(0, startIndex)}
      <span className="tdna-question-highlight" aria-label={highlightText}>
        {Array.from(highlightText).map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="tdna-question-highlight-char"
            style={{ '--tdna-wave-index': index }}
            aria-hidden="true"
          >
            {character === ' ' ? '\u00a0' : character}
          </span>
        ))}
      </span>
      {item.text.slice(endIndex)}
    </>
  );
}

function getQuestionTypographyStyle(text) {
  const length = text.length;
  const fontSize = length >= 72 ? 43 : length >= 62 ? 47 : length >= 54 ? 51 : 56;
  const lineHeight = length >= 54 ? 1.54 : 1.08;

  return {
    '--tdna-question-font-size': `${fontSize}px`,
    '--tdna-question-line-height': lineHeight,
  };
}

function LikertControl({ value, selectedValue, onChange }) {
  return (
    <div className="tdna-likert" role="radiogroup" aria-label="Answer options">
      {LIKERT_OPTIONS.map((option, index) => (
        <LikertOption
          key={option.value}
          index={index}
          option={option}
          value={value}
          selectedValue={selectedValue}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function LikertOption({ index, option, value, selectedValue, onChange }) {
  const { pressed, handlers } = useTeamDnaPressable({
    disabled: selectedValue !== null,
  });
  const fan = LIKERT_FAN[index] ?? { rotate: 0, x: 0, y: 0 };
  const stackOffset =
    typeof window !== 'undefined' && window.innerWidth > 860
      ? (2 - index) * LIKERT_STACK_SPACING
      : 0;
  const isSelected = value === option.value || selectedValue === option.value;
  const isFading = selectedValue !== null && selectedValue !== option.value;
  const baseScale = isSelected
    ? 1.06
    : selectedValue === null
      ? 1
      : 0.9;

  return (
    <motion.button
      type="button"
      className="tdna-likert-option"
      data-confirm-sound="select"
      data-selected={isSelected || undefined}
      data-tone={index + 1}
      {...handlers}
      initial={{
        opacity: 0,
        scale: 0.96,
        x: stackOffset,
        y: 18,
        rotate: 0,
      }}
      animate={{
        opacity: isFading ? 0 : 1,
        scale: pressed ? baseScale * 1.045 : baseScale,
        x: isSelected ? 0 : selectedValue === null ? fan.x : fan.x * 0.35,
        y: isSelected ? -16 : selectedValue === null ? fan.y : fan.y + 12,
        rotate: isSelected
          ? 0
          : selectedValue === null
            ? fan.rotate
            : fan.rotate * 0.45,
      }}
      whileHover={
        selectedValue === null
          ? {
              y: fan.y - 9,
              rotate: fan.rotate * 0.72,
              scale: 1.025,
              transition: {
                type: 'spring',
                stiffness: 1700,
                damping: 30,
                mass: 0.28,
              },
            }
          : undefined
      }
      transition={{
        type: 'spring',
        stiffness: selectedValue === null ? 520 : 980,
        damping: selectedValue === null ? 32 : 33,
        mass: selectedValue === null ? 0.82 : 0.48,
      }}
      onClick={() => onChange(option.value)}
      role="radio"
      aria-checked={value === option.value}
    >
      {option.label}
    </motion.button>
  );
}

function WorkingStyleControl({ item, value = 50, onChange }) {
  const [isSliderActive, setIsSliderActive] = useState(false);
  const lowEmphasis = 1 + ((100 - value) / 100) * 0.34;
  const highEmphasis = 1 + (value / 100) * 0.34;
  const lowOpacity = 0.48 + ((100 - value) / 100) * 0.34;
  const highOpacity = 0.48 + (value / 100) * 0.34;
  const pulseSide =
    !isSliderActive && value !== 50
      ? value < 50
        ? 'low'
        : 'high'
      : null;

  return (
    <div className="tdna-slider-control">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        data-press-sound="click"
        onChange={(event) => onChange(Number(event.target.value))}
        onBlur={() => setIsSliderActive(false)}
        onKeyDown={() => setIsSliderActive(true)}
        onKeyUp={() => setIsSliderActive(false)}
        onPointerCancel={() => setIsSliderActive(false)}
        onPointerDown={() => setIsSliderActive(true)}
        onPointerUp={() => setIsSliderActive(false)}
        aria-label={item.label}
      />
      <div className="tdna-slider-labels" aria-hidden="true">
        <span
          data-pulse={pulseSide === 'low' || undefined}
          style={{
            '--tdna-pole-scale': lowEmphasis,
            '--tdna-pole-pulse-scale': lowEmphasis * 1.025,
            opacity: lowOpacity,
          }}
        >
          {item.low}
        </span>
        <strong />
        <span
          data-pulse={pulseSide === 'high' || undefined}
          style={{
            '--tdna-pole-scale': highEmphasis,
            '--tdna-pole-pulse-scale': highEmphasis * 1.025,
            opacity: highOpacity,
          }}
        >
          {item.high}
        </span>
      </div>
    </div>
  );
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function AvatarStep({
  avatarDataUrl,
  onAvatarChange,
  onContinue,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cancelledRef = useRef(false);
  const [showIntro, setShowIntro] = useState(!avatarDataUrl);
  const [showPhotoStage, setShowPhotoStage] = useState(Boolean(avatarDataUrl));
  const [subState, setSubState] = useState(avatarDataUrl ? 'done' : 'pre');
  const [countdown, setCountdown] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [videoReady, setVideoReady] = useState(Boolean(avatarDataUrl));
  const [headlineHidden, setHeadlineHidden] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (avatarDataUrl) {
      setShowIntro(false);
      setShowPhotoStage(true);
      return undefined;
    }

    const hideIntroTimer = window.setTimeout(
      () => setShowIntro(false),
      PHOTO_INTRO_MS
    );
    const revealStageTimer = window.setTimeout(
      () => setShowPhotoStage(true),
      PHOTO_INTRO_MS + 380
    );

    return () => {
      window.clearTimeout(hideIntroTimer);
      window.clearTimeout(revealStageTimer);
    };
  }, []);

  useEffect(() => {
    if (!avatarDataUrl) {
      requestCamera();
    }
    return () => {
      cancelledRef.current = true;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onPlaying = () => setVideoReady(true);
    video.addEventListener('playing', onPlaying);
    return () => video.removeEventListener('playing', onPlaying);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setVideoReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const requestCamera = async () => {
    if (streamRef.current || !navigator.mediaDevices?.getUserMedia) return;

    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError('Camera access blocked. Allow it, then try again.');
      setSubState('error');
    }
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', SNAPSHOT_QUALITY);
  };

  const capturePhoto = async () => {
    if (subState !== 'pre' && subState !== 'error') return;
    cancelledRef.current = false;

    if (!streamRef.current) {
      await requestCamera();
      if (!streamRef.current) return;
    }

    setSubState('live');
    setHeadlineHidden(false);
    setCountdown(0);
    await wait(CAPTURE_ABSORB_MS);

    for (let next = CAPTURE_COUNTDOWN_START; next >= 1; next -= 1) {
      if (cancelledRef.current) return;
      setCountdown(next);
      await wait(CAPTURE_TICK_MS);
    }

    setCountdown(0);
    setHeadlineHidden(true);
    const snapshot = takeSnapshot();

    if (!snapshot) {
      setCameraError("Couldn't capture the frame. Try again.");
      setSubState('error');
      return;
    }

    onAvatarChange(snapshot);
    setShowFlash(true);
    await wait(CAPTURE_FLASH_MS);
    setShowFlash(false);
    setSubState('freeze');
    await wait(CAPTURE_FREEZE_MS);
    setHeadlineHidden(false);
    setSubState('done');
    stopCamera();
  };

  const redoPhoto = async () => {
    cancelledRef.current = true;
    onAvatarChange('');
    setCountdown(0);
    setHeadlineHidden(false);
    setShowFlash(false);
    setCameraError('');
    setSubState('pre');
    await requestCamera();
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onAvatarChange(String(reader.result));
      setHeadlineHidden(false);
      setSubState('done');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const headline =
    subState === 'done'
      ? "Nice. We'll use this for your profile."
      : subState === 'error'
        ? "Hmm, that didn't work."
        : subState === 'live'
          ? 'Look at the camera.'
          : "Let's see a smile.";
  const helperText =
    subState === 'done'
      ? 'You can retake it or upload a different one.'
      : 'This photo will be used for your profile.';
  const showBegin = subState === 'pre' || subState === 'error';
  const showRedo = subState === 'done' || subState === 'freeze';

  return (
    <motion.section className="tdna-avatar-step" {...QUESTION_FADE}>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="tdna-photo-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34 }}
          >
            <h2>Last thing ...</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="tdna-photo-stage"
        data-obscured={!showPhotoStage || undefined}
      >
        <div className="tdna-photo-headline">
          <AnimatePresence mode="wait">
            <motion.h2
              key={headline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: headlineHidden ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {headline}
            </motion.h2>
          </AnimatePresence>
          <motion.p
            key={helperText}
            className="tdna-photo-helper"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: headlineHidden ? 0 : 1, y: 0 }}
            transition={{ duration: 0.44, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {helperText}
          </motion.p>
        </div>

        <div className="tdna-capture-wrap">
          <motion.div
            className="tdna-camera-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: videoReady ? 1 : 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <video
              ref={videoRef}
              className="tdna-camera-preview"
              autoPlay
              muted
              playsInline
            />
            {avatarDataUrl && (
              <img className="tdna-camera-freeze" src={avatarDataUrl} alt="" />
            )}
            {showFlash && <motion.div className="tdna-capture-flash" />}
            <AnimatePresence>
              {countdown > 0 && (
                <motion.div
                  key={countdown}
                  className="tdna-countdown"
                  initial={{ opacity: 0, scale: 1.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {countdown}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="tdna-avatar-actions">
          <motion.div
            animate={{
              opacity: showBegin ? 1 : 0,
              height: showBegin ? 'auto' : 0,
            }}
            initial={false}
            transition={{ duration: 0.34, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ pointerEvents: showBegin ? 'auto' : 'none' }}
          >
            <button
              type="button"
              className="tdna-capture-action"
              onClick={capturePhoto}
            >
              <span />
              Begin capture
            </button>
          </motion.div>

          <label className="tdna-upload-link">
            Upload instead
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>

          <AnimatePresence>
            {showRedo && (
              <motion.button
                type="button"
                className="tdna-redo-link"
                onClick={redoPhoto}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Redo
              </motion.button>
            )}
          </AnimatePresence>

          {cameraError && (
            <motion.p
              className="tdna-camera-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {cameraError}
            </motion.p>
          )}
        </div>

        <motion.div
          className="tdna-photo-continue"
          animate={{ opacity: avatarDataUrl ? 1 : 0 }}
          initial={false}
          transition={{ duration: 0.28 }}
          style={{ pointerEvents: avatarDataUrl ? 'auto' : 'none' }}
        >
          <button
            type="button"
            className="tdna-photo-continue-button"
            onClick={() => {
              onContinue();
            }}
          >
            Continue
          </button>
        </motion.div>
        {!avatarDataUrl && (
          <button
            type="button"
            className="tdna-photo-skip"
            onClick={onContinue}
          >
            Skip
          </button>
        )}
      </div>
    </motion.section>
  );
}

function AnimatedLoaderCheckmark({ size = 100, color = '#CE0058' }) {
  const diamondSize = size * 0.85;

  return (
    <motion.div
      className="tdna-loader-check"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.16, opacity: 0 }}
      transition={{
        scale: { type: 'spring', stiffness: 200, damping: 12 },
        opacity: { duration: 0.3 },
      }}
      style={{ width: size, height: size }}
    >
      <motion.div className="tdna-loader-check-diamond">
        <svg width={diamondSize} height={diamondSize} viewBox="0 0 24 24" fill="none">
          <motion.rect
            x="2"
            y="2"
            width="20"
            height="20"
            stroke={color}
            strokeWidth="0.75"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M7 13l3 3 7-7"
          stroke={color}
          strokeWidth="0.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

const ProfileLoaderVisual = forwardRef(function ProfileLoaderVisual(
  {
    size = 86,
    color = '#CE0058',
    isFinal = false,
    onFinalComplete,
  },
  ref
) {
  const gridSize = 3;
  const plusSize = size / 4;
  const gap = size / 8;
  const containerControls = useAnimationControls();
  const [phase, setPhase] = useState('hidden');
  const [transformedIndices, setTransformedIndices] = useState(new Set());
  const [isFinalTriggered, setIsFinalTriggered] = useState(isFinal);
  const isFinalActive = isFinalTriggered || isFinal;
  const plusPositions = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      plusPositions.push({
        id: row * gridSize + col,
        x: (col - 1) * (plusSize + gap),
        y: (row - 1) * (plusSize + gap),
      });
    }
  }

  useImperativeHandle(ref, () => ({
    triggerFinalAnimation: () => setIsFinalTriggered(true),
  }));

  useEffect(() => {
    if (isFinal) {
      setIsFinalTriggered(true);
    }
  }, [isFinal]);

  useEffect(() => {
    let cancelled = false;

    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const runCycle = async () => {
      setPhase('showing');
      await wait(460);
      if (cancelled) return;

      setPhase('transforming');
      for (let index = 0; index < 9; index += 1) {
        if (cancelled) return;
        setTransformedIndices((current) => new Set([...current, index]));
        await wait(92);
      }
      if (cancelled) return;

      setPhase('complete');
      await wait(280);
      if (cancelled) return;

      setPhase('reverting');
      for (let index = 0; index < 9; index += 1) {
        if (cancelled) return;
        setTransformedIndices((current) => {
          const next = new Set(current);
          next.delete(index);
          return next;
        });
        await wait(92);
      }
      if (cancelled) return;

      setPhase('pluses');
      await wait(260);
      if (cancelled) return;

      setPhase('hiding');
      await wait(360);
      if (cancelled) return;

      setTransformedIndices(new Set());
      setPhase('hidden');
      await wait(80);
    };

    const loop = async () => {
      while (!cancelled && !isFinalActive) {
        await runCycle();
      }
    };

    loop();
    return () => {
      cancelled = true;
    };
  }, [isFinalActive]);

  useEffect(() => {
    if (!isFinalActive) return;
    let cancelled = false;

    const runFinalAnimation = async () => {
      setTransformedIndices(new Set());
      setPhase('pluses');

      await containerControls.start({
        scale: 1.3,
        rotate: 45,
        transition: { type: 'spring', stiffness: 200, damping: 15 },
      });
      if (cancelled) return;

      await new Promise((resolve) => window.setTimeout(resolve, 150));
      if (cancelled) return;

      setPhase('final-converge');
      await new Promise((resolve) => window.setTimeout(resolve, 90));
      if (cancelled) return;

      onFinalComplete?.();
      await new Promise((resolve) => window.setTimeout(resolve, 360));
      if (cancelled) return;

      setPhase('final-done');
    };

    runFinalAnimation();
    return () => {
      cancelled = true;
    };
  }, [containerControls, isFinalActive, onFinalComplete]);

  const isVisible = phase !== 'hidden' && phase !== 'final-done';
  const isConverging = phase === 'final-converge';

  return (
    <motion.div
      className="tdna-loader-visual"
      style={{ width: size, height: size }}
      animate={containerControls}
      initial={{ scale: 1, rotate: 0 }}
    >
      <motion.div
        className="tdna-loader-visual-rotor"
        animate={{ rotate: isFinalActive ? 0 : 360 }}
        transition={
          isFinalActive
            ? { duration: 0 }
            : { duration: 20, repeat: Infinity, ease: 'linear' }
        }
      >
        {plusPositions.map((position, index) => {
          const isTransformed = transformedIndices.has(index);
          const convergeX = position.x * 0.7;
          const convergeY = position.y * 0.7;

          return (
            <motion.div
              key={position.id}
              className="tdna-loader-piece"
              initial={{ x: position.x, y: position.y, opacity: 0, scale: 0 }}
              animate={{
                x: isConverging ? convergeX : position.x,
                y: isConverging ? convergeY : position.y,
                opacity: isConverging ? 0 : isVisible ? 1 : 0,
                scale: isConverging ? 0 : isVisible ? 1 : 0,
              }}
              transition={
                isConverging
                  ? {
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: index * 0.02,
                    }
                  : {
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: phase === 'showing' ? index * 0.04 : (8 - index) * 0.03,
                    }
              }
              style={{ width: plusSize, height: plusSize }}
            >
              <motion.svg
                width={plusSize}
                height={plusSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                animate={{
                  opacity: isTransformed ? 0 : 1,
                  scale: isTransformed ? 0 : 1,
                  rotate: isTransformed ? -45 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </motion.svg>
              <motion.span
                className="tdna-loader-square"
                animate={{
                  opacity: isTransformed ? 1 : 0,
                  scale: isTransformed ? 1 : 0,
                  rotate: isTransformed ? 0 : 45,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  width: plusSize * 0.5,
                  height: plusSize * 0.5,
                  backgroundColor: color,
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
});

function ProfileLoader({ readyToExit, onExitComplete }) {
  const loaderRef = useRef(null);
  const mountedAtRef = useRef(null);
  const exitTimerRef = useRef(null);
  const finalTriggeredRef = useRef(false);
  const playLoadingComplete = useAssessmentSound(SOUNDS.loadingComplete, 0.42);
  const [statusIndex, setStatusIndex] = useState(0);
  const [completionStarted, setCompletionStarted] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const messages = useMemo(
    () => ['Scoring your answers', 'Building your profile', 'Almost there'],
    []
  );
  const message = showCheckmark ? 'All set' : messages[statusIndex % messages.length];

  useEffect(() => {
    mountedAtRef.current = Date.now();
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (readyToExit) return undefined;
    const timer = window.setInterval(() => {
      setStatusIndex((current) => current + 1);
    }, 620);
    return () => window.clearInterval(timer);
  }, [readyToExit]);

  useEffect(() => {
    if (!readyToExit || finalTriggeredRef.current) return undefined;

    const elapsed = Date.now() - (mountedAtRef.current ?? Date.now());
    const delay = Math.max(PROFILE_LOADER_MIN_DWELL_MS - elapsed, 0);

    exitTimerRef.current = window.setTimeout(() => {
      finalTriggeredRef.current = true;
      setCompletionStarted(true);
      loaderRef.current?.triggerFinalAnimation();
    }, delay);

    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [readyToExit]);

  const handleFinalComplete = useCallback(() => {
    playLoadingComplete();
    setShowCheckmark(true);
    window.setTimeout(onExitComplete, PROFILE_LOADER_COMPLETION_HOLD_MS);
  }, [onExitComplete, playLoadingComplete]);

  return (
    <div className="tdna-profile-loader" role="status" aria-live="polite">
      <div className="tdna-profile-loader-mark">
        <motion.div
          className="tdna-profile-loader-visual"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: showCheckmark ? 0 : 1,
            scale: showCheckmark ? 0.94 : 1,
          }}
          transition={{ duration: 0.42 }}
        >
          <ProfileLoaderVisual
            ref={loaderRef}
            size={86}
            color="#CE0058"
            isFinal={completionStarted}
            onFinalComplete={handleFinalComplete}
          />
        </motion.div>
        <AnimatePresence>
          {showCheckmark && (
            <motion.div
              className="tdna-profile-loader-check"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <AnimatedLoaderCheckmark />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="tdna-profile-loader-message">
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProcessingStep({ readyToExit, onExitComplete }) {
  return (
    <motion.section className="tdna-processing" {...QUESTION_FADE}>
      <ProfileLoader readyToExit={readyToExit} onExitComplete={onExitComplete} />
    </motion.section>
  );
}

function makeReviewInsight({ profile, profileCopy, bigFive, avatarDataUrl }) {
  const member = {
    id: 'you',
    name: 'Jordan',
    avatarUrl: avatarDataUrl,
    assessmentComplete: true,
    bigFive,
    archetypeImageBigFive: buildArchetypeImageScores(profile.roles, bigFive),
    roles: profile.roles,
    meta: profile.meta,
  };
  const copy = profileCopy ?? profile.copy ?? {};
  const dataset = {
    team: {
      id: 'surface-1-review',
      name: 'Team DNA',
    },
    members: [member],
    insights: {
      team: undefined,
      people: {
        you: {
          id: 'person-you-profile-review',
          source: 'ai',
          eyebrow: 'Your profile',
          title: profile.roles?.primary ?? 'Your Team DNA',
          summary: [
            {
              text:
                copy.overview ??
                'Your profile is ready to review.',
            },
          ],
          cards: [
            {
              id: 'you-where-shines',
              kind: 'guidance',
              label: 'Where I shine',
              data: {
                guidance: {
                  sections: [
                    {
                      body: copy.strengths ?? '',
                    },
                  ],
                },
              },
            },
            {
              id: 'you-work-with',
              kind: 'guidance',
              label: 'How to work with me',
              data: {
                guidance: {
                  sections: [
                    copy.workingStyle
                      ? { body: copy.workingStyle }
                      : null,
                    copy.coaching ? { body: copy.coaching } : null,
                  ].filter(Boolean),
                },
              },
            },
          ],
          meetingBehavior: {
            items: [
              {
                traitKey: 'surface-1-meeting-behavior',
                type: 'generated',
                title: 'How I tend to show up',
                body: copy.meetingBehavior ?? '',
              },
            ],
          },
          watchOut: {
            items: [
              {
                traitKey: 'surface-1-watch-out',
                type: 'generated',
                title: 'When to watch the pattern',
                body: copy.watchOuts ?? '',
              },
            ],
          },
        },
      },
      pairs: {},
    },
  };

  const insight = getInsightForSelection(dataset, ['you'], {
    'person:you': 'ready',
  });

  return {
    ...insight,
    cards: (insight.cards ?? []).filter(
      (card) => card.kind !== 'archetypeImage'
    ),
  };
}

function ReviewStep({
  avatarDataUrl,
  bigFive,
  profile,
  profileCopy,
  onAvatarChange,
  onSave,
}) {
  const [revealStage, setRevealStage] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setRevealStage(1), 160),
      window.setTimeout(() => setRevealStage(2), 1500),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const reviewInsight = useMemo(
    () =>
      makeReviewInsight({
        profile,
        profileCopy,
        bigFive,
        avatarDataUrl,
      }),
    [avatarDataUrl, bigFive, profile, profileCopy]
  );
  const reviewImageUrls = useMemo(
    () => collectInsightImageUrls(reviewInsight),
    [reviewInsight]
  );

  useEffect(() => {
    preloadImageUrls(reviewImageUrls);
  }, [reviewImageUrls]);

  return (
    <motion.section
      className="tdna-review tdna-review--single"
      data-reveal-stage={revealStage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.label
        className="tdna-review-avatar-control tdna-review-avatar-control--floating"
        aria-label="Change photo"
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: revealStage >= 2 ? 1 : 0,
          y: revealStage >= 2 ? 0 : -10,
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="tdna-review-avatar">
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="" />
          ) : (
            <span>Jordan</span>
          )}
        </span>
        <span className="tdna-review-avatar-edit" aria-hidden="true">
          <BetterUpIcon name="Edit" size={15} strokeWidth={1.8} />
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onAvatarChange(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </motion.label>

      <div className="tdna-review-insight-wrap">
        <div className="tdna-review-kicker-row">
          <p className="tdna-kicker">Review before sharing</p>
        </div>
        <InsightPanel
          canManageTeam={false}
          allowProfileEditing={false}
          currentViewerMemberId="you"
          insight={reviewInsight}
          isHidden={false}
          preserveScroll
          revealMode="selfReview"
        />
      </div>

      <motion.section
        className="tdna-review-control-dock"
        aria-label="Profile visibility controls"
        initial={{ opacity: 0 }}
        animate={{
          opacity: revealStage >= 2 ? 1 : 0,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="tdna-primary-action" onClick={onSave}>
          Save and continue
        </button>
      </motion.section>
    </motion.section>
  );
}

function Toggle({ ariaLabel, label, value, onChange }) {
  return (
    <button
      type="button"
      className="tdna-toggle"
      data-active={value || undefined}
      onClick={() => onChange(!value)}
      aria-label={ariaLabel ?? label}
      aria-pressed={value}
    >
      <span>{label}</span>
      <i />
    </button>
  );
}

function DebugPanel({ isOpen, payload, onClose, onReset }) {
  const prettyPayload = JSON.stringify(payload, null, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="team-dna-dev-panel tdna-debug-panel"
          initial={{ x: 340 }}
          animate={{ x: 0 }}
          exit={{ x: 340 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          aria-label="Team DNA assessment debug panel"
        >
          <div className="team-dna-dev-panel-bg" />
          <div className="team-dna-dev-content">
            <header className="team-dna-dev-header">
              <h2>Debug</h2>
              <p>
                Press <span>\</span> to toggle
              </p>
            </header>

            <section className="team-dna-dev-section">
              <div className="team-dna-dev-section-header">
                <h3>Assessment</h3>
                <span>{payload.flowStep}</span>
              </div>
              <div className="team-dna-dev-status-copy">
                <h4>Progress</h4>
                <p>
                  {payload.answeredCount} answers captured. Current step:{' '}
                  {payload.questionIndex + 1}.
                </p>
              </div>
            </section>

            <section className="team-dna-dev-section">
              <div className="team-dna-dev-section-header">
                <h3>Actions</h3>
                <span>local draft</span>
              </div>
              <div className="team-dna-dev-chip-row">
                <button
                  type="button"
                  className="team-dna-dev-chip"
                  onClick={() => copyText(prettyPayload)}
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  className="team-dna-dev-chip tdna-debug-reset"
                  onClick={onReset}
                >
                  Reset saved draft
                </button>
                <button
                  type="button"
                  className="team-dna-dev-chip"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </section>

            <section className="team-dna-dev-section">
              <div className="team-dna-dev-section-header">
                <h3>Payload</h3>
                <span>copyable</span>
              </div>
              <div className="team-dna-dev-status-copy tdna-debug-json">
                <pre>{prettyPayload}</pre>
              </div>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

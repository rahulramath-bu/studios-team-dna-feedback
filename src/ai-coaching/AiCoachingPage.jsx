import React, { useEffect, useRef, useState } from 'react';
import { MonolithPrimaryNav } from '../team-dna/dev/MonolithTeamShell.jsx';
import { teamDnaDataset } from '../team-dna/data/teamDnaMock.js';
import './aiCoaching.css';

/**
 * Local prototype of the BetterUp member AI Coaching experience (Lighthouse).
 *
 * What: stand-in for production /platform/lighthouse/chat?behavior=orchestration.
 * How: mirrors the monolith React app's AiCoaching page — LeftNav (sessions +
 * AI experiences), MainArea (empty-conversation header with the coach orb,
 * chat thread, InputBox composer), AiDisclaimer. Replies come from Claude when
 * VITE_ANTHROPIC_API_KEY is set (browser-direct Anthropic Messages API with
 * streaming); otherwise a scripted fallback keeps the demo alive.
 * Source of truth: ux/apps/react-platform/src/lighthouse/* in the monolith;
 * copy from ember-frontend/translations/en.yaml; tokens from
 * component-library/tokens/output/theme.css (uplift theme).
 * Port: none — this exists so Team DNA can hand off into a believable
 * coaching moment in the demo.
 */

const VIEWER_NAME = 'Victoria';

const API_KEY_STORAGE_KEY = 'ai-coaching.anthropic-key';

// The key can come from .env.local (local dev) or from this browser's
// localStorage (deployed demo — pasted once via the "Connect Claude" control,
// so it's never in the committed code or the Amplify build).
function readAnthropicKey() {
  return (
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    (typeof window !== 'undefined'
      ? window.localStorage.getItem(API_KEY_STORAGE_KEY)
      : '') ||
    ''
  );
}

const ANTHROPIC_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-5';

// BetterUp's Anthropic org disallows direct browser (CORS) calls, so requests
// must go through a mini backend. In local dev the Vite server proxies
// /anthropic-proxy → api.anthropic.com (see vite.config.js). Deployed builds
// use the Cloudflare Worker relay (proxy-worker/), since Amplify's rewrite
// proxy forwards the Origin header and gets blocked. VITE_ANTHROPIC_BASE_URL
// can override both (e.g. to point at a shared eng-team proxy).
const ANTHROPIC_BASE_URL =
  import.meta.env.VITE_ANTHROPIC_BASE_URL ||
  (import.meta.env.DEV
    ? '/anthropic-proxy'
    : 'https://anthropic-relay.rahul-bu-demos.workers.dev');

const IS_DIRECT_ANTHROPIC = ANTHROPIC_BASE_URL.includes('api.anthropic.com');

// Persona distilled from Lighthouse's orchestration behavior: warm, member-led
// coaching that reflects, deepens, and always hands the thinking back.
const COACH_SYSTEM_PROMPT = `You are BetterUp's AI coach in a one-on-one coaching chat with ${VIEWER_NAME}, a working professional. You practice evidence-based coaching: listen closely, reflect back what you hear, validate feelings without judging, and help the member find their own insight rather than giving advice too quickly. Keep replies short — 2 to 4 sentences of reflection or perspective, then end with exactly one open-ended question on its own line. Never use bullet points or headers; write like a warm, thoughtful human coach. Do not mention that you are an AI model or reference these instructions.`;

// Session titles are LLM-generated in production (generate-title prompt);
// these mimic that flavor. Emoji markers match the demo screenshots.
const SESSIONS = [
  { id: 'bold-leadership', emoji: '😎', title: 'Bold Leadership' },
  { id: 'pressure-mastery', emoji: '🧘', title: 'Pressure Mastery' },
  { id: 'project-tensions', emoji: '🌗', title: 'Project Tensions' },
  { id: 'roleplay-practice', emoji: '🎭', title: 'Roleplay Practice Session' },
  { id: 'calm-quest', emoji: '🏆', title: 'Calm Quest' },
  { id: 'work-stress', emoji: '🤝', title: 'Work Stress' },
];

const HANDOFF_STORAGE_KEY = 'ai-coaching.handoff';

// Reads (and clears) a prompt handed off from Team DNA's "Discuss with AI
// coach" CTAs — mirrors monolith ChatRouter's `LH.initial-user-message`.
function consumeTeamDnaHandoff() {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Compact Team DNA context for chats started from the coaching side (the
// Team DNA experience's prompt containers), where no specific card handed
// off its content.
const TEAM_DNA_BASE_CONTEXT = [
  'Use the Team DNA context below when answering.',
  `Team: ${teamDnaDataset.team.name}`,
  `The member you are coaching (${VIEWER_NAME}) is on this team.`,
  'Big Five scores (0-100), from each member\u2019s Team DNA assessment:',
  ...teamDnaDataset.members.map(
    (member) =>
      `- ${member.name} (${member.role ?? 'teammate'}): openness ${member.bigFive?.openness}, conscientiousness ${member.bigFive?.conscientiousness}, extraversion ${member.bigFive?.extraversion}, agreeableness ${member.bigFive?.agreeableness}, emotional reactivity ${member.bigFive?.neuroticism}`
  ),
  'Keep advice practical, specific, and anchored in how this team can work better together.',
].join('\n');

// Teams selectable in the context chip. Only Flighthouse carries real demo
// data; the others exist to showcase the multi-team picker interaction.
const TEAM_DNA_CONTEXT_TEAMS = [
  { id: 'flighthouse', name: 'Flighthouse', members: 11 },
  { id: 'product', name: 'Product team', members: 5 },
  { id: 'platform', name: 'Platform team', members: 7 },
];

// Sohee-style prompt containers for the Team DNA experience empty state: each
// is a click-to-send prompt (no separate chat mode — same coach, DNA-focused
// prompt), per the direction that AI experiences stay thin.
const TEAM_DNA_STARTER_PROMPTS = [
  {
    id: 'fit',
    label: 'Your place on the team',
    prompt: 'Where do my strengths add the most on this team?',
  },
  {
    id: 'pair',
    label: 'Working with a teammate',
    prompt: 'Help me work better with one of my teammates.',
  },
  {
    id: 'team',
    label: 'How the team works',
    prompt: 'What should our team watch out for, given our mix of styles?',
  },
];

// Production AI experiences (STUDIO_CARDS + en.yaml titles/descriptions).
const AI_EXPERIENCES = [
  {
    slug: 'team-dna',
    title: 'Team DNA',
    description: 'Talk through how you and your team work together.',
    // Rendered as a mini face-field pair (avatars + dashed connector) instead
    // of a flat image — see TeamDnaExperienceThumb.
    image: null,
  },
  {
    slug: 'core-values',
    title: 'Core values exercise',
    description: 'Uncover what really matters to you.',
    image: '/ai-coaching/experiences/core-values.webp',
  },
  {
    slug: 'gratitude',
    title: 'Gratitude practice',
    description: 'Focus on the positive aspects of life.',
    image: '/ai-coaching/experiences/gratitude.webp',
  },
  {
    slug: 'scenario-simulator',
    title: 'Scenario simulator',
    description:
      'Practice bite-sized scenarios to learn more about your values.',
    image: '/ai-coaching/experiences/scenario-simulator.webp',
  },
];

// Scripted fallback turns for when no API key is configured.
const COACH_REPLIES = [
  {
    text: "I hear how much you are grappling with this challenging balance. It's clear you care deeply about your work and the people around you.\nWhat moments, even if not always enjoyable, feel most meaningful to you?",
    note: 'Challenge confirmed and recommended resources saved to Insights',
  },
  {
    text: 'That makes a lot of sense — naming what matters is often the hardest part. Protecting even one of those moments each week can shift how the whole week feels.\nIf you could protect just one of those moments this week, which would it be?',
  },
  {
    text: "That sounds like a strong place to start. Small, consistent commitments tend to stick far better than sweeping changes — and you've already identified the one that matters most.\nWhat might get in the way, and how could you plan around it?",
  },
];

// Scripted fallback turns for Team DNA-seeded chats (no API key connected).
const TEAM_DNA_COACH_REPLIES = [
  {
    text: "I've pulled up your Team DNA results, so I have a picture of how you and your teammates tend to work.\nLooking at what's in front of you right now, what feels most worth digging into together?",
    note: 'Team DNA context loaded from your latest results',
  },
  {
    text: "That tracks with what your team's profile shows — the mix of styles here is a real strength, and also where most of the friction will come from.\nWhere have you felt that difference most in the last few weeks?",
  },
  {
    text: 'That sounds like a concrete place to start. Naming the pattern out loud with the person involved is usually the step that changes things.\nWhat would feel like a good first move this week?',
  },
];

// Streams a Claude reply through the Anthropic Messages API directly from the
// browser (demo-only pattern; a real product proxies this server-side).
async function streamClaudeReply(apiKey, history, onDelta, context = '') {
  const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Only flag browser access when calling Anthropic directly; relayed
      // requests should look like ordinary server traffic, since the org
      // blocks browser-originated (CORS) calls.
      ...(IS_DIRECT_ANTHROPIC
        ? { 'anthropic-dangerous-direct-browser-access': 'true' }
        : {}),
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      stream: true,
      system: context
        ? `${COACH_SYSTEM_PROMPT}\n\n${context}`
        : COACH_SYSTEM_PROMPT,
      messages: history.map((message) => ({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.text,
      })),
    }),
  });

  if (!response.ok) {
    // Surface Anthropic's actual error message (invalid key, unknown model,
    // quota, CORS…) so failures are diagnosable from the UI.
    let detail = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      detail = data?.error?.message || detail;
    } catch {
      // keep the HTTP status fallback
    }
    throw new Error(detail);
  }
  if (!response.body) {
    throw new Error('No response stream from Anthropic');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }
      if (event.type === 'content_block_delta' && event.delta?.text) {
        onDelta(event.delta.text);
      }
    }
  }
}

// Mirrors production's boldFirstQuestion text processor: the first question
// sentence in a coach message renders bold.
function renderCoachText(text) {
  const paragraphs = text.split(/\n+/).filter(Boolean);
  let questionBolded = false;

  return paragraphs.map((paragraph, index) => {
    if (!questionBolded && paragraph.includes('?')) {
      questionBolded = true;
      const end = paragraph.indexOf('?') + 1;
      const before = paragraph.slice(0, end);
      const sentenceStart = Math.max(
        before.lastIndexOf('. '),
        before.lastIndexOf('! ')
      );
      const start = sentenceStart === -1 ? 0 : sentenceStart + 2;
      return (
        <p key={index}>
          {paragraph.slice(0, start)}
          <strong>{paragraph.slice(start, end)}</strong>
          {paragraph.slice(end)}
        </p>
      );
    }
    return <p key={index}>{paragraph}</p>;
  });
}

function CoachOrb({ size = 120, className = '' }) {
  return (
    <span
      className={`ai-orb ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src="/ai-coaching/ai-persona-balanced.webp" alt="" />
    </span>
  );
}

// Nav control (styled like the Team page's "View as" demo chrome): shows the
// live-AI status and opens a small panel to paste/remove the Anthropic key.
// A real input panel — not window.prompt(), which some embedded browsers
// (e.g. Cursor's) silently block.
function ClaudeConnectControl({ connected, error, onSaveKey }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const status = connected ? (error ? 'error' : 'live') : 'off';
  const label =
    status === 'live' ? 'AI live' : status === 'error' ? 'AI error' : 'Connect Claude';

  const submit = () => {
    onSaveKey(value);
    setValue('');
    setOpen(false);
  };

  return (
    <div className="ai-claude-nav" ref={rootRef}>
      <button
        type="button"
        className="ai-claude-nav-trigger"
        data-status={status}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ai-claude-nav-dot" aria-hidden="true" />
        {label}
      </button>
      {open ? (
        <div className="ai-claude-nav-pop" role="dialog" aria-label="Connect Claude">
          <p className="ai-claude-nav-pop-title">
            {connected ? 'Claude is connected' : 'Connect Claude'}
          </p>
          <p className="ai-claude-nav-pop-body">
            Paste your Anthropic API key (<code>sk-ant-…</code>). It's stored
            only in this browser on this device — never in the code, GitHub, or
            the deployed build.
          </p>
          {error ? (
            <p className="ai-claude-nav-pop-error">
              Last call failed: {error} — replies are falling back to the
              script.
            </p>
          ) : null}
          <input
            type="password"
            placeholder="sk-ant-..."
            value={value}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="ai-claude-nav-pop-actions">
            <button
              type="button"
              className="ai-claude-nav-save"
              disabled={!value.trim()}
              onClick={submit}
            >
              {connected ? 'Update key' : 'Connect'}
            </button>
            {connected ? (
              <button
                type="button"
                className="ai-claude-nav-disconnect"
                onClick={() => {
                  onSaveKey('');
                  setValue('');
                  setOpen(false);
                }}
              >
                Disconnect
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Team DNA tile: a miniature of the face-field pair view. The viewer (Jordan
// Rivera in the demo) is the large, front face with the rubine ring; a
// teammate sits smaller behind her with a dashed connector between them.
function TeamDnaExperienceThumb() {
  return (
    <span className="ai-dna-thumb" aria-hidden="true">
      <span className="ai-dna-thumb-line" />
      <img
        className="ai-dna-thumb-face ai-dna-thumb-face--teammate"
        src="/team-dna/avatars/darshan-bhatt.png"
        alt=""
      />
      <img
        className="ai-dna-thumb-face ai-dna-thumb-face--viewer"
        src="/team-dna/avatars/demo-indian-woman.png"
        alt=""
      />
    </span>
  );
}

// Context chip as a working team picker: shows which team's Team DNA grounds
// the chat and lets multi-team members switch. Same quiet-pill pattern as the
// production memory-recall badge, upgraded to a dropdown.
function TeamDnaContextChip({ team, onSelectTeam }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="ai-dna-chip-menu" ref={rootRef}>
      <button
        type="button"
        className="ai-dna-badge ai-dna-badge--picker"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ai-dna-badge-dot" aria-hidden="true" />
        Using your Team DNA · {team.name}
        <svg
          className="ai-dna-badge-caret"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="ai-dna-chip-pop" role="menu" aria-label="Choose a team">
          {TEAM_DNA_CONTEXT_TEAMS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === team.id}
              data-active={option.id === team.id || undefined}
              onClick={() => {
                onSelectTeam(option);
                setOpen(false);
              }}
            >
              <span className="ai-dna-chip-pop-name">{option.name}</span>
              <span className="ai-dna-chip-pop-meta">
                {option.members} members
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LeftNav({
  onNewSession,
  activeSessionId,
  onSelectSession,
  activeExperience,
  onOpenExperience,
}) {
  return (
    <aside className="ai-leftnav" aria-label="Sessions">
      <button type="button" className="ai-leftnav-new" onClick={onNewSession}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.5v7M8.5 12h7" />
        </svg>
        Start a new session
      </button>

      <p className="ai-leftnav-heading">Your sessions</p>
      <div className="ai-leftnav-rule" aria-hidden="true" />
      <ul className="ai-leftnav-sessions">
        {SESSIONS.map((session) => (
          <li key={session.id}>
            <button
              type="button"
              data-active={session.id === activeSessionId || undefined}
              onClick={() => onSelectSession(session.id)}
            >
              <span aria-hidden="true">{session.emoji}</span> {session.title}
            </button>
          </li>
        ))}
      </ul>

      <p className="ai-leftnav-heading">AI experiences</p>
      <div className="ai-leftnav-rule" aria-hidden="true" />
      <ul className="ai-leftnav-experiences">
        {AI_EXPERIENCES.map((experience) => (
          <li key={experience.slug}>
            <button
              type="button"
              title={experience.description}
              data-active={experience.slug === activeExperience || undefined}
              onClick={() => onOpenExperience?.(experience.slug)}
            >
              <span className="ai-experience-thumb">
                {experience.slug === 'team-dna' ? (
                  <TeamDnaExperienceThumb />
                ) : (
                  <img src={experience.image} alt="" aria-hidden="true" />
                )}
              </span>
              <span className="ai-experience-title">{experience.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="ai-leftnav-heading ai-leftnav-heading--archived">
        Archived sessions
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </p>
    </aside>
  );
}

function CoachMessage({ message }) {
  return (
    <div className="ai-msg-coach">
      {message.note ? (
        <p className="ai-msg-note">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5 10 17.5 19 7" />
          </svg>
          {message.note}
        </p>
      ) : null}
      <div className="ai-msg-coach-row">
        <CoachOrb size={40} className="ai-orb--inline" />
        <div className="ai-msg-coach-body">
          {renderCoachText(message.text)}
          {!message.live ? (
            <div className="ai-msg-actions" aria-label="Message actions">
              <button type="button" aria-label="Helpful">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 10.5v9M7 11l4.2-6.8a1.8 1.8 0 0 1 3.3 1L13.6 9H18a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7" />
                </svg>
              </button>
              <button type="button" aria-label="Not helpful">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 13.5v-9M17 13l-4.2 6.8a1.8 1.8 0 0 1-3.3-1l.9-3.8H6a2 2 0 0 1-2-2.4l1.2-6a2 2 0 0 1 2-1.6H17" />
                </svg>
              </button>
              <button type="button" aria-label="Copy">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AiCoachingPage() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeExperience, setActiveExperience] = useState(null);
  const [anthropicKey, setAnthropicKey] = useState(readAnthropicKey);
  const [claudeError, setClaudeError] = useState('');
  // Team DNA context for the current session: the chip label users see, and
  // the custom instructions silently appended to Claude's system prompt.
  const [dnaBadge, setDnaBadge] = useState('');
  const [contextTeam, setContextTeam] = useState(TEAM_DNA_CONTEXT_TEAMS[0]);
  const dnaContextRef = useRef('');
  const threadRef = useRef(null);
  const replyIndexRef = useRef(0);

  const saveClaudeKey = (value) => {
    const trimmed = value.trim();
    if (trimmed) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    setClaudeError('');
    setAnthropicKey(readAnthropicKey());
  };
  const userHasActed = messages.length > 0;
  const isBusy = isThinking || isStreaming;
  const canSend = draft.trim().length > 0 && !isBusy;

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isThinking]);

  // A "Discuss with AI coach" CTA on Team DNA landed us here: pick up its
  // prompt + context and start the conversation immediately.
  const handoffConsumedRef = useRef(false);
  useEffect(() => {
    if (handoffConsumedRef.current) return;
    handoffConsumedRef.current = true;

    const handoff = consumeTeamDnaHandoff();
    if (!handoff?.message) return;

    dnaContextRef.current = handoff.instructions || TEAM_DNA_BASE_CONTEXT;
    setDnaBadge(handoff.title || 'Team DNA');
    sendMessage(handoff.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetSession = () => {
    setMessages([]);
    setDraft('');
    setIsThinking(false);
    setIsStreaming(false);
    setActiveSessionId(null);
    setActiveExperience(null);
    setDnaBadge('');
    dnaContextRef.current = '';
    replyIndexRef.current = 0;
  };

  const applyContextTeam = (team) => {
    setContextTeam(team);
    setDnaBadge(`Team DNA · ${team.name}`);
    // Only Flighthouse has real demo data; other teams get a light stub so the
    // picker interaction still visibly changes what the coach is told.
    dnaContextRef.current =
      team.id === 'flighthouse'
        ? TEAM_DNA_BASE_CONTEXT
        : [
            'Use the Team DNA context below when answering.',
            `Team: ${team.name} (${team.members} members).`,
            `The member you are coaching (${VIEWER_NAME}) is on this team.`,
            'Detailed Big Five results for this team are not loaded in this demo; coach from general Team DNA principles.',
          ].join('\n');
  };

  const openTeamDnaExperience = () => {
    resetSession();
    setActiveExperience('team-dna');
    applyContextTeam(TEAM_DNA_CONTEXT_TEAMS[0]);
  };

  const appendScriptedReply = () => {
    const script = dnaContextRef.current
      ? TEAM_DNA_COACH_REPLIES
      : COACH_REPLIES;
    const reply = script[Math.min(replyIndexRef.current, script.length - 1)];
    replyIndexRef.current += 1;

    window.setTimeout(() => {
      setIsThinking(false);
      setMessages((current) => [
        ...current,
        { id: `coach-${Date.now()}`, role: 'coach', ...reply },
      ]);
    }, 1400);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const history = [...messages, userMessage];

    setDraft('');
    setMessages(history);
    setIsThinking(true);

    if (!anthropicKey) {
      appendScriptedReply();
      return;
    }

    const coachId = `coach-${Date.now()}`;
    let started = false;
    setClaudeError('');

    try {
      await streamClaudeReply(
        anthropicKey,
        history,
        (delta) => {
          if (!started) {
            started = true;
            setIsThinking(false);
            setIsStreaming(true);
            setMessages((current) => [
              ...current,
              { id: coachId, role: 'coach', text: delta, live: true },
            ]);
          } else {
            setMessages((current) =>
              current.map((message) =>
                message.id === coachId
                  ? { ...message, text: message.text + delta }
                  : message
              )
            );
          }
        },
        dnaContextRef.current
      );
      setMessages((current) =>
        current.map((message) =>
          message.id === coachId ? { ...message, live: false } : message
        )
      );
    } catch (error) {
      console.warn('[ai-coaching] Claude call failed, using script:', error);
      setClaudeError(error?.message || 'Unknown error');
      if (started) {
        setMessages((current) =>
          current.filter((message) => message.id !== coachId)
        );
      }
      appendScriptedReply();
      return;
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="ai-coaching-shell">
      <MonolithPrimaryNav
        activeLabel="AI Coaching"
        endExtra={
          <ClaudeConnectControl
            connected={Boolean(anthropicKey)}
            error={claudeError}
            onSaveKey={saveClaudeKey}
          />
        }
      />
      <div className="ai-coaching-body">
        <LeftNav
          onNewSession={resetSession}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          activeExperience={activeExperience}
          onOpenExperience={(slug) => {
            if (slug === 'team-dna') openTeamDnaExperience();
          }}
        />

        <main className="ai-main" aria-label="AI coaching session">
          <button
            type="button"
            className="ai-sidebar-toggle"
            aria-label="Open insights sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14.5 7 10 12l4.5 5" />
            </svg>
          </button>

          <div className="ai-thread" ref={threadRef}>
            {dnaBadge && userHasActed ? (
              <p className="ai-dna-badge" role="status">
                <span className="ai-dna-badge-dot" aria-hidden="true" />
                Using your Team DNA · {dnaBadge}
              </p>
            ) : null}
            {!userHasActed && activeExperience === 'team-dna' ? (
              <div className="ai-empty-header ai-empty-header--dna">
                <CoachOrb size={120} />
                <h1>Explore your Team DNA</h1>
                <TeamDnaContextChip
                  team={contextTeam}
                  onSelectTeam={applyContextTeam}
                />
                <div className="ai-empty-greeting">
                  <p>
                    Let&rsquo;s talk through how you and your team work
                    together — your strengths, your teammates&rsquo; styles,
                    and where they meet. Pick a starting point, or ask
                    anything.
                  </p>
                </div>
                <div
                  className="ai-dna-starters"
                  aria-label="Team DNA conversation starters"
                >
                  {TEAM_DNA_STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter.id}
                      type="button"
                      className="ai-dna-starter"
                      onClick={() => sendMessage(starter.prompt)}
                    >
                      <span className="ai-dna-starter-label">
                        {starter.label}
                      </span>
                      <span className="ai-dna-starter-prompt">
                        {starter.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : !userHasActed ? (
              <div className="ai-empty-header">
                <CoachOrb size={120} />
                <h1>Welcome back, {VIEWER_NAME}</h1>
                <div className="ai-empty-greeting">
                  <p>
                    <span aria-hidden="true">👋</span> Hello! I&rsquo;m ready
                    to jump into your AI coaching session.
                  </p>
                  <p className="ai-msg-question">
                    What&rsquo;s on your mind today?
                  </p>
                </div>
              </div>
            ) : (
              <div className="ai-messages">
                {messages.map((message) =>
                  message.role === 'user' ? (
                    <div key={message.id} className="ai-msg-user">
                      {message.text}
                    </div>
                  ) : (
                    <CoachMessage key={message.id} message={message} />
                  )
                )}
                {isThinking ? (
                  <div className="ai-msg-coach-row">
                    <CoachOrb size={40} className="ai-orb--inline" />
                    <span className="ai-thinking" aria-label="Coach is typing">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="ai-composer-wrap">
            {claudeError ? (
              <p className="ai-claude-error" role="status">
                Claude call failed ({claudeError}) — showing scripted replies.
                Check the key via the “AI error” chip in the nav.
              </p>
            ) : null}
            <form
              className="ai-composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(draft);
              }}
            >
              <textarea
                rows={2}
                placeholder="I'd like to talk about..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(draft);
                  }
                }}
              />
              <div className="ai-composer-actions">
                <button
                  type="button"
                  className="ai-composer-mic"
                  aria-label="Start voice recording"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9.2" y="3.5" width="5.6" height="10.5" rx="2.8" />
                    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                    <path d="M12 18v3" />
                  </svg>
                </button>
                {canSend ? (
                  <button
                    type="submit"
                    className="ai-composer-voice"
                    aria-label="Send message"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ai-composer-voice"
                    aria-label="Enable voice mode"
                    disabled={isBusy}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4.5 10v4M8.25 7v10M12 4.5v15M15.75 7v10M19.5 10v4" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
            <p className="ai-disclaimer">
              AI-generated responses may not be accurate, please use your own
              judgment.
              <br />
              We never share individual information with your employer.{' '}
              <a href="#privacy" onClick={(event) => event.preventDefault()}>
                Learn about your privacy.
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

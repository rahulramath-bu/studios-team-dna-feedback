import React from 'react';
import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from '../data/bigFiveTraits.js';

const SUBJECT_COLORS = [
  'var(--primary)',
  'var(--data-series-one)',
  'var(--data-series-three)',
  'var(--green-aa)',
  'var(--purple)',
  'var(--data-series-five)',
  'var(--blue-aa)',
  'var(--red)',
  'var(--green)',
  'var(--data-series-six)',
  'var(--data-series-four)',
  'var(--data-series-two)',
];

const SPECTRUM_AUTO_ADVANCE_MS = 12000;
const SPECTRUM_TRANSITION_MS = 400;
const SPECTRUM_VIEW_FADE_MS = 320;
const SPECTRUM_VIEW_HEIGHT_MS = 520;

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener?.('change', updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function getCarouselDirection(currentIndex, nextIndex, itemCount) {
  if (itemCount <= 1 || currentIndex === nextIndex) {
    return 1;
  }

  if (currentIndex === itemCount - 1 && nextIndex === 0) {
    return 1;
  }

  if (currentIndex === 0 && nextIndex === itemCount - 1) {
    return -1;
  }

  return nextIndex > currentIndex ? 1 : -1;
}

function getPromptText(trait, subjectCount) {
  if (subjectCount === 1) {
    return trait.promptSingular ?? trait.shortLabel;
  }

  return trait.promptPlural ?? trait.shortLabel;
}

function getSpectrumReadText(trait, subjects, reads) {
  if (reads?.[trait.key]) {
    return reads[trait.key];
  }

  if (subjects.length !== 2) {
    return null;
  }

  const firstScore = getBigFiveScore(subjects[0], trait.key);
  const secondScore = getBigFiveScore(subjects[1], trait.key);
  const distance = Math.abs(firstScore - secondScore);
  const average = (firstScore + secondScore) / 2;
  const copy = trait.duoRead ?? {};

  if (distance >= 30) {
    return copy.wide ?? 'Together, the mix gets useful.';
  }

  if (distance >= 16) {
    return copy.offset ?? 'Together, something new shows up.';
  }

  if (average <= 40) {
    return copy.lowAligned ?? 'Together, the pattern gets stronger.';
  }

  if (average >= 60) {
    return copy.highAligned ?? 'Together, the pattern gets stronger.';
  }

  return copy.middleAligned ?? 'Together, we meet near the middle.';
}

function renderDuoReadText(text, keyword) {
  const matchIndex = text.toLowerCase().indexOf(keyword.toLowerCase());

  if (matchIndex === -1) {
    return text;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + keyword.length);
  const after = text.slice(matchIndex + keyword.length);

  return (
    <>
      {before}
      <span className="big-five-spectrum-keyword">{match}</span>
      {after}
    </>
  );
}

function renderSpectrumHead(trait, subjects, reads) {
  const duoRead = getSpectrumReadText(trait, subjects, reads);

  if (duoRead) {
    return renderDuoReadText(duoRead, trait.duoKeyword ?? trait.shortLabel);
  }

  return getPromptText(trait, subjects.length);
}

function getQuantile(sortedScores, quantile) {
  if (sortedScores.length === 1) {
    return sortedScores[0];
  }

  const position = (sortedScores.length - 1) * quantile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;

  return (
    sortedScores[lowerIndex] * (1 - weight) +
    sortedScores[upperIndex] * weight
  );
}

function getPercentBand(start, end, minWidth) {
  const width = end - start;

  if (width >= minWidth) {
    return { left: start, width };
  }

  const center = (start + end) / 2;
  const left = Math.max(0, Math.min(100 - minWidth, center - minWidth / 2));

  return { left, width: minWidth };
}

function getTeamDistribution(subjects, trait) {
  const scores = subjects
    .map((subject) => getBigFiveScore(subject, trait.key))
    .sort((a, b) => a - b);
  const min = scores[0];
  const max = scores[scores.length - 1];
  const mean =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  const q1 = getQuantile(scores, 0.25);
  const q3 = getQuantile(scores, 0.75);

  return {
    cluster: getPercentBand(q1, q3, 10),
    mean,
    range: getPercentBand(min, max, 2),
  };
}

/**
 * Flexible Big Five spectrum list.
 *
 * What: renders one or more Big Five trait rows with one, two, or many subject
 * markers on each spectrum.
 * How: accepts a trait subset and a subject array, then maps each subject's
 * normalized `bigFive` scores to horizontal marker positions.
 * Port: keep this visualization API stable. Backend data should be normalized
 * into subjects before it reaches this component.
 */
export function BigFiveSpectrumList({
  subjects,
  traits = BIG_FIVE_TRAITS,
  reads,
}) {
  const visibleSubjects = subjects.filter((subject) => subject?.bigFive);
  const [activeTraitIndex, setActiveTraitIndex] = React.useState(0);
  const [displayedTraitIndex, setDisplayedTraitIndex] = React.useState(0);
  const [transitionPhase, setTransitionPhase] = React.useState('idle');
  const [transitionDirection, setTransitionDirection] = React.useState(1);
  const [isPaused, setIsPaused] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('carousel');
  const [isViewFading, setIsViewFading] = React.useState(false);
  const [bodyHeight, setBodyHeight] = React.useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const transitionTimeoutRef = React.useRef(null);
  const transitionFrameRef = React.useRef(null);
  const viewTimeoutsRef = React.useRef([]);
  const bodyRef = React.useRef(null);
  const displayedTrait = traits[displayedTraitIndex] ?? traits[0];
  const isShowingAll = viewMode === 'all';

  const clearViewTimeouts = React.useCallback(() => {
    viewTimeoutsRef.current.forEach((timeout) => {
      window.clearTimeout(timeout);
    });
    viewTimeoutsRef.current = [];
  }, []);

  React.useEffect(() => {
    setActiveTraitIndex((index) =>
      traits.length === 0 ? 0 : Math.min(index, traits.length - 1)
    );
    setDisplayedTraitIndex((index) =>
      traits.length === 0 ? 0 : Math.min(index, traits.length - 1)
    );
  }, [traits.length]);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      if (transitionFrameRef.current) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }
      clearViewTimeouts();
    };
  }, [clearViewTimeouts]);

  const showTrait = React.useCallback(
    (index) => {
      if (traits.length === 0) {
        return;
      }

      const nextIndex = ((index % traits.length) + traits.length) % traits.length;
      const direction = getCarouselDirection(
        displayedTraitIndex,
        nextIndex,
        traits.length
      );
      setTransitionDirection(direction);
      setActiveTraitIndex(nextIndex);

      if (nextIndex === displayedTraitIndex) {
        return;
      }

      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      if (prefersReducedMotion) {
        setDisplayedTraitIndex(nextIndex);
        setTransitionPhase('idle');
        return;
      }

      if (transitionFrameRef.current) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }

      setTransitionPhase('exiting');
      transitionTimeoutRef.current = window.setTimeout(() => {
        setDisplayedTraitIndex(nextIndex);
        setTransitionPhase('entering');
        transitionFrameRef.current = window.requestAnimationFrame(() => {
          transitionFrameRef.current = window.requestAnimationFrame(() => {
            setTransitionPhase('idle');
          });
        });
      }, SPECTRUM_TRANSITION_MS);
    },
    [displayedTraitIndex, prefersReducedMotion, traits.length]
  );

  React.useEffect(() => {
    if (viewMode !== 'carousel' || prefersReducedMotion || isPaused || traits.length <= 1) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      showTrait(activeTraitIndex + 1);
    }, SPECTRUM_AUTO_ADVANCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeTraitIndex, isPaused, prefersReducedMotion, showTrait, traits.length, viewMode]);

  if (visibleSubjects.length === 0) {
    return (
      <div className="big-five-empty">
        <p>Spectrum appears when assessment data is available.</p>
      </div>
    );
  }

  const pauseCarousel = () => setIsPaused(true);
  const resumeCarousel = () => {
    setIsPaused(false);
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      resumeCarousel();
    }
  };

  const handleStepClick = (index) => {
    showTrait(index);
  };

  const getCarouselBodyHeight = () => {
    const row = bodyRef.current?.querySelector('.big-five-spectrum-row');
    const head = row?.querySelector('.big-five-spectrum-head');
    const track = row?.querySelector('.big-five-spectrum-track');

    if (!row || !head || !track || typeof window === 'undefined') {
      return bodyRef.current?.offsetHeight ?? null;
    }

    const rowStyle = window.getComputedStyle(row);
    const gap = parseFloat(rowStyle.rowGap || rowStyle.gap) || 0;

    return head.offsetHeight + track.offsetHeight + gap;
  };

  const handleViewToggle = () => {
    const nextMode = isShowingAll ? 'carousel' : 'all';
    clearViewTimeouts();

    if (prefersReducedMotion) {
      setViewMode(nextMode);
      setIsPaused(nextMode === 'all');
      return;
    }

    setIsPaused(true);
    setBodyHeight(bodyRef.current?.offsetHeight ?? null);
    setIsViewFading(true);

    const switchTimeout = window.setTimeout(() => {
      if (nextMode === 'carousel') {
        setBodyHeight(getCarouselBodyHeight());
        setViewMode(nextMode);
      } else {
        setViewMode(nextMode);
      }

      window.requestAnimationFrame(() => {
        if (nextMode !== 'carousel') {
          setBodyHeight(bodyRef.current?.scrollHeight ?? null);
        }
        window.requestAnimationFrame(() => {
          setIsViewFading(false);
        });

        const unlockTimeout = window.setTimeout(() => {
          setBodyHeight(null);
          if (nextMode === 'carousel') {
            setIsPaused(false);
          }
        }, SPECTRUM_VIEW_HEIGHT_MS);

        viewTimeoutsRef.current.push(unlockTimeout);
      });
    }, SPECTRUM_VIEW_FADE_MS);

    viewTimeoutsRef.current = [switchTimeout];
  };

  return (
    <div
      className="big-five-spectrum-list"
      data-paused={isPaused ? 'true' : undefined}
      data-reduced-motion={prefersReducedMotion ? 'true' : undefined}
      data-view={viewMode}
      onBlurCapture={handleBlur}
      onFocusCapture={pauseCarousel}
      onMouseEnter={pauseCarousel}
      onMouseLeave={resumeCarousel}
    >
      <button
        className="big-five-spectrum-view-toggle"
        disabled={isViewFading}
        key={viewMode}
        onClick={handleViewToggle}
        type="button"
      >
        {isShowingAll ? 'Show less' : 'Show all'}
      </button>

      <div
        className="big-five-spectrum-view-body"
        data-fading={isViewFading ? 'true' : undefined}
        data-height-locked={bodyHeight !== null ? 'true' : undefined}
        ref={bodyRef}
        style={bodyHeight !== null ? { height: `${bodyHeight}px` } : undefined}
      >
        {isShowingAll ? (
          <div className="big-five-spectrum-all">
            {traits.map((trait) => (
              <SpectrumRow
                key={trait.key}
                reads={reads}
                subjects={visibleSubjects}
                trait={trait}
              />
            ))}
          </div>
        ) : (
          <div
            className="big-five-spectrum-stage"
            data-phase={transitionPhase}
            style={{ '--spectrum-direction': transitionDirection }}
          >
            {displayedTrait ? (
              <SpectrumRow
                key={displayedTrait.key}
                reads={reads}
                subjects={visibleSubjects}
                trait={displayedTrait}
              />
            ) : null}
          </div>
        )}
      </div>

      {!isShowingAll ? (
        <div className="big-five-spectrum-progress" aria-label="Big Five traits">
          {traits.map((trait, index) => {
            const isActive = index === activeTraitIndex;

            return (
              <button
                aria-label={`Show ${trait.shortLabel ?? trait.label}`}
                aria-pressed={isActive}
                className="big-five-spectrum-step"
                data-active={isActive ? 'true' : undefined}
                key={trait.key}
                onClick={() => handleStepClick(index)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SpectrumRow({ trait, subjects, reads }) {
  return (
    <div className="big-five-spectrum-row">
      <div className="big-five-spectrum-head">
        <span>{renderSpectrumHead(trait, subjects, reads)}</span>
      </div>
      <div
        className="big-five-spectrum-track"
        aria-label={`${trait.label} spectrum`}
      >
        <span className="big-five-spectrum-end low">{trait.lowLabel}</span>
        <span className="big-five-spectrum-end high">{trait.highLabel}</span>
        <span className="big-five-spectrum-line" />
        {subjects.length > 2 ? (
          <TeamDistribution subjects={subjects} trait={trait} />
        ) : (
          subjects.map((subject, index) => {
            const score = getBigFiveScore(subject, trait.key);
            const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

            return (
              <span
                key={`${subject.id}-${trait.key}`}
                className="big-five-spectrum-marker"
                style={{
                  left: `${score}%`,
                  '--subject-color': color,
                  zIndex: 10 + index,
                }}
                aria-label={`${subject.name}. ${trait.label}: ${score} out of 100.`}
                tabIndex={0}
              >
                <span className="big-five-spectrum-avatar" aria-hidden="true">
                  {subject.avatarUrl ? (
                    <img src={subject.avatarUrl} alt="" />
                  ) : (
                    <span>{getInitials(subject.name)}</span>
                  )}
                </span>
                <span className="big-five-spectrum-tooltip" role="tooltip">
                  <strong>{subject.name}</strong>
                  <span>
                    {trait.label}: {score}/100
                  </span>
                </span>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

function TeamDistribution({ subjects, trait }) {
  const distribution = getTeamDistribution(subjects, trait);

  return (
    <span
      className="big-five-spectrum-distribution"
      aria-label={`${trait.label} team range ${Math.round(
        distribution.range.left
      )} to ${Math.round(
        distribution.range.left + distribution.range.width
      )}, team average ${Math.round(distribution.mean)} out of 100.`}
    >
      <span
        className="big-five-spectrum-range"
        style={{
          left: `${distribution.range.left}%`,
          width: `${distribution.range.width}%`,
        }}
      />
      <span
        className="big-five-spectrum-density"
        style={{
          left: `${distribution.cluster.left}%`,
          width: `${distribution.cluster.width}%`,
        }}
      />
      <span
        className="big-five-spectrum-mean"
        style={{ left: `${distribution.mean}%` }}
      />
    </span>
  );
}

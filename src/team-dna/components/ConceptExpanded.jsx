import React from 'react';
import { Face } from './conceptPrimitives.jsx';
import { getScopeWidgets } from '../data/conceptReadModel.js';

/**
 * Concept 1 · "Expanded" — the original page, expanded.
 *
 * What: the highlights row the Expanded concept adds under the hero: three
 * "here are the top things you can learn" widgets. Each widget opens the
 * Dive deeper modal on the section it came from (top strength -> why these
 * strengths, growth edge -> why these growth areas, stand-out -> the Big
 * Five explainer) — never a generic destination.
 * How: widgets come from getScopeWidgets, which returns the same three-slot
 * schema for team, person, and pair scopes, so this row scales across
 * scopes with zero layout branching. The whole card is the button; the
 * corner arrow is the only affordance chrome.
 */

export function ConceptWidgetsRow({
  scope,
  subjects,
  allSubjects,
  variant,
  onOpenDeeper,
}) {
  const widgets = getScopeWidgets({ scope, subjects, allSubjects });

  return (
    <div
      className={['cw-row', variant === 'hero' ? 'cw-row--hero' : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="What you can learn here"
    >
      {widgets.map((widget) => (
        <button
          key={widget.key}
          type="button"
          className="cw-widget"
          onClick={() => onOpenDeeper?.(widget.section)}
          aria-label={`${widget.label}: dive deeper`}
        >
          <span className="cw-widget-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17 17 7M9 7h8v8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="cw-widget-label">{widget.label}</p>
          {widget.value ? (
            <p
              className={[
                'cw-widget-value',
                /^\d+$/.test(widget.value) || widget.value.startsWith('Top')
                  ? ''
                  : 'cw-widget-value--word',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {widget.value}
              {widget.unit ? (
                <span className="cw-widget-unit">{widget.unit}</span>
              ) : null}
              {widget.faces?.length ? (
                <span className="cw-widget-faces">
                  {widget.faces.map((member) => (
                    <Face key={member.id} member={member} size={22} />
                  ))}
                </span>
              ) : null}
            </p>
          ) : null}
          <p
            className={[
              'cw-widget-line',
              widget.value ? '' : 'cw-widget-line--lead',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {widget.line}
          </p>
        </button>
      ))}
    </div>
  );
}

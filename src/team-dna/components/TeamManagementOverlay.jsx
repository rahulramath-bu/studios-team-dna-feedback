import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { TEAM_TYPE_OPTIONS } from '../data/teamManagementMock.js';

function getEmployeeName(employee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ')
    || employee.email
    || 'Teammate';
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getInitials(value) {
  return String(value)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const EMPTY_TEAM_RECORD = {
  id: null,
  name: '',
  teamType: 'Direct reports',
  memberEmployeeIds: [],
  invitedEmails: [],
  sample: false,
};

const MEMBER_CARD_MOTION = {
  layout: true,
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: {
    layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
    opacity: { duration: 0.18 },
    y: { duration: 0.22 },
    scale: { duration: 0.22 },
  },
};

const ADD_CARD_LAYOUT_TRANSITION = {
  layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
};

/**
 * Prototype team management overlay.
 *
 * What: minimal add/edit surface for creating a team, selecting employees from
 * the organization directory, and staging manual email invites.
 * How: edits the temporary `mockTeamRecords` shape only; it does not send real
 * invites, persist data, or own Team DNA result fields. Its shell mirrors the
 * monolith right-side Sheet pattern: viewport-fixed, above the app shell, a
 * dimmed non-blurred backdrop, backdrop-click close, backdrop fade, and a
 * transform-only right slide for the panel.
 * Port: replace this hand-rolled shell with
 * `@betterup/component-library/src/components/ui/sheet` using `<Sheet>` and
 * `<SheetContent side="right">`, similar to Partner configuration's
 * `OutcomeFormModal`. Wire Save to real Team/TeamMembership mutations. Keep
 * employee search fed by the organization employee directory and keep DNA
 * results outside this form.
 */
export function TeamManagementOverlay({
  mode = 'create',
  organizationEmployees,
  initialDemoState,
  teamDnaResultsByEmployeeId = {},
  teamRecord,
  onCancel,
  onSave,
  onTeamManagementAction,
}) {
  const sourceRecord = teamRecord ?? EMPTY_TEAM_RECORD;
  const [isClosing, setIsClosing] = useState(false);
  const [teamName, setTeamName] = useState(sourceRecord.name);
  const [teamType, setTeamType] = useState(
    sourceRecord.teamType || 'Direct reports'
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    sourceRecord.memberEmployeeIds
  );
  const [invitedEmails, setInvitedEmails] = useState(sourceRecord.invitedEmails);
  const [isAddingTeammate, setIsAddingTeammate] = useState(false);
  const [isAddCardWaiting, setIsAddCardWaiting] = useState(false);
  const [recentlyAddedMemberKey, setRecentlyAddedMemberKey] = useState(null);
  const [notifyNewTeammates, setNotifyNewTeammates] = useState(true);
  const [reminderStatusesByMemberKey, setReminderStatusesByMemberKey] =
    useState(() => ({}));
  const [bodyScrollState, setBodyScrollState] = useState({
    canScrollDown: false,
    canScrollUp: false,
  });
  const [searchScrollState, setSearchScrollState] = useState({
    canScrollDown: false,
    canScrollUp: false,
  });
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [query, setQuery] = useState('');
  const bodyRef = useRef(null);
  const addCardRef = useRef(null);
  const searchResultsRef = useRef(null);
  const searchInputRef = useRef(null);
  const addCardTimerRef = useRef(null);
  const recentlyAddedTimerRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const selectedEmployeeIdSet = useMemo(
    () => new Set(selectedEmployeeIds),
    [selectedEmployeeIds]
  );
  const invitedEmailSet = useMemo(
    () => new Set(invitedEmails.map(normalizeEmail)),
    [invitedEmails]
  );
  const filteredEmployees = useMemo(() => {
    if (!normalizedQuery) return [];

    return organizationEmployees
      .filter((employee) => {
        const name = getEmployeeName(employee).toLowerCase();
        const matchesQuery =
          name.includes(normalizedQuery) ||
          employee.email?.toLowerCase().includes(normalizedQuery) ||
          employee.title?.toLowerCase().includes(normalizedQuery);

        return !selectedEmployeeIdSet.has(employee.id) && matchesQuery;
      })
      .slice(0, 6);
  }, [normalizedQuery, organizationEmployees, selectedEmployeeIdSet]);
  const selectedEmployees = selectedEmployeeIds
    .map((employeeId) =>
      organizationEmployees.find((employee) => employee.id === employeeId)
    )
    .filter(Boolean);
  const sourceEmployeeIdSet = useMemo(
    () => new Set(sourceRecord.memberEmployeeIds),
    [sourceRecord.memberEmployeeIds]
  );
  const sourceInviteEmailSet = useMemo(
    () => new Set(sourceRecord.invitedEmails.map(normalizeEmail)),
    [sourceRecord.invitedEmails]
  );
  const teamMemberCount = selectedEmployees.length + invitedEmails.length;
  const newPendingEmployeeCount = selectedEmployees.filter(
    (employee) =>
      !sourceEmployeeIdSet.has(employee.id) &&
      teamDnaResultsByEmployeeId[employee.id]?.assessmentComplete !== true
  ).length;
  const newPendingInviteCount = invitedEmails.filter(
    (email) => !sourceInviteEmailSet.has(normalizeEmail(email))
  ).length;
  const newPendingCount = newPendingEmployeeCount + newPendingInviteCount;
  const canInviteQuery =
    looksLikeEmail(query) &&
    !organizationEmployees.some(
      (employee) => employee.email?.toLowerCase() === normalizedQuery
    ) &&
    !invitedEmailSet.has(normalizedQuery);
  const searchResults = useMemo(() => {
    const employeeResults = filteredEmployees.map((employee) => ({
      type: 'employee',
      employee,
      key: `employee:${employee.id}`,
    }));

    if (!canInviteQuery) return employeeResults;

    return [
      ...employeeResults,
      {
        type: 'email',
        email: normalizeEmail(query),
        key: `email:${normalizeEmail(query)}`,
      },
    ];
  }, [canInviteQuery, filteredEmployees, query]);
  const saveLabel = 'Save team';
  const title = mode === 'edit' ? 'Edit team' : 'Add team';
  const activeSearchResult = searchResults[activeSearchIndex] ?? null;

  useEffect(() => {
    setTeamName(sourceRecord.name);
    setSelectedEmployeeIds(sourceRecord.memberEmployeeIds);
    setInvitedEmails(sourceRecord.invitedEmails);
    setIsAddingTeammate(Boolean(initialDemoState?.isAddingTeammate));
    setIsAddCardWaiting(false);
    setRecentlyAddedMemberKey(null);
    setNotifyNewTeammates(true);
    setReminderStatusesByMemberKey(initialDemoState?.reminderStatuses ?? {});
    setQuery(initialDemoState?.query ?? '');
  }, [initialDemoState, sourceRecord]);

  useEffect(() => {
    if (isAddingTeammate) {
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus({ preventScroll: true });
        addCardRef.current?.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
        });
      });
    }
  }, [isAddingTeammate]);

  const updateBodyScrollState = () => {
    const body = bodyRef.current;
    if (!body) return;

    setBodyScrollState({
      canScrollDown: body.scrollTop + body.clientHeight < body.scrollHeight - 2,
      canScrollUp: body.scrollTop > 2,
    });
  };

  const updateSearchScrollState = () => {
    const scroller = searchResultsRef.current;
    if (!scroller) {
      setSearchScrollState({ canScrollDown: false, canScrollUp: false });
      return;
    }

    setSearchScrollState({
      canScrollDown:
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2,
      canScrollUp: scroller.scrollTop > 2,
    });
  };

  useEffect(() => {
    window.requestAnimationFrame(updateBodyScrollState);
    window.requestAnimationFrame(updateSearchScrollState);
  }, [
    isAddingTeammate,
    isAddCardWaiting,
    query,
    searchResults.length,
    selectedEmployeeIds,
    invitedEmails,
  ]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (activeSearchIndex <= Math.max(searchResults.length - 1, 0)) return;
    setActiveSearchIndex(Math.max(searchResults.length - 1, 0));
  }, [activeSearchIndex, searchResults.length]);

  const prepareAddedCardAnimation = (memberKey) => {
    window.clearTimeout(addCardTimerRef.current);
    window.clearTimeout(recentlyAddedTimerRef.current);
    setRecentlyAddedMemberKey(memberKey);
    setIsAddCardWaiting(true);
    addCardTimerRef.current = window.setTimeout(() => {
      setIsAddCardWaiting(false);
      setIsAddingTeammate(false);
    }, 420);
    recentlyAddedTimerRef.current = window.setTimeout(() => {
      setRecentlyAddedMemberKey(null);
    }, 720);
  };

  const addEmployee = (employeeId) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId) ? current : [...current, employeeId]
    );
    prepareAddedCardAnimation(`employee:${employeeId}`);
    setIsAddingTeammate(false);
    setQuery('');
  };

  const addActiveSearchResult = () => {
    if (activeSearchResult?.type === 'employee') {
      addEmployee(activeSearchResult.employee.id);
      return;
    }

    if (activeSearchResult?.type === 'email') {
      addInvite(activeSearchResult.email);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && searchResults.length > 0) {
      event.preventDefault();
      setActiveSearchIndex((current) => (current + 1) % searchResults.length);
      return;
    }

    if (event.key === 'ArrowUp' && searchResults.length > 0) {
      event.preventDefault();
      setActiveSearchIndex(
        (current) => (current - 1 + searchResults.length) % searchResults.length
      );
      return;
    }

    if (event.key !== 'Enter') return;
    if (!activeSearchResult) return;

    event.preventDefault();
    addActiveSearchResult();
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployeeIds((current) =>
      current.filter((id) => id !== employeeId)
    );
  };

  const addInvite = (email) => {
    const normalizedEmail = normalizeEmail(email);
    setInvitedEmails((current) =>
      current.map(normalizeEmail).includes(normalizedEmail)
        ? current
        : [...current, normalizedEmail]
    );
    prepareAddedCardAnimation(`invite:${normalizedEmail}`);
    setIsAddingTeammate(false);
    setQuery('');
  };

  const removeInvite = (email) => {
    const normalizedEmail = normalizeEmail(email);
    setInvitedEmails((current) =>
      current.filter((item) => normalizeEmail(item) !== normalizedEmail)
    );
  };

  /**
   * What: prototype action seam for user-triggered team management side effects.
   * How: emits structured intent and returns the caller's promise so row-level
   * UI can wait for pending/success/failure instead of lying optimistically.
   * Port: wire this callback to real mutations/events for assessment reminders,
   * team saves, analytics, and toast feedback.
   */
  const emitTeamManagementAction = (type, payload) => {
    return onTeamManagementAction?.({
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
  };

  const setReminderStatus = (memberKey, status) => {
    setReminderStatusesByMemberKey((current) => ({
      ...current,
      [memberKey]: status,
    }));
  };

  const requestAssessmentReminder = async (memberKey, payload) => {
    if (reminderStatusesByMemberKey[memberKey] === 'pending') return;

    setReminderStatus(memberKey, 'pending');

    try {
      await emitTeamManagementAction('assessmentReminderRequested', payload);
      setReminderStatus(memberKey, 'sent');
    } catch (error) {
      setReminderStatus(memberKey, 'error');
    }
  };

  const remindEmployee = (employee) => {
    requestAssessmentReminder(`employee:${employee.id}`, {
      source: 'organizationEmployee',
      employeeId: employee.id,
      email: employee.email,
      name: getEmployeeName(employee),
    });
  };

  const remindInvite = (email) => {
    const normalizedEmail = normalizeEmail(email);

    requestAssessmentReminder(`invite:${normalizedEmail}`, {
      source: 'manualInvite',
      email: normalizedEmail,
      name: normalizedEmail,
    });
  };

  const saveTeam = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onSave?.({
        id: sourceRecord.id,
        name: teamName,
        teamType,
        memberEmployeeIds: selectedEmployeeIds,
        invitedEmails,
        sample: sourceRecord.sample,
        notificationPreference: {
          notifyNewPendingTeammates: notifyNewTeammates && newPendingCount > 0,
        },
      });
    }, 260);
  };

  const closeTeamManagement = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onCancel?.();
    }, 260);
  };

  const closeFromBackdrop = (event) => {
    if (event.target === event.currentTarget) {
      closeTeamManagement();
    }
  };

  const closeAddTeammate = () => {
    setIsAddingTeammate(false);
    setQuery('');
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        if (isAddingTeammate) {
          closeAddTeammate();
        } else {
          closeTeamManagement();
        }
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  });

  useEffect(() => {
    if (!isAddingTeammate) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!addCardRef.current?.contains(event.target)) {
        closeAddTeammate();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isAddingTeammate]);

  useEffect(() => {
    return () => {
      window.clearTimeout(addCardTimerRef.current);
      window.clearTimeout(recentlyAddedTimerRef.current);
    };
  }, []);

  return (
    <div
      className="team-management-overlay"
      data-state={isClosing ? 'closed' : 'open'}
      onMouseDown={closeFromBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-management-title"
    >
      <div className="team-management-panel">
        <header className="team-management-header">
          <div>
            <p className="team-management-eyebrow">Team management</p>
            <h2 id="team-management-title">{title}</h2>
          </div>
          <button
            type="button"
            className="team-management-icon-button"
            onClick={closeTeamManagement}
            aria-label="Close team management"
          >
            <BetterUpIcon name="X" size={18} strokeWidth={2} />
          </button>
        </header>

        <div
          ref={bodyRef}
          className="team-management-body"
          data-can-scroll-down={bodyScrollState.canScrollDown || undefined}
          data-can-scroll-up={bodyScrollState.canScrollUp || undefined}
          onScroll={updateBodyScrollState}
        >
          <label className="team-management-field">
            <span>Team name</span>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Name this team"
            />
          </label>

          <div className="team-management-field team-management-field--type">
            <span>Team type</span>
            <div className="team-type-grid" role="radiogroup" aria-label="Team type">
              {TEAM_TYPE_OPTIONS.map((option) => {
                const isActive = teamType === option;

                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className="team-type-chip"
                    data-active={isActive || undefined}
                    onClick={() => setTeamType(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <p className="team-management-field-helper">
              Team DNA, Pulse, and Coaching can work for any group you work with.
            </p>
          </div>

          <section className="team-management-section team-management-section--members">
            <div className="team-management-selected-heading">
              <span>Team members</span>
            </div>
            <div
              className="team-management-member-grid"
              aria-label="Selected team members"
            >
              <LayoutGroup id="team-management-members">
                <AnimatePresence initial={false} mode="popLayout">
                  {selectedEmployees.map((employee) => {
                    const hasTeamDna =
                      teamDnaResultsByEmployeeId[employee.id]?.assessmentComplete === true;
                    const reminderStatus =
                      reminderStatusesByMemberKey[`employee:${employee.id}`];
                    const reminderPending = reminderStatus === 'pending';
                    const reminderSent = reminderStatus === 'sent';

                    return (
                      <motion.div
                        key={employee.id}
                        className="team-management-card team-management-member-card"
                        data-assessment-pending={!hasTeamDna || undefined}
                        data-recently-added={
                          recentlyAddedMemberKey === `employee:${employee.id}` ||
                          undefined
                        }
                        {...MEMBER_CARD_MOTION}
                      >
                        <span className="team-management-member-avatar-wrap">
                          <span className="team-management-avatar" aria-hidden="true">
                            {employee.avatar ? (
                              <img src={employee.avatar} alt="" />
                            ) : (
                              getInitials(getEmployeeName(employee))
                            )}
                          </span>
                        </span>
                        <span className="team-management-row-copy">
                          <strong>{getEmployeeName(employee)}</strong>
                          {hasTeamDna ? (
                            <small>{employee.title || employee.email}</small>
                          ) : (
                            <small className="team-management-inline-pending">
                              Assessment pending...
                            </small>
                          )}
                        </span>
                        {!hasTeamDna && (
                          <span className="team-management-row-actions">
                            <button
                              type="button"
                              className="team-management-remind-button"
                              aria-label={`Remind ${getEmployeeName(employee)} to complete assessment`}
                              title="Send assessment reminder"
                              disabled={reminderPending}
                              data-pending={reminderPending || undefined}
                              data-sent={reminderSent || undefined}
                              onClick={(event) => {
                                event.stopPropagation();
                                remindEmployee(employee);
                              }}
                            >
                              {reminderPending
                                ? 'Sending...'
                                : reminderSent
                                  ? 'Reminder sent!'
                                  : 'Remind'}
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          className="team-management-remove-icon"
                          onClick={() => removeEmployee(employee.id)}
                          aria-label={`Remove ${getEmployeeName(employee)}`}
                        >
                          <BetterUpIcon name="Trash" size={15} strokeWidth={1.8} />
                        </button>
                      </motion.div>
                    );
                  })}
                  {invitedEmails.map((email) => {
                    const normalizedEmail = normalizeEmail(email);
                    const reminderStatus =
                      reminderStatusesByMemberKey[`invite:${normalizedEmail}`];
                    const reminderPending = reminderStatus === 'pending';
                    const reminderSent = reminderStatus === 'sent';

                    return (
                      <motion.div
                        key={email}
                        className="team-management-card team-management-member-card"
                        data-recently-added={
                          recentlyAddedMemberKey === `invite:${normalizedEmail}` ||
                          undefined
                        }
                        {...MEMBER_CARD_MOTION}
                      >
                        <span className="team-management-member-avatar-wrap">
                          <span className="team-management-avatar" aria-hidden="true">
                            {getInitials(email)}
                          </span>
                        </span>
                        <span className="team-management-row-copy">
                          <strong>{email}</strong>
                          <small className="team-management-inline-pending">
                            Assessment pending...
                          </small>
                        </span>
                        <span className="team-management-row-actions">
                          <button
                            type="button"
                            className="team-management-remind-button"
                            aria-label={`Remind ${email} to complete assessment`}
                            title="Send assessment reminder"
                            disabled={reminderPending}
                            data-pending={reminderPending || undefined}
                            data-sent={reminderSent || undefined}
                            onClick={(event) => {
                              event.stopPropagation();
                              remindInvite(email);
                            }}
                          >
                            {reminderPending
                              ? 'Sending...'
                              : reminderSent
                                ? 'Reminder sent!'
                                : 'Remind'}
                          </button>
                        </span>
                        <button
                          type="button"
                          className="team-management-remove-icon"
                          onClick={() => removeInvite(email)}
                          aria-label={`Remove ${email}`}
                        >
                          <BetterUpIcon name="Trash" size={15} strokeWidth={1.8} />
                        </button>
                      </motion.div>
                    );
                  })}
                  {!isAddCardWaiting && (
                    <motion.div
                      key="team-management-add-card"
                      ref={addCardRef}
                      layout="position"
                      transition={ADD_CARD_LAYOUT_TRANSITION}
                      className="team-management-add-card-layout"
                    >
                      <div
                        className="team-management-card team-management-add-card"
                        data-expanded={isAddingTeammate || undefined}
                        data-revealed={teamMemberCount > 0 || undefined}
                      >
                    <button
                      type="button"
                      className="team-management-add-card-trigger"
                      onClick={() => setIsAddingTeammate(true)}
                      aria-expanded={isAddingTeammate}
                    >
                      <span className="team-management-add-card-icon">
                        <BetterUpIcon
                          className="team-management-add-card-icon-glyph team-management-add-card-icon-plus"
                          name="Plus"
                          size={18}
                          strokeWidth={2}
                        />
                        <BetterUpIcon
                          className="team-management-add-card-icon-glyph team-management-add-card-icon-search"
                          name="Search"
                          size={17}
                          strokeWidth={2}
                        />
                      </span>
                      <span>Add teammate</span>
                    </button>
                    <div className="team-management-add-card-body">
                      <div className="team-management-add-card-body-inner">
                        <label className="team-management-field">
                          <span className="team-management-sr-label">
                            Search teammates
                          </span>
                          <input
                            ref={searchInputRef}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search by name or email"
                          />
                        </label>
                        {normalizedQuery && searchResults.length > 0 && (
                          <div
                            ref={searchResultsRef}
                            className="team-management-search-results"
                            data-can-scroll-down={
                              searchScrollState.canScrollDown || undefined
                            }
                            data-can-scroll-up={
                              searchScrollState.canScrollUp || undefined
                            }
                            aria-label="Organization employees"
                            onScroll={updateSearchScrollState}
                          >
                            {searchResults.map((result, index) => {
                              if (result.type === 'email') {
                                return (
                                  <button
                                    key={result.key}
                                    type="button"
                                    className="team-management-row"
                                    data-active={index === activeSearchIndex || undefined}
                                    onClick={() => addInvite(result.email)}
                                  >
                                    <span className="team-management-avatar" aria-hidden="true">
                                      +
                                    </span>
                                    <span className="team-management-row-copy">
                                      <strong>{result.email}</strong>
                                      <small>Add by email</small>
                                    </span>
                                    <span className="team-management-add-label">Add</span>
                                  </button>
                                );
                              }

                              const { employee } = result;
                              return (
                                <button
                                  key={result.key}
                                  type="button"
                                  className="team-management-row"
                                  data-active={index === activeSearchIndex || undefined}
                                  onClick={() => addEmployee(employee.id)}
                                >
                                  <span className="team-management-avatar" aria-hidden="true">
                                    {employee.avatar ? (
                                      <img src={employee.avatar} alt="" />
                                    ) : (
                                      getInitials(getEmployeeName(employee))
                                    )}
                                  </span>
                                  <span className="team-management-row-copy">
                                    <strong>{getEmployeeName(employee)}</strong>
                                    <small>{employee.title || employee.email}</small>
                                  </span>
                                  <span className="team-management-add-label">
                                    Add
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {normalizedQuery && searchResults.length === 0 && (
                          <p className="team-management-search-empty">
                            No matching employees found.
                          </p>
                        )}
                      </div>
                    </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </LayoutGroup>
            </div>
          </section>
        </div>

        <footer className="team-management-footer">
          {newPendingCount > 0 && (
            <label className="team-management-notify-toggle">
              <input
                type="checkbox"
                checked={notifyNewTeammates}
                onChange={(event) => setNotifyNewTeammates(event.target.checked)}
              />
              <span>Notify new teammates</span>
            </label>
          )}
          <button
            type="button"
            className="team-management-secondary"
            onClick={closeTeamManagement}
          >
            Cancel
          </button>
          <button
            type="button"
            className="team-management-primary"
            onClick={saveTeam}
          >
            {saveLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

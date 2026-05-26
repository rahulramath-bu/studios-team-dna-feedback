import React, { useEffect, useMemo, useState } from 'react';
import { BetterUpIcon } from './BetterUpIcon.jsx';

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

const EMPTY_TEAM_RECORD = {
  id: null,
  name: '',
  memberEmployeeIds: [],
  invitedEmails: [],
  sample: false,
};

/**
 * Prototype team management overlay.
 *
 * What: minimal add/edit surface for creating a team, selecting employees from
 * the organization directory, and staging manual email invites.
 * How: edits the temporary `mockTeamRecords` shape only; it does not send real
 * invites, persist data, or own Team DNA result fields.
 * Port: replace the visual shell with the monolith sheet/modal pattern and
 * wire Save to real Team/TeamMembership mutations. Keep employee search fed by
 * the organization employee directory and keep DNA results outside this form.
 */
export function TeamManagementOverlay({
  mode = 'create',
  organizationEmployees,
  teamRecord,
  topOffset = 0,
  onCancel,
  onSave,
}) {
  const sourceRecord = teamRecord ?? EMPTY_TEAM_RECORD;
  const [teamName, setTeamName] = useState(sourceRecord.name);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    sourceRecord.memberEmployeeIds
  );
  const [invitedEmails, setInvitedEmails] = useState(sourceRecord.invitedEmails);
  const [query, setQuery] = useState('');
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
    if (!normalizedQuery) return organizationEmployees;

    return organizationEmployees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        employee.email?.toLowerCase().includes(normalizedQuery) ||
        employee.title?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, organizationEmployees]);
  const selectedEmployees = selectedEmployeeIds
    .map((employeeId) =>
      organizationEmployees.find((employee) => employee.id === employeeId)
    )
    .filter(Boolean);
  const canInviteQuery =
    looksLikeEmail(query) &&
    !organizationEmployees.some(
      (employee) => employee.email?.toLowerCase() === normalizedQuery
    ) &&
    !invitedEmailSet.has(normalizedQuery);
  const title = mode === 'edit' ? 'Edit team' : 'Add team';

  useEffect(() => {
    setTeamName(sourceRecord.name);
    setSelectedEmployeeIds(sourceRecord.memberEmployeeIds);
    setInvitedEmails(sourceRecord.invitedEmails);
    setQuery('');
  }, [sourceRecord]);

  const addEmployee = (employeeId) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId) ? current : [...current, employeeId]
    );
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
    setQuery('');
  };

  const removeInvite = (email) => {
    const normalizedEmail = normalizeEmail(email);
    setInvitedEmails((current) =>
      current.filter((item) => normalizeEmail(item) !== normalizedEmail)
    );
  };

  const saveTeam = () => {
    onSave?.({
      id: sourceRecord.id,
      name: teamName,
      memberEmployeeIds: selectedEmployeeIds,
      invitedEmails,
      sample: sourceRecord.sample,
    });
  };

  return (
    <div
      className="team-management-overlay"
      style={{ '--team-management-top': `${topOffset}px` }}
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
            onClick={onCancel}
            aria-label="Close team management"
          >
            <BetterUpIcon name="X" size={18} strokeWidth={2} />
          </button>
        </header>

        <label className="team-management-field">
          <span>Team name</span>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Name this team"
          />
        </label>

        <div className="team-management-grid">
          <section className="team-management-section">
            <label className="team-management-field">
              <span>Add people</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
              />
            </label>
            <div className="team-management-list" aria-label="Organization employees">
              {canInviteQuery && (
                <button
                  type="button"
                  className="team-management-row"
                  onClick={() => addInvite(query)}
                >
                  <span className="team-management-avatar" aria-hidden="true">
                    +
                  </span>
                  <span className="team-management-row-copy">
                    <strong>{normalizeEmail(query)}</strong>
                    <small>Invite by email</small>
                  </span>
                  <span className="team-management-add-label">Add</span>
                </button>
              )}
              {filteredEmployees.map((employee) => {
                const isSelected = selectedEmployeeIdSet.has(employee.id);

                return (
                  <button
                    key={employee.id}
                    type="button"
                    className="team-management-row"
                    data-selected={isSelected || undefined}
                    onClick={() =>
                      isSelected ? removeEmployee(employee.id) : addEmployee(employee.id)
                    }
                  >
                    <span className="team-management-avatar" aria-hidden="true">
                      {employee.avatar ? (
                        <img src={employee.avatar} alt="" />
                      ) : (
                        getEmployeeName(employee)
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                      )}
                    </span>
                    <span className="team-management-row-copy">
                      <strong>{getEmployeeName(employee)}</strong>
                      <small>{employee.title || employee.email}</small>
                    </span>
                    <span className="team-management-add-label">
                      {isSelected ? 'Added' : 'Add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="team-management-section">
            <div className="team-management-selected-heading">
              <span>Team members</span>
              <strong>{selectedEmployees.length + invitedEmails.length}</strong>
            </div>
            <div className="team-management-list" aria-label="Selected team members">
              {selectedEmployees.length === 0 && invitedEmails.length === 0 ? (
                <p className="team-management-empty">No people added yet.</p>
              ) : (
                <>
                  {selectedEmployees.map((employee) => (
                    <div key={employee.id} className="team-management-row">
                      <span className="team-management-avatar" aria-hidden="true">
                        {employee.avatar ? (
                          <img src={employee.avatar} alt="" />
                        ) : (
                          getEmployeeName(employee)
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </span>
                      <span className="team-management-row-copy">
                        <strong>{getEmployeeName(employee)}</strong>
                        <small>{employee.email}</small>
                      </span>
                      <button
                        type="button"
                        className="team-management-remove-button"
                        onClick={() => removeEmployee(employee.id)}
                        aria-label={`Remove ${getEmployeeName(employee)}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {invitedEmails.map((email) => (
                    <div key={email} className="team-management-row">
                      <span className="team-management-avatar" aria-hidden="true">
                        @
                      </span>
                      <span className="team-management-row-copy">
                        <strong>{email}</strong>
                        <small>Pending invite</small>
                      </span>
                      <button
                        type="button"
                        className="team-management-remove-button"
                        onClick={() => removeInvite(email)}
                        aria-label={`Remove ${email}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        <footer className="team-management-footer">
          <button
            type="button"
            className="team-management-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="team-management-primary"
            onClick={saveTeam}
          >
            Save team
          </button>
        </footer>
      </div>
    </div>
  );
}

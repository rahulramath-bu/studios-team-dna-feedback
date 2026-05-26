import { teamDnaDataset } from './teamDnaMock.js';
import { makeMockTeamDnaGeneratedInsights } from './teamDnaGeneratedInsights.mock.js';

function getNameParts(name) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function getDisplayName(employee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ')
    || employee.email
    || 'Teammate';
}

function getInviteId(teamId, email) {
  return `${teamId}-invite-${normalizeEmail(email).replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Mock organization directory.
 *
 * What: local fixture shaped like the monolith's normalized
 * `organization-employee` frontend model.
 * How: keeps every known monolith field present, even when this prototype only
 * needs name, email, title, and avatar for the team picker.
 * Port: replace this array with the real organization employee query. Do not
 * add Team DNA scores or team membership here; company identity should remain
 * reusable outside Team DNA.
 */
export const mockOrganizationEmployees = teamDnaDataset.members.map((member) => {
  const { firstName, lastName } = getNameParts(member.name);

  return {
    id: member.id,
    firstName,
    lastName,
    email: `${member.id}@betterup.co`,
    title: member.role ?? '',
    avatar: member.avatarUrl ?? '',
    currentAccess: [],
    upcomingAccess: [],
    eligibleForAccess: [],
    previousAccess: null,
  };
});

/**
 * Mock Team DNA assessment/results records.
 *
 * What: Team DNA-only fixture keyed by organization employee id.
 * How: stores assessment completion, Big Five scores, and display pronouns
 * separately from organization employee identity and generic team membership.
 * Port: replace this with the real Team DNA assessment/results API. Keep the
 * `Dna` naming: these fields are not generic team profile data.
 */
export const mockTeamDnaResultsByEmployeeId = Object.fromEntries(
  teamDnaDataset.members.map((member) => [
    member.id,
    {
      assessmentComplete: member.assessmentComplete !== false,
      bigFive: member.bigFive,
      pronouns: member.pronouns,
    },
  ])
);

/**
 * Mock team records.
 *
 * What: temporary prototype-owned team roster seam.
 * How: a team only knows its id, name, selected organization employee ids,
 * manually invited emails, and whether it is seeded sample data.
 * Port: replace this with the real Team/TeamMembership API once engineering
 * defines it. This shape is intentionally minimal and is not a backend
 * contract.
 */
export const mockTeamRecords = [];

export const sampleTeamRecord = {
  id: 'sample-team',
  name: 'Sample Team',
  memberEmployeeIds: mockOrganizationEmployees.map((employee) => employee.id),
  invitedEmails: [],
  sample: true,
};

/**
 * Team management to Team DNA mapper.
 *
 * What: the single place where generic employees, generic team records, and
 * Team DNA result data become the `TeamDnaDataset` consumed by the UI.
 * How: existing employees inherit identity from the organization directory and
 * optional DNA data from `teamDnaResultsByEmployeeId`; manual email invites
 * become pending Team DNA members without scores.
 * Port: keep this mapping layer, but replace the three fixture inputs with
 * generated API data. Components should continue receiving `TeamDnaDataset`,
 * not raw backend records.
 */
export function buildTeamDnaDatasetFromTeamRecord(
  teamRecord,
  {
    organizationEmployees = mockOrganizationEmployees,
    teamDnaResultsByEmployeeId = mockTeamDnaResultsByEmployeeId,
  } = {}
) {
  const employeeById = new Map(
    organizationEmployees.map((employee) => [employee.id, employee])
  );
  const team = {
    id: teamRecord.id,
    name: teamRecord.name,
    sample: Boolean(teamRecord.sample),
  };
  const employeeMembers = teamRecord.memberEmployeeIds
    .map((employeeId) => {
      const employee = employeeById.get(employeeId);
      if (!employee) return null;

      const dnaResult = teamDnaResultsByEmployeeId[employeeId];
      const assessmentComplete = dnaResult?.assessmentComplete === true;

      return {
        id: employee.id,
        name: getDisplayName(employee),
        pronouns: dnaResult?.pronouns,
        role: employee.title,
        avatarUrl: employee.avatar || null,
        sourceAvatarUrl: employee.avatar || null,
        assessmentComplete,
        bigFive: assessmentComplete ? dnaResult?.bigFive : undefined,
        meta: {
          organizationEmployeeId: employee.id,
          source: 'organizationEmployee',
        },
      };
    })
    .filter(Boolean);
  const invitedMembers = teamRecord.invitedEmails.map((email) => ({
    id: getInviteId(teamRecord.id, email),
    name: email,
    role: 'Invited teammate',
    avatarUrl: null,
    sourceAvatarUrl: null,
    assessmentComplete: false,
    meta: {
      invitedEmail: email,
      source: 'manualInvite',
    },
  }));
  const members = [...employeeMembers, ...invitedMembers];
  const aiInsights = members.length > 0
    ? makeMockTeamDnaGeneratedInsights({ team, members })
    : { team: undefined, people: {}, pairs: {} };

  return {
    team,
    members,
    insights: {
      team: aiInsights.team,
      people: aiInsights.people,
      pairs: aiInsights.pairs,
    },
  };
}

export function normalizeTeamRecord(teamRecord) {
  return {
    id: teamRecord.id,
    name: teamRecord.name.trim() || 'Untitled team',
    memberEmployeeIds: Array.from(new Set(teamRecord.memberEmployeeIds)),
    invitedEmails: Array.from(new Set(teamRecord.invitedEmails.map(normalizeEmail))),
    sample: Boolean(teamRecord.sample),
  };
}

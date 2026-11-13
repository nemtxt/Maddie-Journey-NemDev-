/* Maddie Journey private service — SOURCE FIELD MAPPING (single source of truth).
 *
 * Every connected field shown by the monitoring interface is declared here with
 * its provider, table, field and transformation rule. Anything not declared here
 * is NOT requested from the provider. In particular, compensation, government
 * ID numbers, bank details, addresses, personal contact data, disciplinary case
 * content and any credential-like columns are never requested, cached or
 * delivered. The adapter requests exactly the fields declared below.
 *
 * Airtable table/field IDs are schema identifiers, not credentials: they grant no
 * access without a token. They are used instead of names so column renames do not
 * silently break the mapping (a removed field surfaces as a schema error).
 * The base ID, token and Google file IDs are deployment configuration (env vars).
 *
 * Schema verified 2026-11-12 through the Claude Airtable connector (read-only).
 */
'use strict';

const AIRTABLE = Object.freeze({
  people: {
    table: 'tblxpl5OtvuNC57O8',
    fields: {
      employeeId: 'fldqkxggPg5zwh4Ab',      // "Employee ID" (singleLineText) — stable join key after normalization
      firstName: 'flddzBNWtDWYM8jn1',       // "First Name"
      lastName: 'fldo1b8IVG8guhPg0',        // "Last Name"
      department: 'flduz4B2OAtIZ8LjG',      // "Department" (link -> Departments)
      position: 'fldRagX7PCDhmAzkx',        // "Position/Role" (singleSelect)
      companyEmail: 'fldApyDu1G4tIQiGN',    // "Company Email" — used only for Calendar attendee matching
      status: 'fld9fvRtbONcAEg7C',          // "Employment Status" (singleSelect)
      businessUnit: 'fldu616WdNUvp0fTZ',    // "Business Unit"
      company: 'flda0X0Ib1SpYWCC2',         // "Company"
      hireDate: 'fldrluTRKtUIcNYZB',        // "Hire Date" (date)
      hiringDateText: 'fldMZ8hMqIvwCrnXG',  // "Hiring Date" (free text, e.g. "March 21, 2024") — conflict check only
      regularizationDate: 'fldEM5tCqpdj1bwQS', // "Regularization Date" (date)
      separationDate: 'fldC6lKqtH450mwWz',  // "Separation Date" (date)
      birthday: 'fldIDTYfwZ9q8Kv7Q',        // "Birthday" (date) — month/day used for computed milestones
      created: 'fldddiRFEnYv5CXhl'          // "Created" (createdTime)
    }
  },
  departments: {
    table: 'tblV0THbeXrY7uLyB',
    fields: { name: 'fldkrnTAtVUs49xHN', memberCount: 'fldHgY85j6l5j6p5D' }
  },
  attendance: {
    table: 'tblndLiwxt64WfeHm',            // "Tardiness/Leave Tracker"
    fields: {
      incidentId: 'fldWaewte0wssrDi3',
      employee: 'fldfJzllNfMpJoTvN',        // link -> People (joined by Airtable record ID, never by name)
      date: 'fldN9MmrWvdDAB6wu',
      type: 'fldJMbl3NVma2kNSw',
      created: 'fldPN9KQAXBGIFleH'
    }
  },
  development: {
    table: 'tbltViWwcJh93EDt0',            // "Employee Development Monitoring"
    fields: {
      employee: 'fldGPGsYzmKwexrA2',
      developmentType: 'fldgVvnkOgIrmEQeS',
      status: 'fldOJ6Ra6KQly5B1T',
      fifthMonthStatus: 'fldF62Y49plNBLs2h',
      regularizationStatus: 'fldQxCSJ8MChl8dUm',
      created: 'fldsm44cBMZuYDsJa'
    }
  }
});

/* 201 Files: the prototype's nine requirements mapped to Airtable "People"
 * attachment columns (which implement the "EMPLOYEE CHECKLIST" Google Doc).
 * Rule: an attachment present => "complete" evidence ON FILE, flagged unverified
 * (a file's presence is not HR approval). Empty => "missing" in tracker, which is
 * what the Airtable "Missing Requirements" formula reports. A requirement with no
 * source column => "source-unavailable". Composite rules require every column.
 * Attachments are checked for presence only; filenames/URLs are never delivered. */
const FILES_201 = Object.freeze([
  { id: 'probation-contract', fields: ['fldRnY9UcaEj3NnGJ'], note: 'Airtable "Employment Contract" (not specific to probationary contracts)' },
  { id: 'regularization-contract', fields: [], note: 'No regularization-contract column exists in the tracker' },
  { id: 'nda', fields: ['fldUQu41piUR6NCOn'], note: 'Airtable "Confidentiality/NDA"' },
  { id: 'ncc', fields: ['fld1EWGsUs4BQcbmt'], note: 'Airtable "Non-Compete/Non-Solicitation Agreement" (if applicable per checklist)' },
  { id: 'personal-data', fields: ['fld6LQ9nqOkbPt4R2'], note: 'Airtable "Personal Data Sheet (PDS)"' },
  { id: 'identity', fields: ['fldzLpBNpWVbVjZuy'], note: 'Airtable "Two (2) Valid IDs (Photocopy)"' },
  { id: 'tax', fields: ['fldaRAqh4gAUbFsZr'], note: 'Airtable "TIN ID (Photocopy)"' },
  { id: 'benefits', fields: ['fldOyHxm0gi4fk5XJ', 'fldKHdrfIO1zoIuRc', 'fldBJ4y99VsfgC5sF'], note: 'SSS + PhilHealth + Pag-IBIG photocopies (all three required)' },
  { id: 'emergency-contact', fields: ['fldQ3ueVI9bvkT1iK'], note: 'Airtable "Emergency Contact Form"' }
]);

/* Employment statuses observed in the source single-select. "Active" defines the
 * monitoring cohort denominator. Nothing is inferred from dates alone. */
const ACTIVE_STATUSES = new Set(['Regular', 'Probationary', 'Part-Time', 'Contract', 'On Leave']);
const INACTIVE_STATUSES = new Set(['Resigned', 'Terminated', 'AWOL']);

/* Source department -> monitoring division. Only unambiguous one-to-one matches
 * reuse a prototype division ID. The source combines Design and Design Operations
 * and has no IT department; those are reported, never guessed. */
const DEPARTMENT_DIVISIONS = Object.freeze({
  'RMD': { id: 'rmd', short: 'RMD', name: 'Revenue Management Division' },
  'CORP OPS': { id: 'corp', short: 'Corp Ops', name: 'Corporate Operations' },
  'MEDIA': { id: 'media', short: 'Media', name: 'Media' },
  'GENCON': { id: 'gencon', short: 'GenCon', name: 'GenCon' },
  'BUSINESS DEV': { id: 'bd', short: 'Business Dev', name: 'Business Development' },
  'DESIGN/OPERATION': { id: 'design-operation', short: 'Design / Ops', name: 'Design / Design Operations (combined in source)' },
  'CEO TEAM': { id: 'ceo-team', short: 'CEO Team', name: 'CEO Team' },
  'COO TEAM': { id: 'coo-team', short: 'COO Team', name: 'COO Team' },
  'EXEC': { id: 'exec', short: 'Exec', name: 'Executive' }
});
const UNASSIGNED_DIVISION = Object.freeze({ id: 'unassigned', short: 'No department', name: 'No department recorded in source' });

/* Attendance types in the source single-select, grouped for monitoring. The
 * tracker has no approval/verification column, so every entry is delivered with
 * verified:false and approval:'Not recorded in source'. */
const ATTENDANCE_TYPES = Object.freeze({
  'Late': 'Late',
  'Awol': 'Absent',
  'AM Halfday': 'Halfday', 'PM Halfday': 'Halfday',
  'Vacation Leave': 'Leave', 'Sick Leave': 'Leave', 'Emergency Leave': 'Leave',
  'Maternity Leave': 'Leave', 'Bereavement Leave': 'Leave', 'Birthday Leave': 'Leave',
  'Leave for Full Self Study': 'Leave',
  'Work From Home': 'Work arrangement', 'Offset': 'Work arrangement'
});

/* Expected organizational baseline from the project brief. Used ONLY to report
 * the difference; records are never added or excluded to match it. */
const BASELINE_HEADCOUNT = 51;

/* Field-level precedence when sources disagree (documented in
 * docs/PHASE11_SECURE_ARCHITECTURE.md). The first source listed is authoritative;
 * the others are compared and any disagreement is reported as a conflict. */
const PRECEDENCE = Object.freeze({
  employeeId: ['airtable.people', 'sheets.masterlist'],
  employmentStatus: ['airtable.people', 'sheets.masterlist'],
  department: ['airtable.people', 'sheets.masterlist'],
  hireDate: ['airtable.people:hireDate', 'airtable.people:hiringDateText', 'sheets.masterlist'],
  files201: ['airtable.people:attachments'],
  attendance: ['airtable.attendance'],
  calendarEvents: ['google.calendar']
});

module.exports = {
  AIRTABLE, FILES_201, ACTIVE_STATUSES, INACTIVE_STATUSES, DEPARTMENT_DIVISIONS,
  UNASSIGNED_DIVISION, ATTENDANCE_TYPES, BASELINE_HEADCOUNT, PRECEDENCE
};

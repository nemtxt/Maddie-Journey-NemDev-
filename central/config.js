/* MADDIE CENTRAL | 2027 — isolated fictional trial schema. No external connectors. */
(function(root){
  'use strict';
  const row=(id,label,subtitle,icon,lines)=>({
    id,label,subtitle,icon,subcategories:lines.trim().split('\n').map(x=>{
      const [slug,name,kind='records',classification='Internal']=x.split('|');
      return {id:slug,label:name,kind,classification};
    })
  });
  const categories=[
    row('people-directory','PEOPLE DIRECTORY','Employee Masterlist & 201 Files','users',`
employee-masterlist|Employee Masterlist|employees
personal-information|Personal Information|employees|Highly Restricted
employment-documents|Employment Documents|documents
government-requirements|Government Requirements|documents|Highly Restricted
employment-movements|Employment Movements|movements
performance-records|Performance Records|performance|Confidential
maddie-journey-records|Maddie Journey Records|journey
training-records|Training Records|training
acknowledgements|Acknowledgements|documents
exit-records|Exit Records|documents|Confidential`),
    row('pay-benefits','PAY & BENEFITS','Compensation, Payroll & Benefits','wallet',`
salary-masterlist|Salary Masterlist|salary|Highly Restricted
compensation-movement|Compensation Movement|movements|Highly Restricted
incentives-bonuses|Incentives & Bonuses|benefits|Confidential
government-contributions|Government Contributions|benefits|Highly Restricted
hmo|HMO|benefits|Confidential
employee-insurance|Employee Insurance|benefits|Confidential
maddie-benefits|Maddie Benefits|benefits
wellness-benefits|Wellness Benefits|benefits|Confidential
benefits-review|Benefits Review|summary`),
    row('workforce-pulse','WORKFORCE PULSE','Attendance, Leave & Manpower','activity',`
daily-attendance|Daily Attendance|attendance
monthly-attendance|Monthly Attendance|attendance-summary
overtime-summary|Overtime Summary|attendance-summary
lates-and-absence-monitoring|Lates and Absence Monitoring|attendance
division-attendance|Division Attendance|attendance-summary
attendance-reports|Attendance Reports|attendance-summary`),
    row('maddie-journey','MADDIE JOURNEY','Career, Growth, Well-being, Culture & Purpose','route',`
benefits-well-being|Benefits & Well-being|benefits
culture-belonging|Culture & Belonging|events
purpose-experience|Purpose & Experience|events
employee-journey-profile|Employee Journey Profile|journey
career-direction-level-gates|Career Direction & Level Gates|journey
onboarding-probation|Onboarding & Probation|journey
performance-report-cards|Performance Report Cards|performance
leadership-development|Leadership Development|journey
employee-movement|Employee Movement|movements`),
    row('maddie-learning-hub','MADDIE LEARNING HUB','Training, Assessments & Trainers','graduation',`
annual-training-calendar|Annual Training Calendar|training
universal-training|Universal Training|training
specialized-training|Specialized Training|training
training-team|Training Team|training
training-programs|Training Programs|training
training-attendance|Training Attendance|training-attendance
training-assessments|Training Assessments|training-attendance
competency-development|Competency Development|training-attendance
external-partners|External Partners|training
leadership-development|Leadership Development|training
training-evaluation|Training Evaluation|training-attendance`),
    row('culture-community','CULTURE & COMMUNITY','Humans of Madhouse, Milestones & Events','heart',`
humans-of-madhouse|Humans of Madhouse|events
maddie-milestones|Maddie Milestones|milestones
corporate-calendar|Corporate Calendar|events
maddie-hour|Maddie Hour|events
monthly-engagement|Monthly Engagement|events
general-assembly|General Assembly|events
company-events|Company Events|events
employee-recognition|Employee Recognition|milestones
culture-campaigns|Culture Campaigns|events
employee-feedback|Employee Feedback|events
incentive-activities|Incentive Activities|events`),
    row('talent-acquisition','TALENT ACQUISITION','Recruitment & Hiring Pipeline','briefcase',`
manpower-plan|Manpower Plan|recruitment
manpower-requisition|Manpower Requisition|recruitment
recruitment-pipeline|Recruitment Pipeline|recruitment
hiring-partner|Hiring Partner|recruitment
hiring-status|Hiring Status|recruitment
new-hire-onboarding|New Hire Onboarding|recruitment
probationary-monitoring|Probationary Monitoring|journey
workforce-movement|Workforce Movement|movements
vacancy-aging|Vacancy Aging|recruitment`),
    row('people-governance','PEOPLE GOVERNANCE','Employee Relations & Compliance','shield',`
employee-concerns|Employee Concerns|cases|Highly Restricted
notices-memorandums|Notices & Memorandums|cases|Highly Restricted
case-documentation|Case Documentation|cases|Highly Restricted
governance-review|Governance Review|cases|Highly Restricted
case-status|Case Status|cases|Highly Restricted
employee-grievances|Employee Grievances|cases|Highly Restricted
policy-compliance|Policy Compliance|cases|Confidential
corrective-actions|Corrective Actions|cases|Highly Restricted
case-closure|Case Closure|cases|Highly Restricted`),
    row('executive-scoreboard','EXECUTIVE SCOREBOARD','WIG #4, KPIs, Risks & Decisions','chart',`
monthly-pc-scorecard|Monthly P&C Scorecard|summary
wig4-scorecard|WIG #4 Scorecard|summary
headcount-report|Headcount Report|summary
compensation-report|Compensation Report|summary|Confidential
attendance-report|Attendance Report|summary
maddie-journey-report|Maddie Journey Report|summary
ld-report|L&D Report|summary
culture-report|Culture Report|summary
recruitment-report|Recruitment Report|summary
employee-relations-report|Employee Relations Report|summary|Confidential
risks-blockers|Risks & Blockers|actions
executive-decisions|Executive Decisions|actions`)
  ];
  const options={
    employmentStatus:['Preboarding','Probationary','Regular','Fixed-term','Part-time','Intern','On Leave','Resigned','Separated','Terminated'],
    division:['Design','GenCon','MH Operations','Media','RMD','Corporate Operations','Finance','People & Culture','Other'],
    employmentMovement:['New Hire','Regularization','Promotion','Lateral Transfer','Reassignment','Salary Adjustment','Designation','Resignation','Separation'],
    documentStatus:['Not Started','Requested','Submitted','For Review','Approved/Verified','Returned for Correction','Expired','Not Applicable'],
    attendanceStatus:['Present','Late','Undertime','Absent','On Leave','Rest Day','Holiday','Official Business','Missing Log','For Correction'],
    leaveStatus:['Draft','Filed','Pending Approval','Approved','Rejected','Cancelled','Taken','Reconciled'],
    recruitmentStatus:['For Approval','Approved','Sourcing','Screening','Initial Interview','Assessment','Final Interview','Reference Check','For Offer','Offer Accepted','Hired','On Hold','Cancelled','Rejected'],
    journeyStatus:['Not Started','In Progress','For Assessment','For Revalida','Pending Requirements','Completed','On Hold','Needs Development'],
    trainingStatus:['Planned','Open for Registration','Scheduled','In Progress','Completed','Cancelled','Rescheduled'],
    trainingAttendance:['Attended','Partially Attended','Absent','Excused','Make-up Required'],
    assessmentOutcome:['Not Yet Assessed','Passed','Passed with Development Actions','For Reassessment','Not Passed'],
    eventStatus:['Proposed','For Approval','Approved','Scheduled','In Preparation','Completed','Post-Event Review','Cancelled'],
    caseStatus:['Open','Initial Review','Under Investigation','Awaiting Response','Governance Review','For Authorized Decision','Action in Progress','Closed'],
    priority:['Critical','High','Medium','Low'],
    executiveStatus:['For Review','Decision Required','Approved','Declined','In Progress','Blocked','Completed','Deferred']
  };
  const roles=['CEO','COO','CSO','P&C Lead','P&C Generalist','Finance','Governance & Compliance','Division Head'];
  const savedViews=[
    {id:'ceo',label:'CEO Overview',roles:['CEO','P&C Lead'],category:'executive-scoreboard',sub:'wig4-scorecard'},
    {id:'coo',label:'COO Workforce View',roles:['CEO','COO','P&C Lead'],category:'workforce-pulse',sub:'division-attendance'},
    {id:'cso',label:'CSO Maddie Journey View',roles:['CEO','CSO','P&C Lead'],category:'maddie-journey',sub:'career-direction-level-gates'},
    {id:'pc',label:'P&C Operations View',roles:['P&C Lead','P&C Generalist'],category:'people-directory',sub:'employment-documents'},
    {id:'division',label:'Division Head View',roles:['Division Head','P&C Lead','COO'],category:'people-directory',sub:'employee-masterlist'},
    {id:'monthly',label:'Monthly Review View',roles:['CEO','COO','CSO','P&C Lead'],category:'executive-scoreboard',sub:'monthly-pc-scorecard'}
  ];
  const schema={title:'MADDIE CENTRAL | 2027',categories,options,roles,savedViews,totalSubcategories:categories.reduce((n,c)=>n+c.subcategories.length,0)};
  root.MC_CONFIG=schema;
  if(typeof module==='object'&&module.exports)module.exports=schema;
})(typeof window!=='undefined'?window:globalThis);

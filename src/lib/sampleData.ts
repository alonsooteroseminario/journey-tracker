import { Goal, Task, Phase, BudgetSummary, TimelineComparison, DocumentItem, ResourceCategory } from "@/types";
import { generateId, getToday } from "./storage";
import { enhanceTaskWithSubsteps } from "./substepParser";

// BC PNP to PR Complete Checklist - 55 Steps across 8 Phases
export function createBCPNPtoPRChecklist(): Goal {
  const phases: Phase[] = [
    {
      id: "phase1",
      name: "PHASE 1: PREPARATION",
      description: "Weeks 1-16 - Document gathering, language testing, BC PNP registration",
      taskIds: [],
    },
    {
      id: "phase2",
      name: "PHASE 2: WAITING FOR BC PNP ITA",
      description: "Variable - Monitor draws, maintain profile, stay employed",
      taskIds: [],
    },
    {
      id: "phase3",
      name: "PHASE 3: BC PNP APPLICATION",
      description: "30 days - Complete and submit BC PNP application",
      taskIds: [],
    },
    {
      id: "phase4",
      name: "PHASE 4: BC PNP PROCESSING",
      description: "3-4 months - Application review and decision",
      taskIds: [],
    },
    {
      id: "phase5",
      name: "PHASE 5: FEDERAL PR APPLICATION",
      description: "After nomination - Prepare and submit federal PR",
      taskIds: [],
    },
    {
      id: "phase6",
      name: "PHASE 6: FEDERAL PR PROCESSING",
      description: "6-18 months - Federal processing and biometrics",
      taskIds: [],
    },
    {
      id: "phase7",
      name: "PHASE 7: COPR & LANDING",
      description: "Final step - Receive COPR and complete landing",
      taskIds: [],
    },
    {
      id: "phase8",
      name: "PHASE 8: FIRST STEPS AS PR",
      description: "Ongoing - Update records and understand obligations",
      taskIds: [],
    },
  ];

  const tasksData: Omit<Task, "id">[] = [
    // PHASE 1: PREPARATION (Weeks 1-16)
    {
      title: "Start WES Educational Credential Assessment (ECA)",
      description: `• Go to wes.org/eca/
• Create account, select "ECA for Immigration (IRCC)"
• Fill personal + education info
• Upload diploma scan
• Email Universidad de Piura with WES reference number
• Request official transcripts sent to WES
• Processing: 7-10 business days after WES receives docs`,
      completed: false,
      order: 1,
      phase: "PHASE 1",
      stepNumber: "1.1",
      documentsNeeded: "Civil Engineering diploma, Transcripts from university",
      cost: "$256",
      estimatedCost: 256,
    },
    {
      title: "Book CELPIP Test",
      description: `• Go to celpip.ca
• Select 'CELPIP-General' (NOT Academic)
• Book for 13 weeks from start date
• Choose Vancouver test center
• Set calendar reminder 1 week before`,
      completed: false,
      order: 2,
      phase: "PHASE 1",
      stepNumber: "1.2",
      documentsNeeded: "Valid passport for ID",
      cost: "$290",
      estimatedCost: 290,
    },
    {
      title: "Register BC PNP Profile (FREE!)",
      description: `• Go to BC PNP online portal (welcomebc.ca)
• Create account
• Select 'Skilled Worker' stream
• Enter CELPIP scores
• Add all work experience
• Set Primary NOC: 21232 (Software Developer)
• Screenshot your SIRS score after submission`,
      completed: false,
      order: 3,
      phase: "PHASE 1",
      stepNumber: "1.3",
      documentsNeeded: "Current CELPIP results, Work history details, Passport info",
      cost: "$0 (FREE)",
      estimatedCost: 0,
    },
    {
      title: "Purchase CELPIP Study Materials",
      description: `• CELPIP Online Practice Tests (~$40)
• CELPIP Study Pack (~$149)
• Download and organize in study folder
• Focus materials: 70% listening practice`,
      completed: false,
      order: 4,
      phase: "PHASE 1",
      stepNumber: "1.4",
      documentsNeeded: "None",
      cost: "$189",
    },
    {
      title: "Create CELPIP Study Schedule",
      description: `• Block daily study time: Morning + evening
• Weekend intensive sessions
• Target: 18-30 hours/week (escalating)
• Focus 70% on listening (weakest area)
• Track progress weekly`,
      completed: false,
      order: 5,
      phase: "PHASE 1",
      stepNumber: "1.5",
      documentsNeeded: "None",
      cost: "$0",
    },
    {
      title: "Contact Current Employer for Reference Letter",
      description: `• Draft job duties emphasizing SOFTWARE DEVELOPMENT work
• Despite "Digital Development Lead" title, focus on:
  - Software design and development
  - Code writing and debugging
  - Database integration
  - API development
  - Version control (Git)
• Request letter on company letterhead
• Include: Title, dates, hours/week, salary, duties, supervisor contact`,
      completed: false,
      order: 6,
      phase: "PHASE 1",
      stepNumber: "1.6",
      documentsNeeded: "Draft duties list",
      cost: "$0",
    },
    {
      title: "Contact Previous Canadian Employer (VDC/BIM)",
      description: `• Request reference letter for 10-month position
• Include all standard information
• Emphasize technical responsibilities`,
      completed: false,
      order: 7,
      phase: "PHASE 1",
      stepNumber: "1.7",
      documentsNeeded: "Previous employment records",
      cost: "$0",
    },
    {
      title: "Contact Chilean Employers (Both positions)",
      description: `• BIM Coordinator (2 years): Request letter in Spanish
• BIM Modeler (1.67 years): Request letter in Spanish
• Ensure letters include all required details
• Letters will need certified translation later`,
      completed: false,
      order: 8,
      phase: "PHASE 1",
      stepNumber: "1.8",
      documentsNeeded: "Chilean employment records",
      cost: "$0",
    },
    {
      title: "CELPIP Study Period (Weeks 2-10)",
      description: `• Weeks 2-6: 18-20 hours/week consistent study
• Weeks 7-10: Intensify to 22-25 hours/week
• Focus areas:
  - Listening: 70% of time (your weakness!)
  - Speaking: 15% of time
  - Writing: 10% of time
  - Reading: 5% of time
• Take practice tests weekly
• Track error patterns`,
      completed: false,
      order: 9,
      phase: "PHASE 1",
      stepNumber: "1.9",
      documentsNeeded: "Study materials",
      cost: "$0",
    },
    {
      title: "Receive Reference Letters",
      description: `• Current employer letter (by Week 6-8)
• Previous Canadian employer letter (by Week 6-8)
• Chilean employer letters in Spanish (by Week 6-8)
• Review all letters for completeness
• Check: dates, duties, salary, contact info all correct`,
      completed: false,
      order: 10,
      phase: "PHASE 1",
      stepNumber: "1.10",
      documentsNeeded: "All 4 reference letters",
      cost: "$0",
    },
    {
      title: "Translate Chilean Documents",
      description: `• Find certified translator (ATIBC member or equivalent)
• Translate both Chilean reference letters
• Translator must provide:
  - Certified English translation
  - Original Spanish document
  - Certification statement
  - Translator credentials and stamp
• Cost: ~$30-50 per page`,
      completed: false,
      order: 11,
      phase: "PHASE 1",
      stepNumber: "1.11",
      documentsNeeded: "2 Spanish reference letters",
      cost: "$300-400",
    },
    {
      title: "Gather Supporting Employment Documents",
      description: `• Current job: T4 slips (2022, 2023, 2024), pay stubs (recent 3 months), employment contract
• Previous Canadian job: T4 slips, employment contract
• Chilean jobs: Employment contracts, certificates of employment
• Work permit copy
• Job offer letter (permanent, full-time)`,
      completed: false,
      order: 12,
      phase: "PHASE 1",
      stepNumber: "1.12",
      documentsNeeded: "See details",
      cost: "$0",
    },
    {
      title: "Receive WES ECA Report",
      description: `• ECA typically arrives Weeks 7-10
• Review report for accuracy
• Note ECA reference number
• Valid for 5 years
• UPDATE BC PNP profile immediately with ECA number`,
      completed: false,
      order: 13,
      phase: "PHASE 1",
      stepNumber: "1.13",
      documentsNeeded: "WES ECA report",
      cost: "$0",
    },
    {
      title: "Peak CELPIP Preparation (Weeks 11-13)",
      description: `• Intensify to 30 hours/week
• Daily mock tests
• Focus on weak areas
• Get adequate rest before test
• Week 13: Light review only, rest before test`,
      completed: false,
      order: 14,
      phase: "PHASE 1",
      stepNumber: "1.14",
      documentsNeeded: "Study materials",
      cost: "$0",
    },
    {
      title: "Take CELPIP Test",
      description: `• Week 13: Take CELPIP test
• Bring valid passport
• Arrive 30 minutes early
• Complete all 4 sections
• Results in 8 business days online`,
      completed: false,
      order: 15,
      phase: "PHASE 1",
      stepNumber: "1.15",
      documentsNeeded: "Valid passport",
      cost: "Already paid",
    },
    {
      title: "DECISION POINT: Receive CELPIP Results",
      description: `• Week 14: Results available online
• Check all 4 scores

IF CLB 7+ IN ALL SECTIONS:
• Create Express Entry profile (free)
• Update BC PNP profile to "Express Entry BC - Skilled Worker"
• Enter Express Entry profile number + Job Seeker Code
• Now eligible for faster Express Entry BC stream

IF CLB 6 LISTENING REMAINS:
• Continue with Base BC PNP stream (already registered)
• Can retake CELPIP later if desired
• Still get PR, just 18-month federal processing vs 6 months`,
      completed: false,
      order: 16,
      phase: "PHASE 1",
      stepNumber: "1.16",
      documentsNeeded: "CELPIP Test Report Form (TRF)",
      cost: "$0",
    },

    // PHASE 2: WAITING FOR BC PNP ITA
    {
      title: "Monitor BC PNP Draws",
      description: `• Check BC PNP website every Tuesday and Friday
• Website: welcomebc.ca/immigrate-to-b-c/invitations-to-apply
• BC PNP announces draws with minimum scores
• 2025 note: Limited draws (~100 ITAs for high-impact candidates)
• Tech draws continue weekly but competitive`,
      completed: false,
      order: 17,
      phase: "PHASE 2",
      stepNumber: "2.1",
      documentsNeeded: "None",
      cost: "$0",
    },
    {
      title: "Keep BC PNP Profile Active",
      description: `• Profiles valid for 12 months from registration
• Update if any information changes:
  - New CELPIP scores
  - Job changes (NOT RECOMMENDED during process)
  - Address changes
  - Contact information
• Check email daily for BC PNP communications`,
      completed: false,
      order: 18,
      phase: "PHASE 2",
      stepNumber: "2.2",
      documentsNeeded: "None",
      cost: "$0",
    },
    {
      title: "Maintain Employment",
      description: `• Stay with current employer
• Do NOT change jobs while waiting for ITA
• Keep work permit valid
• Maintain good relationship with employer
• Inform employer you may need updated documents`,
      completed: false,
      order: 19,
      phase: "PHASE 2",
      stepNumber: "2.3",
      documentsNeeded: "None",
      cost: "$0",
    },
    {
      title: "Keep Documents Current",
      description: `• Language tests valid 2 years
• ECA valid 5 years
• Reference letters: Refresh every 6 months if needed
• Keep employment documents updated
• Ensure passport validity (needs 6+ months when applying)`,
      completed: false,
      order: 20,
      phase: "PHASE 2",
      stepNumber: "2.4",
      documentsNeeded: "All previous documents",
      cost: "$0",
    },
    {
      title: "RECEIVE ITA (Invitation to Apply)",
      description: `• Email notification: "You have received an ITA"
• Log into BC PNP Online portal
• Review ITA carefully
• YOU HAVE 30 DAYS TO SUBMIT COMPLETE APPLICATION
• Do not delay - start application immediately!`,
      completed: false,
      order: 21,
      phase: "PHASE 2",
      stepNumber: "2.5",
      documentsNeeded: "ITA notification",
      cost: "$0",
    },

    // PHASE 3: BC PNP APPLICATION (30 days)
    {
      title: "Prepare All Documents",
      description: `Checklist of required documents:
□ CELPIP Test Report Form (TRF)
□ WES ECA report
□ Reference letter - Current job (Software Dev duties!)
□ Reference letter - Previous Canadian job
□ Reference letters - Chilean jobs (translated + original)
□ Translator certification
□ T4 slips (all years at current job)
□ Pay stubs (recent 3 months)
□ Employment contracts (all jobs)
□ Job offer letter (permanent, full-time)
□ Work permit copy
□ Passport bio pages
□ Proof of legal status in Canada
□ Educational credentials (diploma, transcripts)`,
      completed: false,
      order: 22,
      phase: "PHASE 3",
      stepNumber: "3.1",
      documentsNeeded: "See checklist in details",
      cost: "$0",
    },
    {
      title: "Complete BC PNP Application Forms",
      description: `• Log into BC PNP Online portal
• Complete all sections:
  - Personal information
  - Work experience (all 4 positions)
  - Education
  - Language ability
  - Job offer details
  - Family information
• Review for accuracy - any errors can delay processing
• Save draft frequently`,
      completed: false,
      order: 23,
      phase: "PHASE 3",
      stepNumber: "3.2",
      documentsNeeded: "None - online forms",
      cost: "$0",
    },
    {
      title: "Upload All Supporting Documents",
      description: `• Upload documents in correct categories
• File naming: Clear and descriptive
• File format: PDF preferred
• File size: Follow BC PNP limits
• Ensure documents are:
  - Clear and legible
  - Complete (all pages)
  - Properly translated (if applicable)
• Double-check all uploads before submission`,
      completed: false,
      order: 24,
      phase: "PHASE 3",
      stepNumber: "3.3",
      documentsNeeded: "All documents from Step 3.1",
      cost: "$0",
    },
    {
      title: "Pay BC PNP Application Fee",
      description: `Payment amount depends on stream:
• Base BC PNP: $700
• Express Entry BC: $1,150

Payment by credit card
Save receipt confirmation
Fee is NON-REFUNDABLE`,
      completed: false,
      order: 25,
      phase: "PHASE 3",
      stepNumber: "3.4",
      documentsNeeded: "Credit card",
      cost: "$700 or $1,150",
    },
    {
      title: "Review and Submit Application",
      description: `• Review entire application thoroughly
• Check all information is accurate
• Verify all documents uploaded correctly
• Confirm fee payment processed
• Click SUBMIT
• Print/save confirmation page
• Note your BC PNP file number
• Save confirmation email`,
      completed: false,
      order: 26,
      phase: "PHASE 3",
      stepNumber: "3.5",
      documentsNeeded: "Complete application",
      cost: "Already paid",
    },

    // PHASE 4: BC PNP PROCESSING (3-4 months)
    {
      title: "Monitor BC PNP Portal Daily",
      description: `• Check portal and email daily
• BC PNP may request additional documents
• Typical requests:
  - Clarification on job duties
  - Updated employment letter
  - Additional proof of work
• Response deadline: Usually 7-14 days
• CRITICAL: Missing deadline = automatic refusal`,
      completed: false,
      order: 27,
      phase: "PHASE 4",
      stepNumber: "4.1",
      documentsNeeded: "None initially",
      cost: "$0",
    },
    {
      title: "BC PNP Verifies Information",
      description: `• BC PNP contacts your employer to verify job offer
• Employer should be prepared to confirm:
  - Your employment
  - Job duties
  - Salary
  - Permanent position
• BC PNP checks education credentials
• Background verification conducted`,
      completed: false,
      order: 28,
      phase: "PHASE 4",
      stepNumber: "4.2",
      documentsNeeded: "None - BC PNP conducts checks",
      cost: "$0",
    },
    {
      title: "Maintain Status During Processing",
      description: `• Continue working at same employer
• Do NOT change jobs (can result in refusal)
• Keep work permit valid
• Do NOT change address without notifying BC PNP
• Respond immediately to all BC PNP communications`,
      completed: false,
      order: 29,
      phase: "PHASE 4",
      stepNumber: "4.3",
      documentsNeeded: "Work permit, employment",
      cost: "$0",
    },
    {
      title: "Receive BC PNP Decision",
      description: `OPTION A - APPROVED (Most common if application complete):
• Receive email: "Application Approved"
• Download Provincial Nominee Certificate
• Download Confirmation of Nomination letter
• Note your Work Permit Support Letter (if needed)
• YOU HAVE 6 MONTHS TO APPLY FOR FEDERAL PR

OPTION B - Request for More Info:
• Respond within deadline
• Provide requested documents

OPTION C - Refused (rare):
• Review refusal reasons
• Can reapply after addressing issues
• May appeal if decision unfair`,
      completed: false,
      order: 30,
      phase: "PHASE 4",
      stepNumber: "4.4",
      documentsNeeded: "Nomination certificate (if approved)",
      cost: "$0",
    },

    // PHASE 5: FEDERAL PR APPLICATION
    {
      title: "Determine Federal Application Path",
      description: `PATH A - EXPRESS ENTRY BC (If you have CLB 7+):
• Apply through Express Entry online
• Processing time: ~6 months
• Real-time status tracking

PATH B - BASE BC PNP (If CLB 6 listening):
• Paper-based application
• Processing time: ~18 months
• Limited status updates

Follow steps below based on your path`,
      completed: false,
      order: 31,
      phase: "PHASE 5",
      stepNumber: "5.1",
      documentsNeeded: "BC PNP nomination certificate",
      cost: "$0",
    },
    {
      title: "Express Entry Path: Accept Nomination",
      description: `• Log into Express Entry profile
• Check for nomination notification
• Accept provincial nomination
• Your CRS score increases by 600 points
• You now have ~1000+ CRS score
• Screenshot new score`,
      completed: false,
      order: 32,
      phase: "PHASE 5",
      stepNumber: "5.2A",
      documentsNeeded: "Express Entry profile",
      cost: "$0",
    },
    {
      title: "Express Entry Path: Receive Federal ITA",
      description: `• IRCC sends ITA in next Express Entry draw
• Usually within 2 weeks of accepting nomination
• You have 60 DAYS to submit complete application
• Start gathering documents immediately`,
      completed: false,
      order: 33,
      phase: "PHASE 5",
      stepNumber: "5.2B",
      documentsNeeded: "Federal ITA letter",
      cost: "$0",
    },
    {
      title: "Obtain Police Certificates (All 3)",
      description: `CANADA:
• RCMP Criminal Record Check
• Apply online: rcmp-grc.gc.ca
• Processing: 2-4 weeks
• Cost: ~$25

CHILE:
• Certificado de Antecedentes (from PDI)
• Apply: pdichile.cl
• Must be certified translated
• Valid 6 months

PERU (If lived 6+ months after age 18):
• Certificado de Antecedentes Penales
• Apply: gob.pe/antecedentes
• Must be certified translated
• Valid 6 months

All certificates must be less than 6 months old at time of application`,
      completed: false,
      order: 34,
      phase: "PHASE 5",
      stepNumber: "5.3",
      documentsNeeded: "Police certificates from all 3 countries",
      cost: "$150 total",
    },
    {
      title: "Complete Medical Examination",
      description: `• Find IRCC Panel Physician: secure.cic.gc.ca/pp-md/pp-list.aspx
• Book appointment in Vancouver
• Bring:
  - Passport
  - 4 passport photos
  - Glasses/contact lenses (if worn)
  - Medical history
  - Payment (~$250)
• Exam includes:
  - Physical examination
  - Chest X-ray
  - Blood tests
  - Urine tests
• Doctor uploads results directly to IRCC
• Results valid 12 months`,
      completed: false,
      order: 35,
      phase: "PHASE 5",
      stepNumber: "5.4",
      documentsNeeded: "Passport, photos",
      cost: "$250",
    },
    {
      title: "Prepare Federal PR Application Documents",
      description: `Complete document checklist:
□ BC PNP nomination certificate
□ Passport bio pages (all pages with stamps)
□ Birth certificate
□ Police certificates (Canada, Chile, Peru)
□ Medical exam confirmation
□ CELPIP results
□ WES ECA report
□ All employment reference letters (4 letters)
□ Proof of work experience (T4s, pay stubs, contracts)
□ Job offer letter
□ Proof of relationship (if married)
□ Spouse documents (if applicable)
□ Digital photos (PR specifications)
□ Proof of funds (if required)`,
      completed: false,
      order: 36,
      phase: "PHASE 5",
      stepNumber: "5.5",
      documentsNeeded: "See complete list in details",
      cost: "$0",
    },
    {
      title: "Submit Federal PR (Express Entry Path)",
      description: `• Log into IRCC online account
• Complete all forms online:
  - Generic Application Form (IMM 0008)
  - Schedule A - Background (IMM 5669)
  - Additional Family Information (IMM 5406)
  - Use of Representative (if applicable)
• Upload ALL documents
• Pay fees:
  - PR application: $825
  - Right of PR Fee (RPRF): $575
  - Biometrics: $85
  - Total: $1,485
• Review thoroughly
• Submit application
• Receive Acknowledgement of Receipt (AOR)
• Save AOR number - your tracking number!`,
      completed: false,
      order: 37,
      phase: "PHASE 5",
      stepNumber: "5.6A",
      documentsNeeded: "All documents from 5.5",
      cost: "$1,485",
    },
    {
      title: "Submit Federal PR (Paper-Based Path)",
      description: `• Download forms from IRCC website:
  - Generic Application Form (IMM 0008)
  - Schedule A (IMM 5669)
  - Additional Family Info (IMM 5406)
  - Document Checklist (IMM 5690)
  - Supplementary Information (IMM 5562)
• Complete all forms (can fill PDF or print and handwrite)
• Include payment receipt ($1,485 total)
• Make copies of everything
• Mail to correct IRCC office address:
  Case Processing Centre - Sydney
  P.O. Box 9500
  Sydney, NS  B1P 0G6
  Canada
• Send by courier with tracking
• Wait for AOR by mail (4-8 weeks)`,
      completed: false,
      order: 38,
      phase: "PHASE 5",
      stepNumber: "5.6B",
      documentsNeeded: "All documents from 5.5",
      cost: "$1,485",
    },

    // PHASE 6: FEDERAL PR PROCESSING (6-18 months)
    {
      title: "Link Application (If Paper-Based)",
      description: `• Create GCKey account: cic.gc.ca
• Link paper application to online account
• Allows online status tracking
• Requires:
  - Application number (from AOR)
  - Personal information
  - Family name, date of birth, etc.`,
      completed: false,
      order: 39,
      phase: "PHASE 6",
      stepNumber: "6.1",
      documentsNeeded: "AOR with application number",
      cost: "$0",
    },
    {
      title: "Complete Biometrics",
      description: `• Receive Biometrics Instruction Letter (within 30 days)
• Book appointment at Service Canada:
  - Vancouver Service Canada locations
  - Book online or by phone
• Attend appointment:
  - Bring passport
  - Bring biometrics letter
  - Pay $85 (if not paid with application)
  - Fingerprints taken
  - Digital photo taken
• Must complete within 30 days of request
• Biometrics valid 10 years`,
      completed: false,
      order: 40,
      phase: "PHASE 6",
      stepNumber: "6.2",
      documentsNeeded: "Passport, biometrics letter",
      cost: "$85 (if not paid)",
    },
    {
      title: "Monitor Application Status",
      description: `• Check online account regularly (weekly)
• Typical processing stages:
  1. Application received
  2. Medical results received
  3. Biometrics completed
  4. Background check in progress
  5. Eligibility passed
  6. Security started
  7. Criminality passed
  8. Final review
  9. Decision made
• Processing times:
  - Express Entry: ~6 months
  - Paper-based: ~18 months
• Can vary based on IRCC workload`,
      completed: false,
      order: 41,
      phase: "PHASE 6",
      stepNumber: "6.3",
      documentsNeeded: "None - monitoring only",
      cost: "$0",
    },
    {
      title: "Respond to IRCC Requests",
      description: `• IRCC may request:
  - Additional documents
  - Updated police certificates (if expired)
  - Re-examination medical (if processing >12 months)
  - Proof of employment
  - Explanation letters
• Deadline: Usually 30-60 days
• Upload documents through online portal
• Confirm receipt of your submission`,
      completed: false,
      order: 42,
      phase: "PHASE 6",
      stepNumber: "6.4",
      documentsNeeded: "As requested by IRCC",
      cost: "Varies",
    },
    {
      title: "Maintain Valid Status",
      description: `• Keep work permit valid throughout processing
• If work permit expires before PR:
  - Apply for Bridging Open Work Permit (BOWP)
  - Can apply 4 months before expiry
  - OR when in final stages of PR processing
  - Cost: ~$255
  - Allows continued work while waiting
• Keep employer informed of status
• Do NOT travel extensively (can delay processing)`,
      completed: false,
      order: 43,
      phase: "PHASE 6",
      stepNumber: "6.5",
      documentsNeeded: "Work permit, BOWP if needed",
      cost: "$255 (BOWP if needed)",
    },
    {
      title: "Receive Pre-Arrival Services Invitation",
      description: `• When application near approval, may receive:
• Pre-Arrival Services invitation
• Indicates application progressing well
• Free settlement services:
  - Job search assistance
  - Credential recognition info
  - Community connections
• Optional but recommended`,
      completed: false,
      order: 44,
      phase: "PHASE 6",
      stepNumber: "6.6",
      documentsNeeded: "None",
      cost: "$0 (services free)",
    },
    {
      title: "Passport Request",
      description: `• Receive email: "Ready for Visa" or "Passport Request"
• CONGRATULATIONS - Your PR is approved!
• Instructions:
  IF IN CANADA:
  - Send photocopy of passport bio pages
  - Include 2 PR photos (50mm x 70mm)
  - Include passport request letter
  - Mail to address specified
  
  IF OUTSIDE CANADA:
  - Submit original passport
  - IRCC will affix visa
• Deadline: Usually 30 days
• Use secure mail with tracking`,
      completed: false,
      order: 45,
      phase: "PHASE 6",
      stepNumber: "6.7",
      documentsNeeded: "Passport, PR photos",
      cost: "$20 (photos + mail)",
    },

    // PHASE 7: COPR & LANDING
    {
      title: "Receive COPR (Confirmation of Permanent Residence)",
      description: `• Receive COPR document:
  - By mail (if in Canada)
  - By email as eCOPR (virtual landing)
  - With passport (if outside Canada)
• COPR contains:
  - Your photo
  - Personal information
  - COPR number
  - Valid until date (usually 12 months or passport expiry)
• VERIFY ALL INFORMATION:
  - Name spelled correctly
  - Date of birth correct
  - Height, eye color accurate
  - Passport number matches
• IF ERRORS: Contact IRCC immediately!
• DO NOT SIGN until instructed`,
      completed: false,
      order: 46,
      phase: "PHASE 7",
      stepNumber: "7.1",
      documentsNeeded: "COPR document",
      cost: "$0",
    },
    {
      title: "Complete PR Landing Process",
      description: `OPTION A - VIRTUAL LANDING (eCOPR):
• Receive portal invitation email
• Create portal account
• Confirm Canadian address
• Upload photo for PR card
• Declare not having inadmissibility
• Submit
• Receive eCOPR by email
• YOU ARE NOW A PERMANENT RESIDENT!

OPTION B - IN-PERSON LANDING:
• If instructed, book appointment at IRCC office
• OR visit land border (flagpole)
• Bring:
  - COPR original
  - Valid passport
  - Work permit
  - All family members
• Officer reviews documents
• Asks about plans in Canada
• You sign COPR (Part 1 and Part 2)
• Officer stamps COPR
• YOU ARE NOW A PERMANENT RESIDENT!`,
      completed: false,
      order: 47,
      phase: "PHASE 7",
      stepNumber: "7.2",
      documentsNeeded: "COPR, passport, work permit",
      cost: "$0",
    },
    {
      title: "Receive PR Card (6-8 weeks)",
      description: `• IRCC automatically processes PR card after landing
• Mailed to address you provided
• Wait: 6-8 weeks (can be longer)
• Check status: services.cic.gc.ca
• PR card valid 5 years
• IMPORTANT:
  - Do NOT travel outside Canada before receiving card
  - If must travel, apply for PR Travel Document
  - Card is proof of PR status for re-entry to Canada`,
      completed: false,
      order: 48,
      phase: "PHASE 7",
      stepNumber: "7.3",
      documentsNeeded: "None - automatic",
      cost: "$0",
    },
    {
      title: "Apply for Social Insurance Number (SIN)",
      description: `• Visit Service Canada office (same day or next day)
• Bring:
  - Signed COPR or eCOPR
  - Passport
• Application FREE
• Processing: Immediate (same day)
• Receive SIN letter/card
• Update SIN with employer immediately
• Use for:
  - Employment
  - Taxes
  - Government benefits
  - Banking`,
      completed: false,
      order: 49,
      phase: "PHASE 7",
      stepNumber: "7.4",
      documentsNeeded: "COPR, passport",
      cost: "$0 (FREE)",
    },
    {
      title: "Register for BC Healthcare (MSP)",
      description: `• Apply for BC Medical Services Plan
• Online: www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp
• Required documents:
  - COPR
  - Passport
  - Proof of BC residency
• Processing: ~3 months
• Until MSP active:
  - Keep private insurance
  - Or use interim coverage
• MSP covers:
  - Doctor visits
  - Hospital care
  - Medical services`,
      completed: false,
      order: 50,
      phase: "PHASE 7",
      stepNumber: "7.5",
      documentsNeeded: "COPR, passport, proof of address",
      cost: "$0 (MSP monthly premiums eliminated in BC)",
    },

    // PHASE 8: FIRST STEPS AS PR
    {
      title: "Update All Records",
      description: `• Update with employer:
  - Provide new SIN
  - Update HR records
  - Notify of PR status
• Update financial institutions:
  - Banks (update SIN and status)
  - Credit cards
  - Investment accounts
• Update government records:
  - CRA (for taxes)
  - ICBC (driver license if applicable)
  - Service BC
• Update insurance:
  - Car insurance
  - Life insurance
  - Private health insurance`,
      completed: false,
      order: 51,
      phase: "PHASE 8",
      stepNumber: "8.1",
      documentsNeeded: "COPR, SIN, PR card (when received)",
      cost: "$0",
    },
    {
      title: "Understand PR Obligations",
      description: `RESIDENCY OBLIGATION:
• Must be physically present in Canada:
  730 days (2 years) out of every 5 years
• Track your time outside Canada
• Keep travel records

RIGHTS:
✓ Live, work, study anywhere in Canada
✓ Healthcare coverage
✓ Social benefits
✓ Protection under Canadian law
✓ Sponsor family members
✓ Apply for citizenship (after 1095 days)

RESPONSIBILITIES:
• Pay taxes
• Respect Canadian laws
• Cannot vote (until citizen)
• Cannot run for political office (until citizen)
• Can lose PR if:
  - Don't meet residency obligation
  - Convicted of serious crime
  - Misrepresentation on application`,
      completed: false,
      order: 52,
      phase: "PHASE 8",
      stepNumber: "8.2",
      documentsNeeded: "None - information only",
      cost: "$0",
    },
    {
      title: "Plan for Canadian Citizenship",
      description: `• Eligible to apply after:
  - 3 years (1095 days) as PR
  - Physical presence in Canada
• Time counting rules:
  - Days as PR: Count as 1 day
  - Days as temporary resident (before PR): Count as 0.5 day (max 365 days credit)
• Citizenship application:
  - Cost: ~$630
  - Processing: 12-24 months
  - Must pass citizenship test
  - Must attend ceremony
• Benefits of citizenship:
  - Canadian passport
  - Right to vote
  - No residency obligation
  - Cannot lose citizenship
• Start tracking your time NOW!`,
      completed: false,
      order: 53,
      phase: "PHASE 8",
      stepNumber: "8.3",
      documentsNeeded: "None yet",
      cost: "$630 (when eligible)",
    },
    {
      title: "Celebrate Your Success!",
      description: `• YOU DID IT!
• You are now a Canadian Permanent Resident!
• Total journey completed:
  - Months of preparation
  - Language testing
  - Document gathering
  - BC PNP application
  - Federal PR processing
  - AND YOU SUCCEEDED!

• Share your good news with:
  - Family and friends
  - Your employer
  - People who helped you

• Your future in Canada:
  ✓ Permanent status
  ✓ Path to citizenship
  ✓ Build your life here
  ✓ Enjoy all Canada offers

CONGRATULATIONS! 🇨🇦`,
      completed: false,
      order: 54,
      phase: "PHASE 8",
      stepNumber: "8.4",
      documentsNeeded: "PR Card in hand!",
      cost: "PRICELESS!",
    },
  ];

  const today = getToday();

  // Create tasks with IDs and auto-generate substeps from bullet points
  const tasks: Task[] = tasksData.map((task) => {
    const taskWithId = {
      ...task,
      id: generateId(),
    };
    
    // Apply substep parser to convert bullet points to substeps
    return enhanceTaskWithSubsteps(taskWithId);
  });

  // Assign task IDs to phases
  const phase1Tasks = tasks.filter(t => t.phase === "PHASE 1").map(t => t.id);
  const phase2Tasks = tasks.filter(t => t.phase === "PHASE 2").map(t => t.id);
  const phase3Tasks = tasks.filter(t => t.phase === "PHASE 3").map(t => t.id);
  const phase4Tasks = tasks.filter(t => t.phase === "PHASE 4").map(t => t.id);
  const phase5Tasks = tasks.filter(t => t.phase === "PHASE 5").map(t => t.id);
  const phase6Tasks = tasks.filter(t => t.phase === "PHASE 6").map(t => t.id);
  const phase7Tasks = tasks.filter(t => t.phase === "PHASE 7").map(t => t.id);
  const phase8Tasks = tasks.filter(t => t.phase === "PHASE 8").map(t => t.id);

  phases[0].taskIds = phase1Tasks;
  phases[1].taskIds = phase2Tasks;
  phases[2].taskIds = phase3Tasks;
  phases[3].taskIds = phase4Tasks;
  phases[4].taskIds = phase5Tasks;
  phases[5].taskIds = phase6Tasks;
  phases[6].taskIds = phase7Tasks;
  phases[7].taskIds = phase8Tasks;

  return {
    id: generateId(),
    title: "BC PNP to Permanent Residence",
    description: "Complete end-to-end checklist from Day 1 to PR Card Receipt | 55 Steps across 8 Phases",
    tasks,
    phases,
    budget: getBudgetSummary(),
    timeline: getTimelineComparison(),
    documents: getDocumentChecklist(),
    resources: getOfficialResources(),
    createdAt: today,
    updatedAt: today,
  };
}

function getBudgetSummary(): BudgetSummary {
  return {
    items: [
      { phase: "Phase 1", item: "WES ECA Application", cost: "$256", timing: "Week 1", notes: "Educational credential assessment" },
      { phase: "Phase 1", item: "CELPIP Test Booking", cost: "$290", timing: "Week 1", notes: "Language test booking" },
      { phase: "Phase 1", item: "Study Materials", cost: "$189", timing: "Week 1", notes: "Optional but recommended" },
      { phase: "Phase 1", item: "Document Translation", cost: "$300-400", timing: "Weeks 7-8", notes: "Chilean reference letters" },
      { phase: "Phase 1", item: "Courier/Notary", cost: "$100", timing: "Weeks 7-8", notes: "Document handling" },
      { phase: "Phase 3", item: "BC PNP Base Application", cost: "$700", timing: "When ITA received", notes: "IF Base BC PNP" },
      { phase: "Phase 3", item: "BC PNP Express Entry", cost: "$1,150", timing: "When ITA received", notes: "IF Express Entry BC" },
      { phase: "Phase 5", item: "Police Certificates", cost: "$150", timing: "After nomination", notes: "Canada, Chile, Peru" },
      { phase: "Phase 5", item: "Medical Examination", cost: "$250", timing: "After nomination", notes: "Panel physician" },
      { phase: "Phase 5", item: "Federal PR Processing", cost: "$825", timing: "After nomination", notes: "IRCC processing fee" },
      { phase: "Phase 5", item: "Right of PR Fee (RPRF)", cost: "$575", timing: "After nomination", notes: "Landing fee" },
      { phase: "Phase 5", item: "Biometrics", cost: "$85", timing: "After nomination", notes: "Fingerprints + photo" },
      { phase: "Phase 6", item: "BOWP (if needed)", cost: "$255", timing: "If work permit expires", notes: "Optional - only if needed" },
      { phase: "Phase 7", item: "PR Photos + Mailing", cost: "$20", timing: "Final stage", notes: "Photos for PR card" },
    ],
    totalBase: "$3,720-3,820",
    totalExpressEntry: "$4,170-4,270",
    difference: "$450",
    timeSaved: "11 months faster for $450",
  };
}

function getTimelineComparison(): TimelineComparison {
  return {
    phases: [
      { phase: "Preparation", baseOption: "~14 weeks", expressOption: "~14 weeks", timeSaved: "Same" },
      { phase: "CELPIP Result", baseOption: "Can proceed with CLB 6", expressOption: "Requires CLB 7+ all sections", timeSaved: "N/A" },
      { phase: "BC PNP ITA Wait", baseOption: "Variable (limited draws)", expressOption: "Variable (more frequent)", timeSaved: "~0-2 months" },
      { phase: "BC PNP Processing", baseOption: "~3 months", expressOption: "~3 months", timeSaved: "Same" },
      { phase: "Federal Processing", baseOption: "~18 months (paper)", expressOption: "~6 months (electronic)", timeSaved: "12 months" },
      { phase: "Landing", baseOption: "~2 weeks", expressOption: "~2 weeks", timeSaved: "Same" },
    ],
    totalBase: "~27 months",
    totalExpress: "~16 months",
    totalTimeSaved: "11 MONTHS",
    baseAdvantages: ["Lower cost", "Can start immediately"],
    expressAdvantages: ["Much faster", "Online tracking", "Better status updates"],
  };
}

function getDocumentChecklist(): DocumentItem[] {
  return [
    { id: generateId(), name: "WES ECA Report", requiredFor: "BC PNP", whenNeeded: "Week 9-10", status: "pending", notes: "Valid 5 years" },
    { id: generateId(), name: "CELPIP Test Results", requiredFor: "BC PNP & Federal", whenNeeded: "Week 13-14", status: "pending", notes: "Valid 2 years" },
    { id: generateId(), name: "Reference Letter - Current Job", requiredFor: "BC PNP", whenNeeded: "Week 6-8", status: "pending", notes: "Software dev duties emphasized" },
    { id: generateId(), name: "Reference Letter - Previous Canadian", requiredFor: "BC PNP", whenNeeded: "Week 6-8", status: "pending", notes: "VDC/BIM position" },
    { id: generateId(), name: "Reference Letter - Chile BIM Coordinator", requiredFor: "BC PNP", whenNeeded: "Week 7-8", status: "pending", notes: "Must be translated" },
    { id: generateId(), name: "Reference Letter - Chile BIM Modeler", requiredFor: "BC PNP", whenNeeded: "Week 7-8", status: "pending", notes: "Must be translated" },
    { id: generateId(), name: "Certified Translation + Originals", requiredFor: "BC PNP", whenNeeded: "Week 7-8", status: "pending", notes: "Chilean documents" },
    { id: generateId(), name: "Translator Certification", requiredFor: "BC PNP", whenNeeded: "Week 7-8", status: "pending", notes: "ATIBC or equivalent" },
    { id: generateId(), name: "T4 Slips (2022, 2023, 2024)", requiredFor: "BC PNP", whenNeeded: "Week 14", status: "pending", notes: "Current employer" },
    { id: generateId(), name: "Pay Stubs (recent 3 months)", requiredFor: "BC PNP", whenNeeded: "Week 14", status: "pending", notes: "Current employer" },
    { id: generateId(), name: "Employment Contract - Current", requiredFor: "BC PNP", whenNeeded: "Week 14", status: "pending" },
    { id: generateId(), name: "Job Offer Letter", requiredFor: "BC PNP", whenNeeded: "Week 14", status: "pending", notes: "Permanent, full-time" },
    { id: generateId(), name: "Work Permit Copy", requiredFor: "BC PNP", whenNeeded: "Week 1", status: "pending", notes: "Current valid permit" },
    { id: generateId(), name: "Passport Bio Pages", requiredFor: "BC PNP & Federal", whenNeeded: "Week 1", status: "pending", notes: "All pages with stamps" },
    { id: generateId(), name: "Birth Certificate", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "Original or certified copy" },
    { id: generateId(), name: "Police Certificate - Canada", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "RCMP, valid 6 months" },
    { id: generateId(), name: "Police Certificate - Chile", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "PDI, must translate" },
    { id: generateId(), name: "Police Certificate - Peru", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "Only if lived 6+ months" },
    { id: generateId(), name: "Medical Exam Results", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "Panel physician uploads" },
    { id: generateId(), name: "Biometrics Confirmation", requiredFor: "Federal PR", whenNeeded: "After federal submission", status: "pending", notes: "Service Canada" },
    { id: generateId(), name: "Digital Photos (PR specs)", requiredFor: "Federal PR", whenNeeded: "After nomination", status: "pending", notes: "50mm x 70mm" },
    { id: generateId(), name: "BC PNP Nomination Certificate", requiredFor: "Federal PR", whenNeeded: "After BC PNP approval", status: "pending", notes: "From BC PNP portal" },
    { id: generateId(), name: "Proof of Funds", requiredFor: "Federal PR", whenNeeded: "If required", status: "pending", notes: "Bank statements" },
    { id: generateId(), name: "Marriage Certificate", requiredFor: "Federal PR", whenNeeded: "If married", status: "pending", notes: "If applicable" },
    { id: generateId(), name: "Spouse Documents", requiredFor: "Federal PR", whenNeeded: "If married", status: "pending", notes: "If applicable" },
  ];
}

function getOfficialResources(): ResourceCategory[] {
  return [
    {
      category: "BC PNP",
      resources: [
        { name: "BC PNP Online Portal", url: "https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-online-user-portal" },
        { name: "Program Guide (PDF)", url: "https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-si-program-guide-pdf" },
        { name: "Technical Guide", url: "https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-technical-guide" },
        { name: "Invitations to Apply", url: "https://www.welcomebc.ca/immigrate-to-b-c/invitations-to-apply" },
        { name: "BC PNP Email", url: "mailto:pnpinfo@gov.bc.ca" },
      ],
    },
    {
      category: "Federal IRCC",
      resources: [
        { name: "IRCC Main Website", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html" },
        { name: "Express Entry", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" },
        { name: "Provincial Nominees", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html" },
        { name: "Check Application Status", url: "https://services.cic.gc.ca" },
        { name: "Processing Times", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html" },
      ],
    },
    {
      category: "ECA",
      resources: [
        { name: "WES Canada", url: "https://www.wes.org/eca/" },
        { name: "WES Document Requirements", url: "https://www.wes.org/required-documents/" },
      ],
    },
    {
      category: "Language Test",
      resources: [
        { name: "CELPIP Official", url: "https://www.celpip.ca" },
        { name: "Book CELPIP Test", url: "https://www.celpip.ca/take-celpip/" },
        { name: "Free Practice Tests", url: "https://www.celpip.ca/prepare-for-celpip/free-practice-tests/" },
        { name: "Study Materials Store", url: "https://store.celpip.ca" },
      ],
    },
    {
      category: "Medical",
      resources: [
        { name: "Find Panel Physician", url: "https://secure.cic.gc.ca/pp-md/pp-list.aspx" },
        { name: "Medical Exam Info", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/medical-police/medical-exams.html" },
      ],
    },
    {
      category: "Police Certificates",
      resources: [
        { name: "RCMP (Canada)", url: "https://www.rcmp-grc.gc.ca/en/criminal-record-and-vulnerable-sector-checks" },
        { name: "PDI Chile", url: "https://www.pdichile.cl" },
        { name: "Peru Antecedentes", url: "https://www.gob.pe/antecedentes" },
      ],
    },
    {
      category: "Translation",
      resources: [
        { name: "ATIBC (BC Translators)", url: "https://www.atibc.org" },
        { name: "STIBC", url: "https://www.stibc.org" },
      ],
    },
    {
      category: "After Landing",
      resources: [
        { name: "Service Canada (SIN)", url: "https://www.canada.ca/en/employment-social-development/services/sin.html" },
        { name: "BC MSP (Healthcare)", url: "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp" },
        { name: "PR Card Status", url: "https://services.cic.gc.ca" },
        { name: "ICBC (Driver License)", url: "https://www.icbc.com" },
      ],
    },
  ];
}

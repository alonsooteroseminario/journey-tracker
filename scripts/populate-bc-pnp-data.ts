#!/usr/bin/env tsx
/**
 * Script to populate BC PNP goal with Express Entry tasks and substeps
 * Run with: npx tsx scripts/populate-bc-pnp-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateId } from '../src/lib/storage';

const prisma = new PrismaClient();

interface PhaseData {
  phaseId: string;
  tasks: {
    title: string;
    description: string;
    substeps?: {
      title: string;
      description: string;
    }[];
  }[];
}

const phasesData: PhaseData[] = [
  {
    phaseId: 'PHASE 2: WAITING FOR BC PNP ITA',
    tasks: [
      {
        title: 'Create Express Entry Profile',
        description: 'Create profile on IRCC Express Entry system and obtain profile number and Job Seeker Validation Code',
        substeps: [
          {
            title: 'Gather required documents',
            description: 'Collect: Language test results (CELPIP CLB 7+), ECA report number (WES), Work experience details, Education details, Passport information'
          },
          {
            title: 'Check program eligibility',
            description: 'Verify eligibility for Federal Skilled Worker Program (FSWP) and Canadian Experience Class (CEC). CEC requires minimum 1 year skilled Canadian work experience in past 3 years and CLB 7 for TEER 0 or 1 jobs'
          },
          {
            title: 'Complete Express Entry profile',
            description: 'Submit profile at https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html'
          },
          {
            title: 'Save Express Entry Profile Number',
            description: 'Record Express Entry Profile Number (starts with E) - required for BC PNP registration'
          },
          {
            title: 'Save Job Seeker Validation Code',
            description: 'Record 4-digit Job Seeker Validation Code - required for BC PNP registration'
          }
        ]
      },
      {
        title: 'Calculate CRS Score',
        description: 'Calculate Comprehensive Ranking System score to understand ranking in Express Entry pool',
        substeps: [
          {
            title: 'Calculate base CRS points',
            description: 'Age (30-35): ~90-100 pts, Education (Bachelor): ~120 pts, Language (CLB 9): ~128 pts, Canadian exp (4 yrs): ~70 pts, Foreign exp (3+ yrs): ~25 pts. Estimated: 430-445 points'
          },
          {
            title: 'Verify provincial nomination bonus',
            description: 'Confirm BC PNP nomination adds +600 points, bringing total to 1,030-1,045 points (guaranteed ITA)'
          }
        ]
      },
      {
        title: 'Register in BC PNP SIRS (Express Entry BC)',
        description: 'Create BC PNP profile and register in Skills Immigration Registration System',
        substeps: [
          {
            title: 'Create BC PNP online account',
            description: 'Register at BC PNP online portal for Express Entry BC stream'
          },
          {
            title: 'Select Express Entry BC - Skilled Worker stream',
            description: 'Important: Must select stream starting with "Express Entry BC" to ensure nomination connects to IRCC Express Entry profile'
          },
          {
            title: 'Enter Express Entry Profile Number',
            description: 'Provide your Express Entry Profile Number (starts with E)'
          },
          {
            title: 'Enter Job Seeker Validation Code',
            description: 'Provide your 4-digit Job Seeker Validation Code'
          },
          {
            title: 'Complete SIRS registration',
            description: 'Submit all required information for Skills Immigration Registration System'
          }
        ]
      },
      {
        title: 'Monitor SIRS Score and Draws',
        description: 'Track your SIRS score (estimated 120-150/200) and monitor weekly BC PNP draws',
        substeps: [
          {
            title: 'Check SIRS score calculation',
            description: 'Review your score breakdown. Higher language scores provide more SIRS points'
          },
          {
            title: 'Monitor weekly draw announcements',
            description: 'Check BC PNP draw results weekly. Note: 2025 has restrictions (~100 high economic impact ITAs)'
          },
          {
            title: 'Maintain profile and employment',
            description: 'Keep Express Entry and BC PNP profiles updated, maintain valid job offer and work permit'
          }
        ]
      }
    ]
  },
  {
    phaseId: 'PHASE 3: BC PNP APPLICATION',
    tasks: [
      {
        title: 'Receive Invitation to Apply (ITA)',
        description: 'Receive ITA from BC PNP based on SIRS score and draw',
        substeps: [
          {
            title: 'Check BC PNP portal for ITA',
            description: 'Monitor your BC PNP account for invitation notification'
          },
          {
            title: 'Review ITA requirements',
            description: 'Read all requirements and submission deadline (30 days from ITA date)'
          },
          {
            title: 'Prepare document checklist',
            description: 'Create comprehensive checklist of all required documents'
          }
        ]
      },
      {
        title: 'Gather Required Documents',
        description: 'Collect all supporting documents for BC PNP application',
        substeps: [
          {
            title: 'Educational Credential Assessment (ECA)',
            description: 'WES evaluation report for foreign credentials'
          },
          {
            title: 'Language test results',
            description: 'Valid CELPIP or IELTS results showing CLB 7+ (CELPIP General preferred)'
          },
          {
            title: 'Employment reference letters',
            description: 'Detailed letters from all employers (Canadian and foreign) showing duties, hours, salary'
          },
          {
            title: 'Valid BC job offer letter',
            description: 'Job offer from BC employer showing TEER 0, 1, 2, or 3 position, full-time, indeterminate'
          },
          {
            title: 'Proof of work authorization',
            description: 'Copy of valid work permit and authorization to work in Canada'
          },
          {
            title: 'Employer documents',
            description: 'BC employer registration confirmation and supporting business documents'
          }
        ]
      },
      {
        title: 'Complete BC PNP Application',
        description: 'Fill out and submit online BC PNP application within 30 days',
        substeps: [
          {
            title: 'Fill application forms',
            description: 'Complete all sections of BC PNP online application accurately'
          },
          {
            title: 'Upload supporting documents',
            description: 'Upload all required documents in correct format (PDF, size limits)'
          },
          {
            title: 'Review application thoroughly',
            description: 'Double-check all information, dates, and document uploads for accuracy'
          },
          {
            title: 'Pay application fee',
            description: 'Pay $1,150 CAD BC PNP application fee for Express Entry BC stream'
          },
          {
            title: 'Submit application',
            description: 'Submit completed application before 30-day deadline'
          },
          {
            title: 'Save application confirmation',
            description: 'Save submission confirmation and application number'
          }
        ]
      }
    ]
  },
  {
    phaseId: 'PHASE 4: BC PNP PROCESSING',
    tasks: [
      {
        title: 'Application Under Review',
        description: 'BC PNP reviews application (2-3 months average for Express Entry BC)',
        substeps: [
          {
            title: 'Monitor application status',
            description: 'Check BC PNP portal regularly for status updates'
          },
          {
            title: 'Respond to additional document requests',
            description: 'Quickly provide any additional information or documents if requested'
          },
          {
            title: 'Maintain valid status',
            description: 'Ensure work permit, job offer, and employment remain valid during processing'
          }
        ]
      },
      {
        title: 'Receive BC PNP Nomination',
        description: 'Receive provincial nomination decision and certificate',
        substeps: [
          {
            title: 'Check nomination decision',
            description: 'Review nomination decision letter and certificate in BC PNP portal'
          },
          {
            title: 'Download nomination certificate',
            description: 'Save PDF copy of provincial nomination certificate'
          },
          {
            title: 'Note nomination acceptance deadline',
            description: 'Record deadline to accept nomination in Express Entry profile (typically within days)'
          }
        ]
      },
      {
        title: 'Accept Provincial Nomination',
        description: 'Accept BC PNP nomination in your Express Entry profile to receive 600 CRS points',
        substeps: [
          {
            title: 'Log into Express Entry profile',
            description: 'Access your IRCC Express Entry account'
          },
          {
            title: 'Accept provincial nomination',
            description: 'Click to accept the BC PNP nomination in your profile'
          },
          {
            title: 'Verify CRS score update',
            description: 'Confirm your CRS score increased by 600 points (to 1,030-1,045 total)'
          }
        ]
      }
    ]
  },
  {
    phaseId: 'PHASE 5: FEDERAL PR APPLICATION',
    tasks: [
      {
        title: 'Receive Federal ITA',
        description: 'Receive Invitation to Apply for permanent residence from IRCC (typically within 2 weeks of accepting nomination)',
        substeps: [
          {
            title: 'Check Express Entry account',
            description: 'Monitor for federal ITA notification (next draw after nomination acceptance)'
          },
          {
            title: 'Review ITA details',
            description: 'Read ITA letter and requirements carefully'
          },
          {
            title: 'Note 60-day deadline',
            description: 'Mark deadline to submit e-APR (60 days from ITA date)'
          }
        ]
      },
      {
        title: 'Prepare Federal PR Documents',
        description: 'Gather all required documents for federal permanent residence application',
        substeps: [
          {
            title: 'Compile previous documents',
            description: 'Organize ECA, language tests, reference letters, job offer, etc.'
          },
          {
            title: 'Book medical examination',
            description: 'Schedule medical exam with IRCC-approved panel physician ($200-300 CAD)'
          },
          {
            title: 'Complete medical exam',
            description: 'Attend appointment and obtain results/e-medical information sheet'
          },
          {
            title: 'Request police certificates',
            description: 'Apply for police clearance from Canada, Chile, and Peru (total ~$100-200 CAD)'
          },
          {
            title: 'Receive police certificates',
            description: 'Collect all police clearance documents'
          },
          {
            title: 'Prepare passport photos',
            description: 'Obtain compliant passport-style photos as per IRCC specifications'
          },
          {
            title: 'Note: Proof of funds NOT required',
            description: 'CEC applicants do not need to show proof of funds for PR application'
          }
        ]
      },
      {
        title: 'Complete e-APR Application',
        description: 'Fill out and submit electronic Application for Permanent Residence',
        substeps: [
          {
            title: 'Create IRCC portal account',
            description: 'Set up account on IRCC permanent residence application portal'
          },
          {
            title: 'Fill out all forms',
            description: 'Complete Generic Application Form (IMM 0008), Schedule A, Additional Family Info, etc.'
          },
          {
            title: 'Upload all documents',
            description: 'Upload medical results, police certificates, photos, supporting documents'
          },
          {
            title: 'Pay federal PR fees',
            description: 'Pay processing fee ($850) + Right of PR fee ($515) = $1,485 CAD total'
          },
          {
            title: 'Review application completely',
            description: 'Triple-check all information, documents, and forms before submission'
          },
          {
            title: 'Submit e-APR',
            description: 'Submit application through IRCC online portal before 60-day deadline'
          },
          {
            title: 'Save application confirmation',
            description: 'Record application number and save submission receipt'
          }
        ]
      },
      {
        title: 'Federal PR Processing',
        description: 'IRCC processes permanent residence application (6-8 months for Express Entry BC nominees)',
        substeps: [
          {
            title: 'Monitor application status',
            description: 'Check IRCC portal and GCKey account regularly for updates'
          },
          {
            title: 'Link application to GCKey',
            description: 'Link your PR application to online account for status tracking'
          },
          {
            title: 'Respond to IRCC requests',
            description: 'Quickly provide any additional documents or information if requested'
          },
          {
            title: 'Track background check progress',
            description: 'Monitor security, criminality, and eligibility screening stages'
          }
        ]
      },
      {
        title: 'Receive COPR and Become PR',
        description: 'Receive Confirmation of Permanent Residence and complete landing process',
        substeps: [
          {
            title: 'Receive COPR letter',
            description: 'Get Confirmation of Permanent Residence document via portal or mail'
          },
          {
            title: 'Review COPR details',
            description: 'Verify all information on COPR is correct (name, DOB, photo, etc.)'
          },
          {
            title: 'Complete PR confirmation',
            description: 'If inland: confirm PR through portal. If traveling: confirm at port of entry'
          },
          {
            title: 'Receive PR card',
            description: 'Wait for physical PR card to arrive by mail (typically 4-6 weeks)'
          },
          {
            title: 'Celebrate permanent residence!',
            description: '🎉 You are now a permanent resident of Canada!'
          }
        ]
      }
    ]
  }
];

async function main() {
  try {
    console.log('🚀 Starting BC PNP data population...\n');

    // Get the first user (assuming single user for now)
    // In production, you'd specify the user ID or email
    const user = await prisma.user.findFirst();

    if (!user) {
      console.error('❌ No user found. Please create a user first.');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email || user.clerkId}`);

    // Find the BC PNP goal
    const goal = await prisma.goal.findFirst({
      where: {
        userId: user.id,
        title: {
          contains: 'BC PNP',
          mode: 'insensitive'
        }
      }
    });

    if (!goal) {
      console.error('❌ BC PNP goal not found. Please create the goal first.');
      process.exit(1);
    }

    console.log(`✓ Found goal: ${goal.title}\n`);

    // Parse existing tasks
    const existingTasks = (goal.tasks as any[]) || [];
    const existingPhases = (goal.phases as any[]) || [];

    // Create a map of phase names to phase IDs
    const phaseMap = new Map<string, string>();
    existingPhases.forEach((phase: any) => {
      phaseMap.set(phase.name, phase.id);
    });

    console.log('📝 Processing phases and tasks...\n');

    let totalTasksAdded = 0;
    let totalSubstepsAdded = 0;

    for (const phaseData of phasesData) {
      const phaseId = phaseMap.get(phaseData.phaseId);

      if (!phaseId) {
        console.log(`⚠️  Phase "${phaseData.phaseId}" not found in goal, skipping...`);
        continue;
      }

      console.log(`\n📦 Processing ${phaseData.phaseId}...`);

      for (const taskData of phaseData.tasks) {
        const taskId = generateId();

        const substeps = taskData.substeps?.map((substep, index) => ({
          id: generateId(),
          title: substep.title,
          description: substep.description,
          completed: false,
          order: index + 1
        })) || [];

        const newTask = {
          id: taskId,
          title: taskData.title,
          description: taskData.description,
          completed: false,
          order: existingTasks.length + totalTasksAdded + 1,
          substeps
        };

        existingTasks.push(newTask);
        totalTasksAdded++;
        totalSubstepsAdded += substeps.length;

        console.log(`  ✓ Added task: ${taskData.title} (${substeps.length} substeps)`);

        // Update the phase to include this task
        const phaseIndex = existingPhases.findIndex((p: any) => p.id === phaseId);
        if (phaseIndex >= 0) {
          existingPhases[phaseIndex].taskIds.push(taskId);
        }
      }
    }

    // Add resources for reference
    const resources = [
      {
        category: 'Government Resources',
        resources: [
          {
            name: 'Express Entry - Immigration Canada',
            url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html'
          },
          {
            name: 'BC PNP - WelcomeBC',
            url: 'https://www.welcomebc.ca/Immigrate-to-B-C/BC-PNP-Skills-Immigration'
          },
          {
            name: 'Comprehensive Ranking System',
            url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system.html'
          }
        ]
      },
      {
        category: 'Reference Sites',
        resources: [
          {
            name: 'Elaar Immigration - BC PNP Guide',
            url: 'https://elaar.com/bc-pnp/'
          },
          {
            name: 'CanadaVisa - Express Entry',
            url: 'https://www.canadavisa.com/express-entry.html'
          },
          {
            name: 'Moving2Canada - PR Application',
            url: 'https://moving2canada.com/how-to-apply-for-pr/'
          }
        ]
      }
    ];

    // Update the goal with new tasks, phases, and resources
    await prisma.goal.update({
      where: { id: goal.id },
      data: {
        tasks: existingTasks,
        phases: existingPhases,
        resources: resources,
        updatedAt: new Date()
      }
    });

    console.log('\n✅ Data population complete!\n');
    console.log('Summary:');
    console.log(`  📊 Total tasks added: ${totalTasksAdded}`);
    console.log(`  📝 Total substeps added: ${totalSubstepsAdded}`);
    console.log(`  🔗 Resources added: ${resources.reduce((sum, cat) => sum + cat.resources.length, 0)}`);
    console.log(`  📦 Phases updated: ${phasesData.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

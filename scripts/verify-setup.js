#!/usr/bin/env node

/**
 * Journey Tracker Setup Verification Script
 * 
 * Run this to verify your MongoDB + Clerk + Redux setup is correct.
 * 
 * Usage: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function success(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${colors.yellow}!${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

console.log('\n🚀 Journey Tracker Setup Verification\n');

let issues = 0;

// Check 1: .env file exists
info('Checking environment configuration...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  success('.env file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check required variables
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];
  
  required.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
      success(`${varName} is set`);
    } else {
      error(`${varName} is missing or empty`);
      issues++;
    }
  });
} else {
  error('.env file not found');
  warn('Copy .env.example to .env and fill in your credentials');
  issues++;
}

// Check 2: Prisma schema exists
info('\nChecking Prisma configuration...');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  success('prisma/schema.prisma exists');
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const models = ['User', 'Goal', 'StreakData', 'Friendship', 'Invitation', 'SocialShare', 'ActivityLog'];
  
  models.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      success(`Model ${model} defined`);
    } else {
      error(`Model ${model} missing`);
      issues++;
    }
  });
} else {
  error('prisma/schema.prisma not found');
  issues++;
}

// Check 3: Prisma Client generated
info('\nChecking Prisma Client...');
const prismaClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
  success('Prisma Client is generated');
} else {
  error('Prisma Client not found');
  warn('Run: npx prisma generate');
  issues++;
}

// Check 4: Redux store files
info('\nChecking Redux Toolkit setup...');
const storeFiles = [
  'src/store/index.ts',
  'src/store/hooks.ts',
  'src/store/provider.tsx',
  'src/store/slices/goalsSlice.ts',
  'src/store/slices/profileSlice.ts',
  'src/store/slices/friendsSlice.ts',
  'src/store/slices/streaksSlice.ts',
];

storeFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(`${file} exists`);
  } else {
    error(`${file} missing`);
    issues++;
  }
});

// Check 5: API routes
info('\nChecking API routes...');
const apiRoutes = [
  'src/app/api/goals/route.ts',
  'src/app/api/profile/route.ts',
  'src/app/api/friends/route.ts',
  'src/app/api/streaks/route.ts',
  'src/app/api/migrate/route.ts',
];

apiRoutes.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(`${file} exists`);
  } else {
    error(`${file} missing`);
    issues++;
  }
});

// Check 6: Clerk pages
info('\nChecking Clerk authentication pages...');
const clerkPages = [
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx',
  'src/proxy.ts',
];

clerkPages.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(`${file} exists`);
  } else {
    error(`${file} missing`);
    issues++;
  }
});

// Check 7: AutoMigration component
info('\nChecking auto-migration setup...');
const migrationFiles = [
  'src/components/AutoMigration.tsx',
  'src/components/AppShell.tsx',
];

migrationFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(`${file} exists`);
  } else {
    error(`${file} missing`);
    issues++;
  }
});

// Check 8: Package dependencies
info('\nChecking npm dependencies...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    '@clerk/nextjs',
    '@prisma/client',
    '@reduxjs/toolkit',
    'react-redux',
    'zod',
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      success(`${dep} installed`);
    } else {
      error(`${dep} not installed`);
      warn(`Run: npm install ${dep}`);
      issues++;
    }
  });
  
  if (pkg.devDependencies['prisma']) {
    success('prisma (dev) installed');
  } else {
    error('prisma dev dependency not installed');
    warn('Run: npm install -D prisma');
    issues++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (issues === 0) {
  console.log(`${colors.green}✓ All checks passed!${colors.reset}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Sign up with Clerk');
  console.log('   4. Test creating a goal');
  console.log('   5. Check MongoDB Atlas for data\n');
} else {
  console.log(`${colors.red}✗ Found ${issues} issue(s)${colors.reset}`);
  console.log('\n📝 Please fix the errors above and run this script again.\n');
  process.exit(1);
}

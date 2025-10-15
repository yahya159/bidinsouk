#!/usr/bin/env tsx
/**
 * Comprehensive Health Check Script
 * Verifies all critical systems are operational
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface HealthCheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: unknown
}

const results: HealthCheckResult[] = []

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...')
  
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  const missing: string[] = []
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    results.push({
      name: 'Environment Variables',
      status: 'fail',
      message: `Missing required variables: ${missing.join(', ')}`,
      details: { missing, required }
    })
  } else {
    results.push({
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set'
    })
  }
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...')
  
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    
    results.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to database'
    })
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect to database',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkPrismaClient() {
  console.log('🔍 Checking Prisma client...')
  
  const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client')
  
  if (fs.existsSync(clientPath)) {
    results.push({
      name: 'Prisma Client',
      status: 'pass',
      message: 'Prisma client is generated'
    })
  } else {
    results.push({
      name: 'Prisma Client',
      status: 'fail',
      message: 'Prisma client not generated. Run: npx prisma generate'
    })
  }
}

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if key tables exist
    const tables = ['User', 'Store', 'Product', 'Auction', 'Order']
    const counts: Record<string, number> = {}
    
    for (const table of tables) {
      const count = await (prisma as any)[table.toLowerCase()].count()
      counts[table] = count
    }
    
    results.push({
      name: 'Database Schema',
      status: 'pass',
      message: 'All core tables exist and are accessible',
      details: counts
    })
  } catch (error) {
    results.push({
      name: 'Database Schema',
      status: 'fail',
      message: 'Database schema issues detected',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkNodeModules() {
  console.log('🔍 Checking node_modules...')
  
  const modulesPath = path.join(process.cwd(), 'node_modules')
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(modulesPath)) {
    results.push({
      name: 'Node Modules',
      status: 'fail',
      message: 'node_modules not found. Run: npm install'
    })
    return
  }
  
  // Check critical packages
  const criticalPackages = [
    'next',
    '@prisma/client',
    'next-auth',
    'react',
    'react-dom'
  ]
  
  const missing: string[] = []
  
  for (const pkg of criticalPackages) {
    const pkgPath = path.join(modulesPath, pkg)
    if (!fs.existsSync(pkgPath)) {
      missing.push(pkg)
    }
  }
  
  if (missing.length > 0) {
    results.push({
      name: 'Node Modules',
      status: 'warn',
      message: `Some critical packages missing: ${missing.join(', ')}`,
      details: { missing }
    })
  } else {
    results.push({
      name: 'Node Modules',
      status: 'pass',
      message: 'All critical packages installed'
    })
  }
}

async function checkTypeScriptConfig() {
  console.log('🔍 Checking TypeScript configuration...')
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  
  if (fs.existsSync(tsconfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
      
      if (config.compilerOptions?.strict) {
        results.push({
          name: 'TypeScript Config',
          status: 'pass',
          message: 'TypeScript strict mode enabled'
        })
      } else {
        results.push({
          name: 'TypeScript Config',
          status: 'warn',
          message: 'TypeScript strict mode not enabled'
        })
      }
    } catch (error) {
      results.push({
        name: 'TypeScript Config',
        status: 'warn',
        message: 'Could not parse tsconfig.json'
      })
    }
  } else {
    results.push({
      name: 'TypeScript Config',
      status: 'fail',
      message: 'tsconfig.json not found'
    })
  }
}

async function checkNextConfig() {
  console.log('🔍 Checking Next.js configuration...')
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.ts')
  
  if (fs.existsSync(nextConfigPath)) {
    results.push({
      name: 'Next.js Config',
      status: 'pass',
      message: 'next.config.ts exists'
    })
  } else {
    results.push({
      name: 'Next.js Config',
      status: 'fail',
      message: 'next.config.ts not found'
    })
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80))
  console.log('🏥 HEALTH CHECK RESULTS')
  console.log('='.repeat(80) + '\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const warnings = results.filter(r => r.status === 'warn').length
  const failed = results.filter(r => r.status === 'fail').length
  
  // Print by status
  const statusEmoji = {
    pass: '✅',
    warn: '⚠️',
    fail: '❌'
  }
  
  for (const result of results) {
    console.log(`${statusEmoji[result.status]} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details:`, result.details)
    }
    console.log()
  }
  
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📋 Total Checks: ${results.length}`)
  console.log()
  
  // Overall health score
  const score = ((passed * 100) + (warnings * 50)) / results.length
  let healthStatus = '❌ Critical'
  
  if (score >= 90) healthStatus = '✅ Excellent'
  else if (score >= 75) healthStatus = '✅ Good'
  else if (score >= 60) healthStatus = '⚠️  Fair'
  else if (score >= 40) healthStatus = '⚠️  Poor'
  
  console.log(`🏥 Overall Health: ${healthStatus} (${Math.round(score)}%)`)
  console.log()
  
  // Action items
  const failures = results.filter(r => r.status === 'fail')
  if (failures.length > 0) {
    console.log('🔧 ACTION REQUIRED:')
    console.log('='.repeat(80))
    for (const failure of failures) {
      console.log(`❌ ${failure.name}: ${failure.message}`)
    }
    console.log()
  }
  
  const warns = results.filter(r => r.status === 'warn')
  if (warns.length > 0) {
    console.log('⚠️  RECOMMENDATIONS:')
    console.log('='.repeat(80))
    for (const warn of warns) {
      console.log(`⚠️  ${warn.name}: ${warn.message}`)
    }
    console.log()
  }
  
  // Exit code
  if (failed > 0) {
    console.log('❌ Health check FAILED. Please address the issues above.')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  Health check passed with warnings.')
    process.exit(0)
  } else {
    console.log('✅ All health checks PASSED!')
    process.exit(0)
  }
}

async function main() {
  console.log('🏥 Starting comprehensive health check...\n')
  
  await checkEnvironmentVariables()
  await checkNodeModules()
  await checkPrismaClient()
  await checkTypeScriptConfig()
  await checkNextConfig()
  await checkDatabaseConnection()
  await checkDatabaseSchema()
  
  await prisma.$disconnect()
  
  printResults()
}

main().catch(async (error) => {
  console.error('❌ Health check failed with error:')
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})


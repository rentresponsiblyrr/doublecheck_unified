#!/usr/bin/env node

/**
 * PERFORMANCE ANALYSIS SCRIPT - META/NETFLIX/STRIPE STANDARDS
 * 
 * Analyzes current application performance and generates optimization roadmap.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ANALYZING PERFORMANCE - META/NETFLIX/STRIPE STANDARDS');
console.log('=========================================================');

// Bundle size analysis
function analyzeBundleSize() {
  console.log('\n📦 Bundle Size Analysis');
  console.log('-'.repeat(40));
  
  try {
    // Build the application for analysis
    console.log('Building application for analysis...');
    execSync('npm run build', { stdio: 'inherit' });
    
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.log('❌ Build failed - dist directory not found');
      return;
    }

    // Analyze bundle files
    const files = fs.readdirSync(distPath, { recursive: true });
    let totalSize = 0;
    const bundleFiles = [];

    files.forEach(file => {
      const filePath = path.join(distPath, file);
      if (fs.statSync(filePath).isFile()) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        totalSize += sizeKB;
        
        if (file.endsWith('.js') || file.endsWith('.css')) {
          bundleFiles.push({ file, size: sizeKB });
        }
      }
    });

    // Sort by size
    bundleFiles.sort((a, b) => b.size - a.size);

    console.log(`📊 Total Bundle Size: ${totalSize}KB`);
    console.log('\n🎯 Performance Benchmarks:');
    console.log(`   Meta Standard: 2048KB ${totalSize <= 2048 ? '✅' : '❌'}`);
    console.log(`   Elite Standard: 1024KB ${totalSize <= 1024 ? '✅' : '❌'}`);
    
    console.log('\n📋 Largest Files:');
    bundleFiles.slice(0, 10).forEach((file, index) => {
      const status = file.size > 250 ? '⚠️' : '✅';
      console.log(`   ${index + 1}. ${file.file}: ${file.size}KB ${status}`);
    });

    // Bundle analysis report
    const analysis = {
      totalSize,
      grade: totalSize <= 1024 ? 'A+' : totalSize <= 2048 ? 'A' : totalSize <= 3072 ? 'B' : 'C',
      meetsMetaStandard: totalSize <= 2048,
      meetsEliteStandard: totalSize <= 1024,
      recommendations: []
    };

    if (totalSize > 1024) {
      analysis.recommendations.push('Implement aggressive code splitting');
      analysis.recommendations.push('Remove unused dependencies');
      analysis.recommendations.push('Enable tree shaking optimization');
    }

    if (totalSize > 2048) {
      analysis.recommendations.push('CRITICAL: Bundle size exceeds Meta standards');
      analysis.recommendations.push('Consider micro-frontend architecture');
    }

    return analysis;

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    return null;
  }
}

// Dependency analysis
function analyzeDependencies() {
  console.log('\n📚 Dependency Analysis');
  console.log('-'.repeat(40));

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const heavyDependencies = [];
    const totalDeps = Object.keys(dependencies).length;

    // Check for known heavy dependencies
    const heavyLibraries = {
      'lodash': 'Consider lodash-es or individual imports',
      'moment': 'Replace with date-fns or dayjs (90% smaller)',
      '@material-ui/core': 'Consider lighter UI library',
      'rxjs': 'Ensure tree shaking is configured',
      'antd': 'Use individual component imports',
    };

    Object.keys(dependencies).forEach(dep => {
      if (heavyLibraries[dep]) {
        heavyDependencies.push({
          name: dep,
          recommendation: heavyLibraries[dep]
        });
      }
    });

    console.log(`📊 Total Dependencies: ${totalDeps}`);
    console.log(`🎯 Recommended Max: 50 ${totalDeps <= 50 ? '✅' : '❌'}`);

    if (heavyDependencies.length > 0) {
      console.log('\n⚠️  Heavy Dependencies Found:');
      heavyDependencies.forEach(dep => {
        console.log(`   • ${dep.name}: ${dep.recommendation}`);
      });
    } else {
      console.log('\n✅ No obviously heavy dependencies detected');
    }

    return {
      totalDependencies: totalDeps,
      heavyDependencies,
      grade: totalDeps <= 30 ? 'A+' : totalDeps <= 50 ? 'A' : totalDeps <= 75 ? 'B' : 'C'
    };

  } catch (error) {
    console.error('❌ Dependency analysis failed:', error.message);
    return null;
  }
}

// Code quality analysis
function analyzeCodeQuality() {
  console.log('\n🔍 Code Quality Analysis');
  console.log('-'.repeat(40));

  try {
    // Count TypeScript files
    const srcPath = path.join(process.cwd(), 'src');
    let totalFiles = 0;
    let totalLines = 0;
    let largeFiles = [];

    function countFiles(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          countFiles(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          totalFiles++;
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;
          
          if (lines > 300) {
            largeFiles.push({
              file: path.relative(process.cwd(), filePath),
              lines
            });
          }
        }
      });
    }

    countFiles(srcPath);

    console.log(`📊 TypeScript Files: ${totalFiles}`);
    console.log(`📊 Total Lines of Code: ${totalLines}`);
    console.log(`📊 Average File Size: ${Math.round(totalLines / totalFiles)} lines`);

    const avgFileSize = totalLines / totalFiles;
    const qualityGrade = avgFileSize <= 100 ? 'A+' : avgFileSize <= 150 ? 'A' : avgFileSize <= 200 ? 'B' : 'C';

    console.log(`🎯 Quality Grade: ${qualityGrade}`);

    if (largeFiles.length > 0) {
      console.log('\n⚠️  Large Files (>300 lines):');
      largeFiles.sort((a, b) => b.lines - a.lines).slice(0, 5).forEach(file => {
        console.log(`   • ${file.file}: ${file.lines} lines`);
      });
    } else {
      console.log('\n✅ No excessively large files detected');
    }

    return {
      totalFiles,
      totalLines,
      averageFileSize: avgFileSize,
      largeFiles: largeFiles.length,
      grade: qualityGrade
    };

  } catch (error) {
    console.error('❌ Code quality analysis failed:', error.message);
    return null;
  }
}

// Main analysis function
async function runAnalysis() {
  const results = {
    timestamp: new Date().toISOString(),
    bundleAnalysis: null,
    dependencyAnalysis: null,
    codeQualityAnalysis: null,
    overallGrade: 'F',
    actionItems: []
  };

  // Run all analyses
  results.bundleAnalysis = analyzeBundleSize();
  results.dependencyAnalysis = analyzeDependencies();
  results.codeQualityAnalysis = analyzeCodeQuality();

  // Calculate overall grade
  const grades = [
    results.bundleAnalysis?.grade,
    results.dependencyAnalysis?.grade,
    results.codeQualityAnalysis?.grade
  ].filter(Boolean);

  const gradeValues = { 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0, 'F': 0 };
  const avgGrade = grades.reduce((sum, grade) => sum + gradeValues[grade], 0) / grades.length;
  
  results.overallGrade = avgGrade >= 3.5 ? 'A+' : avgGrade >= 2.5 ? 'A' : avgGrade >= 1.5 ? 'B' : avgGrade >= 0.5 ? 'C' : 'F';

  // Generate action items
  if (results.bundleAnalysis && !results.bundleAnalysis.meetsEliteStandard) {
    results.actionItems.push('PRIORITY 1: Optimize bundle size to meet elite standards');
  }

  if (results.dependencyAnalysis && results.dependencyAnalysis.heavyDependencies.length > 0) {
    results.actionItems.push('PRIORITY 2: Replace heavy dependencies with lighter alternatives');
  }

  if (results.codeQualityAnalysis && results.codeQualityAnalysis.largeFiles > 5) {
    results.actionItems.push('PRIORITY 3: Refactor large files to improve maintainability');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`🏆 Overall Grade: ${results.overallGrade}`);
  console.log(`📦 Bundle Grade: ${results.bundleAnalysis?.grade || 'N/A'}`);
  console.log(`📚 Dependencies Grade: ${results.dependencyAnalysis?.grade || 'N/A'}`);
  console.log(`🔍 Code Quality Grade: ${results.codeQualityAnalysis?.grade || 'N/A'}`);

  if (results.actionItems.length > 0) {
    console.log('\n🎯 Action Items:');
    results.actionItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
  }

  // Compare to benchmarks
  console.log('\n🏅 Benchmark Comparison:');
  console.log(`   Meta/Facebook: ${results.overallGrade >= 'A' ? '✅ MEETS' : '❌ BELOW'} Standard`);
  console.log(`   Netflix: ${results.overallGrade >= 'A' ? '✅ MEETS' : '❌ BELOW'} Standard`);
  console.log(`   Stripe: ${results.overallGrade >= 'B' ? '✅ MEETS' : '❌ BELOW'} Standard`);
  console.log(`   Elite (Top 1%): ${results.overallGrade === 'A+' ? '✅ MEETS' : '❌ BELOW'} Standard`);

  // Save results
  fs.writeFileSync('performance-analysis.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to performance-analysis.json');

  console.log('\n' + '='.repeat(60));
  
  if (results.overallGrade >= 'A') {
    console.log('🎉 EXCELLENT! Performance meets Meta/Netflix standards');
  } else if (results.overallGrade >= 'B') {
    console.log('👍 GOOD! Performance meets Stripe standards');
  } else {
    console.log('⚠️  NEEDS WORK! Performance below industry standards');
  }

  return results;
}

// Run the analysis
runAnalysis().catch(console.error);
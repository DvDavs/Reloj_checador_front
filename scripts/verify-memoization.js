#!/usr/bin/env node

/**
 * Script to verify memoization implementation in TimeClock components
 */

const fs = require('fs');
const path = require('path');

const COMPONENT_DIR = 'app/components/timeclock';

function checkMemoization() {
  console.log('🔍 Verifying Memoization Implementation...\n');

  const results = {
    totalComponents: 0,
    memoizedComponents: 0,
    useCallbackUsage: 0,
    useMemoUsage: 0,
    issues: [],
    recommendations: [],
  };

  // List of component files to check
  const componentFiles = [
    'TimeClock.tsx',
    'HeaderClock.tsx',
    'ShiftsPanel.tsx',
    'ScannerPanel.tsx',
    'HistoryPanel.tsx',
    'AttendanceDetails.tsx',
  ];

  componentFiles.forEach((filename) => {
    const filePath = path.join(COMPONENT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      results.issues.push(`❌ File not found: ${filename}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    results.totalComponents++;

    console.log(`📄 Analyzing ${filename}...`);

    // Check for React.memo usage
    const hasMemo = content.includes('React.memo') || content.includes('memo(');
    if (hasMemo) {
      results.memoizedComponents++;
      console.log('  ✅ Uses React.memo');
    } else {
      console.log('  ⚠️ Missing React.memo');
      results.issues.push(`${filename}: Missing React.memo implementation`);
    }

    // Check for useCallback usage
    const useCallbackMatches = content.match(/useCallback/g);
    if (useCallbackMatches) {
      const count = useCallbackMatches.length;
      results.useCallbackUsage += count;
      console.log(`  ✅ Uses useCallback (${count} instances)`);
    } else {
      console.log('  ⚠️ No useCallback found');
      results.recommendations.push(
        `${filename}: Consider using useCallback for event handlers`
      );
    }

    // Check for useMemo usage
    const useMemoMatches = content.match(/useMemo/g);
    if (useMemoMatches) {
      const count = useMemoMatches.length;
      results.useMemoUsage += count;
      console.log(`  ✅ Uses useMemo (${count} instances)`);
    } else {
      console.log('  ⚠️ No useMemo found');
      results.recommendations.push(
        `${filename}: Consider using useMemo for expensive calculations`
      );
    }

    // Check for memoized props objects
    const hasMemoizedProps =
      content.includes('useMemo') &&
      (content.includes('Props') || content.includes('props'));
    if (hasMemoizedProps) {
      console.log('  ✅ Has memoized props objects');
    }

    console.log('');
  });

  return results;
}

function generateReport(results) {
  console.log('📊 MEMOIZATION VERIFICATION REPORT');
  console.log('='.repeat(50));
  console.log('');

  // Summary
  console.log('📈 SUMMARY:');
  console.log(`Total Components Analyzed: ${results.totalComponents}`);
  console.log(
    `Components with React.memo: ${results.memoizedComponents}/${results.totalComponents}`
  );
  console.log(`Total useCallback instances: ${results.useCallbackUsage}`);
  console.log(`Total useMemo instances: ${results.useMemoUsage}`);

  const memoizationScore =
    (results.memoizedComponents / results.totalComponents) * 100;
  console.log(`Memoization Coverage: ${memoizationScore.toFixed(1)}%`);
  console.log('');

  // Issues
  if (results.issues.length > 0) {
    console.log('❌ ISSUES FOUND:');
    results.issues.forEach((issue) => console.log(`  ${issue}`));
    console.log('');
  }

  // Recommendations
  if (results.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    results.recommendations.forEach((rec) => console.log(`  ${rec}`));
    console.log('');
  }

  // Overall assessment
  let assessment;
  if (
    memoizationScore >= 90 &&
    results.useCallbackUsage >= 10 &&
    results.useMemoUsage >= 5
  ) {
    assessment = '🎉 EXCELLENT - Comprehensive memoization implementation!';
  } else if (memoizationScore >= 80 && results.useCallbackUsage >= 5) {
    assessment =
      '✅ GOOD - Solid memoization implementation with room for improvement.';
  } else if (memoizationScore >= 60) {
    assessment =
      '⚠️ ACCEPTABLE - Basic memoization in place, needs optimization.';
  } else {
    assessment =
      '❌ NEEDS IMPROVEMENT - Insufficient memoization implementation.';
  }

  console.log('🏆 OVERALL ASSESSMENT:');
  console.log(`${assessment}`);
  console.log('');

  // Specific findings
  console.log('🔍 DETAILED FINDINGS:');

  if (results.memoizedComponents === results.totalComponents) {
    console.log(
      '✅ All components use React.memo - excellent for preventing unnecessary re-renders'
    );
  } else {
    console.log(
      '⚠️ Some components missing React.memo - may cause performance issues'
    );
  }

  if (results.useCallbackUsage >= 10) {
    console.log(
      '✅ Good useCallback usage - event handlers are properly memoized'
    );
  } else if (results.useCallbackUsage >= 5) {
    console.log(
      '⚠️ Moderate useCallback usage - consider memoizing more event handlers'
    );
  } else {
    console.log(
      '❌ Low useCallback usage - event handlers may cause unnecessary re-renders'
    );
  }

  if (results.useMemoUsage >= 5) {
    console.log('✅ Good useMemo usage - expensive calculations are memoized');
  } else if (results.useMemoUsage >= 2) {
    console.log(
      '⚠️ Moderate useMemo usage - consider memoizing more expensive operations'
    );
  } else {
    console.log(
      '❌ Low useMemo usage - expensive calculations may impact performance'
    );
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('✨ Memoization verification completed!');
  console.log('='.repeat(50));

  return memoizationScore >= 70;
}

// Main execution
function main() {
  try {
    const results = checkMemoization();
    const passed = generateReport(results);
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during memoization verification:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkMemoization,
  generateReport,
};

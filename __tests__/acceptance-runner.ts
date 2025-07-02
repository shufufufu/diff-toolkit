#!/usr/bin/env tsx

import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type {
  AcceptanceTestResult,
  AcceptanceTestReport,
  DiffResult,
  DiffAddition
} from '../src/types.js';
import { acceptanceTestCases, removeTestCases, allTestCases } from './fixtures/acceptance-cases.js';

// 导入真实的diff函数
import { diffCode } from '../src/index.js';

/**
 * 深度比较两个对象是否相等
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * 分析差异详情
 */
function analyzeDifferences(expected: DiffResult, actual: DiffResult): string[] {
  const differences: string[] = [];
  
  if (expected.hasDifference !== actual.hasDifference) {
    differences.push(`hasDifference: expected ${expected.hasDifference}, got ${actual.hasDifference}`);
  }
  
  if (!deepEqual(expected.equal, actual.equal)) {
    differences.push(`equal: structures differ`);
    if (expected.equal.length !== actual.equal.length) {
      differences.push(`equal length: expected ${expected.equal.length}, got ${actual.equal.length}`);
    }
  }
  
  if (!deepEqual(expected.remove, actual.remove)) {
    differences.push(`remove: structures differ`);
    if (expected.remove.length !== actual.remove.length) {
      differences.push(`remove length: expected ${expected.remove.length}, got ${actual.remove.length}`);
    }
  }
  
  if (!deepEqual(expected.addition, actual.addition)) {
    differences.push(`addition: structures differ`);
    if (expected.addition.length !== actual.addition.length) {
      differences.push(`addition length: expected ${expected.addition.length}, got ${actual.addition.length}`);
    }
  }
  
  return differences;
}

/**
 * 运行单个测试用例
 */
function runSingleTest(testCase: AcceptanceTestCase): {
  passed: boolean;
  executionTime: number;
  errorMessage?: string;
  differences?: string[];
  expected?: DiffResult;
  actual?: DiffResult;
} {
  const startTime = performance.now();
  
  try {
    const result = diffCode(testCase.currentCode, testCase.suggestedCode);
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    const passed = deepEqual(result, testCase.expected);
    
    if (passed) {
      return { passed: true, executionTime };
    } else {
      const differences = analyzeDifferences(testCase.expected, result);
      return {
        passed: false,
        executionTime,
        errorMessage: '输出结果与预期不符',
        differences,
        expected: testCase.expected,
        actual: result
      };
    }
  } catch (error) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    return {
      passed: false,
      executionTime,
      errorMessage: `执行出错: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 运行所有测试
 */
function runAllTests(testCases: AcceptanceTestCase[], suiteName: string = 'Diff工具包验收测试') {
  console.log(`🚀 开始运行${suiteName}...`);
  console.log('');
  
  const results: Array<{
    testCase: AcceptanceTestCase;
    result: ReturnType<typeof runSingleTest>;
  }> = [];
  
  let passedCount = 0;
  let totalExecutionTime = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`📋 运行测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
    
    const result = runSingleTest(testCase);
    results.push({ testCase, result });
    
    totalExecutionTime += result.executionTime;
    
    if (result.passed) {
      passedCount++;
      console.log(`   ✅ 通过 (${result.executionTime.toFixed(2)}ms)`);
    } else {
      console.log(`   ❌ 失败 (${result.executionTime.toFixed(2)}ms)`);
      console.log(`   ❗ ${result.errorMessage}`);
    }
  });
  
  console.log('');
  console.log('📊 测试完成！');
  console.log(`   总计: ${testCases.length} 个测试`);
  console.log(`   通过: ${passedCount} 个`);
  console.log(`   失败: ${testCases.length - passedCount} 个`);
  console.log(`   成功率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);
  console.log(`   总执行时间: ${totalExecutionTime.toFixed(2)}ms`);
  console.log('');
  
  // 生成详细报告
  generateDetailedReport(results, suiteName, {
    total: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    successRate: (passedCount / testCases.length) * 100,
    totalTime: totalExecutionTime
  });
  
  return passedCount === testCases.length;
}

/**
 * 生成详细报告
 */
function generateDetailedReport(
  results: Array<{ testCase: AcceptanceTestCase; result: ReturnType<typeof runSingleTest> }>,
  suiteName: string,
  summary: { total: number; passed: number; failed: number; successRate: number; totalTime: number }
) {
  const reportPath = join(process.cwd(), 'acceptance-test-report.md');
  
  let report = `# ${suiteName}报告\n\n`;
  
  // 概览
  report += `## 📊 测试概览\n\n`;
  report += `- **总体状态**: ${summary.failed === 0 ? '✅ 通过' : '❌ 失败'}\n`;
  report += `- **成功率**: ${summary.successRate.toFixed(1)}%\n`;
  report += `- **总测试数**: ${summary.total}\n`;
  report += `- **通过数**: ${summary.passed}\n`;
  report += `- **失败数**: ${summary.failed}\n`;
  report += `- **总执行时间**: ${summary.totalTime.toFixed(2)}ms\n`;
  report += `- **生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  // 详细结果
  report += `## 📋 测试结果详情\n\n`;
  
  results.forEach((item, index) => {
    const { testCase, result } = item;
    const status = result.passed ? '✅' : '❌';
    
    report += `### ${index + 1}. ${testCase.name} ${status}\n\n`;
    report += `- **状态**: ${result.passed ? '通过' : '失败'}\n`;
    report += `- **执行时间**: ${result.executionTime.toFixed(2)}ms\n`;
    
    if (!result.passed) {
      report += `- **错误信息**: ${result.errorMessage}\n\n`;
      
      if (result.differences && result.differences.length > 0) {
        report += `**差异详情**:\n`;
        result.differences.forEach(diff => {
          report += `- ${diff}\n`;
        });
        report += '\n';
      }
      
      if (result.expected && result.actual) {
        report += `**预期输出**:\n`;
        report += '```json\n';
        report += JSON.stringify(result.expected, null, 2);
        report += '\n```\n\n';
        
        report += `**实际输出**:\n`;
        report += '```json\n';
        report += JSON.stringify(result.actual, null, 2);
        report += '\n```\n\n';
      }
    }
    
    report += '---\n\n';
  });
  
  // 性能分析
  const executionTimes = results.map(r => r.result.executionTime);
  const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const maxTime = Math.max(...executionTimes);
  const minTime = Math.min(...executionTimes);
  
  report += `## 📈 性能分析\n\n`;
  report += `- **平均执行时间**: ${avgTime.toFixed(2)}ms\n`;
  report += `- **最长执行时间**: ${maxTime.toFixed(2)}ms\n`;
  report += `- **最短执行时间**: ${minTime.toFixed(2)}ms\n`;
  report += `- **性能要求**: < 100ms ${maxTime < 100 ? '✅' : '❌'}\n\n`;
  
  // 总结
  report += `## ${summary.failed === 0 ? '✅' : '❌'} 总结\n\n`;
  if (summary.failed > 0) {
    const failedTests = results.filter(r => !r.result.passed);
    report += `有 ${summary.failed} 个测试用例未通过，需要修复以下问题：\n\n`;
    failedTests.forEach(item => {
      report += `- **${item.testCase.name}**: ${item.result.errorMessage}\n`;
    });
  } else {
    report += `🎉 所有测试用例均通过！工具包运行正常。\n\n`;
    report += `**关键指标**:\n`;
    report += `- ✅ 功能完整性: 100%\n`;
    report += `- ✅ 性能表现: ${maxTime < 100 ? '优秀' : '需要优化'}\n`;
    report += `- ✅ 稳定性: 高\n`;
  }
  
  report += '\n\n';
  
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`📄 详细报告已保存到: ${reportPath}`);
  console.log('');
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 运行所有测试
    console.log('🔍 运行完整测试套件 (基础 + 删除测试)\n');
    const allPassed = runAllTests(allTestCases, 'Diff工具包完整测试套件');
    process.exit(allPassed ? 0 : 1);
  } else if (args[0] === 'basic') {
    // 只运行基础测试
    console.log('🔍 运行基础测试套件\n');
    const basicPassed = runAllTests(acceptanceTestCases, 'Diff工具包基础测试');
    process.exit(basicPassed ? 0 : 1);
  } else if (args[0] === 'remove') {
    // 只运行删除测试
    console.log('🔍 运行删除功能测试套件\n');
    const removePassed = runAllTests(removeTestCases, 'Diff工具包删除功能测试');
    process.exit(removePassed ? 0 : 1);
  } else {
    console.log('❌ 未知参数');
    console.log('使用方法:');
    console.log('  npx tsx __tests__/acceptance-runner.ts          # 运行所有测试');
    console.log('  npx tsx __tests__/acceptance-runner.ts basic    # 只运行基础测试');
    console.log('  npx tsx __tests__/acceptance-runner.ts remove   # 只运行删除测试');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 测试运行出错:', error);
  process.exit(1);
}); 
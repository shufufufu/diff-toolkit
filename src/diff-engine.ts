import { diffLines } from 'diff';
import type { DiffResult, DiffOptions } from './types.js';

/**
 * 使用 jsdiff 库进行代码差异比较
 * 
 * @param currentCode 当前代码
 * @param suggestedCode 建议代码
 * @param options 选项
 * @returns 差异结果
 */
export function diffCode(
  currentCode: string,
  suggestedCode: string,
  options: DiffOptions = {}
): DiffResult {
  // 如果两个代码相同，直接返回无差异结果
  if (currentCode === suggestedCode) {
    const currentLines = currentCode.split('\n');
    return {
      hasDifference: false,
      equal: currentLines.length > 0 ? [{
        startLine: 1,
        endLine: currentLines.length,
        content: currentCode
      }] : [],
      remove: [],
      addition: []
    };
  }

  // 检查是否为纯追加场景
  if (isPureAppendScenario(currentCode, suggestedCode)) {
    return handlePureAppendScenario(currentCode, suggestedCode);
  }

  // 使用 jsdiff 处理所有其他场景
  return handleWithJsDiff(currentCode, suggestedCode, options);
}

/**
 * 检查是否为纯追加场景
 */
function isPureAppendScenario(currentCode: string, suggestedCode: string): boolean {
  return suggestedCode.startsWith(currentCode);
}

/**
 * 处理纯追加场景
 */
function handlePureAppendScenario(currentCode: string, suggestedCode: string): DiffResult {
  const currentLines = currentCode.split('\n');
  const appendedContent = suggestedCode.slice(currentCode.length);
  
  const cleanAppendedContent = appendedContent.startsWith('\n') 
    ? appendedContent.slice(1) 
    : appendedContent;

  return {
    hasDifference: true,
    equal: [{
      startLine: 1,
      endLine: currentLines.length,
      content: currentCode
    }],
    remove: [],
    addition: cleanAppendedContent ? [{
      insertAfterLine: currentLines.length,
      content: cleanAppendedContent
    }] : []
  };
}

/**
 * 使用 jsdiff 处理复杂场景
 */
function handleWithJsDiff(
  currentCode: string, 
  suggestedCode: string, 
  options: DiffOptions
): DiffResult {
  const changes = diffLines(currentCode, suggestedCode, {
    ignoreWhitespace: options.ignoreWhitespace || false,
    newlineIsToken: false
  });

  const result: DiffResult = {
    hasDifference: true,
    equal: [],
    remove: [],
    addition: []
  };

  let originalLineNumber = 1;

  for (const change of changes) {
    const lines = change.value.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (!change.added && !change.removed) {
      // 相同的内容
      if (lines.length > 0) {
        result.equal.push({
          startLine: originalLineNumber,
          endLine: originalLineNumber + lines.length - 1,
          content: lines.join('\n')
        });
        originalLineNumber += lines.length;
      }
    } else if (change.removed) {
      // 被删除的内容
      if (lines.length > 0) {
        result.remove.push({
          startLine: originalLineNumber,
          endLine: originalLineNumber + lines.length - 1,
          content: lines.join('\n')
        });
        originalLineNumber += lines.length;
      }
    } else if (change.added) {
      // 新增的内容
      if (lines.length > 0) {
        result.addition.push({
          insertAfterLine: originalLineNumber - 1,
          content: lines.join('\n')
        });
      }
    }
  }

  // 只应用安全的优化
  return applySafeOptimizations(result);
}

/**
 * 应用安全的优化（不会破坏 insertAfterLine 语义）
 */
function applySafeOptimizations(result: DiffResult): DiffResult {
  // 1. 合并连续的相同块（这是安全的）
  result.equal = mergeConsecutiveEqualBlocks(result.equal);
  
  // 2. 修复完全替换场景的插入位置（这是必要的）
  if (result.equal.length === 0 && result.remove.length > 0 && result.addition.length > 0) {
    result.addition = result.addition.map(add => ({
      ...add,
      insertAfterLine: 0  // 完全替换后插入到开头
    }));
  }
  
  return result;
}

/**
 * 合并连续的相同块
 */
function mergeConsecutiveEqualBlocks(equalBlocks: DiffResult['equal']): DiffResult['equal'] {
  if (equalBlocks.length <= 1) {
    return equalBlocks;
  }

  const merged: DiffResult['equal'] = [];
  let current = equalBlocks[0];

  for (let i = 1; i < equalBlocks.length; i++) {
    const next = equalBlocks[i];
    
    if (current.endLine + 1 === next.startLine) {
      current = {
        startLine: current.startLine,
        endLine: next.endLine,
        content: current.content + '\n' + next.content
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  
  merged.push(current);
  return merged;
} 
/**
 * 相同内容项
 */
export interface DiffEqual {
  /** 原始文件起始行号（从1开始） */
  startLine: number;
  /** 原始文件结束行号（从1开始） */
  endLine: number;
  /** 完整内容（保留所有格式：空格、tab、换行） */
  content: string;
}

/**
 * 删除内容项
 */
export interface DiffRemove {
  /** 原始文件起始行号（从1开始） */
  startLine: number;
  /** 原始文件结束行号（从1开始） */
  endLine: number;
  /** 被删除的完整内容（保留所有格式） */
  content: string;
}

/**
 * 新增内容项
 */
export interface DiffAddition {
  /** 在原始文件哪一行之后插入（0表示文件开头） */
  insertAfterLine: number;
  /** 新增的完整内容（保留所有格式：空格、tab、换行） */
  content: string;
}

/**
 * 代码差异比较结果
 */
export interface DiffResult {
  /** 是否存在差异 */
  hasDifference: boolean;
  /** 相同的内容 */
  equal: DiffEqual[];
  /** 被删除的内容 */
  remove: DiffRemove[];
  /** 新增的内容 */
  addition: DiffAddition[];
}

/**
 * 差异比较选项
 */
export interface DiffOptions {
  /** 是否忽略空白字符 */
  ignoreWhitespace?: boolean;
  /** 是否提供调试信息 */
  debug?: boolean;
}

/**
 * 验收测试用例
 */
export interface AcceptanceTestCase {
  /** 测试用例名称 */
  name: string;
  /** 当前代码 */
  currentCode: string;
  /** AI建议代码 */
  suggestedCode: string;
  /** 预期输出结果 */
  expected: DiffResult;
  /** 测试选项 */
  options?: DiffOptions;
}

/**
 * 验收测试结果
 */
export interface AcceptanceTestResult {
  /** 测试用例名称 */
  name: string;
  /** 是否通过 */
  passed: boolean;
  /** 实际输出结果 */
  actual: DiffResult;
  /** 预期输出结果 */
  expected: DiffResult;
  /** 错误信息（如果有） */
  error?: string;
  /** 差异详情 */
  differences?: string[];
  /** 执行时间（毫秒） */
  executionTime: number;
}

/**
 * 验收测试报告
 */
export interface AcceptanceTestReport {
  /** 测试开始时间 */
  startTime: string;
  /** 测试结束时间 */
  endTime: string;
  /** 总执行时间（毫秒） */
  totalTime: number;
  /** 总测试用例数 */
  totalTests: number;
  /** 通过的测试数 */
  passedTests: number;
  /** 失败的测试数 */
  failedTests: number;
  /** 成功率 */
  successRate: number;
  /** 各个测试用例的结果 */
  testResults: AcceptanceTestResult[];
  /** 总体状态 */
  status: 'PASSED' | 'FAILED';
} 
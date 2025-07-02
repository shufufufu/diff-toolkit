import type { DiffResult, DiffOptions } from './types.js';
/**
 * 使用 jsdiff 库进行代码差异比较
 *
 * @param currentCode 当前代码
 * @param suggestedCode 建议代码
 * @param options 选项
 * @returns 差异结果
 */
export declare function diffCode(currentCode: string, suggestedCode: string, options?: DiffOptions): DiffResult;
//# sourceMappingURL=diff-engine.d.ts.map
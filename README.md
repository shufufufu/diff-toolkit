# XML Diff Toolkit

一个用于比较代码差异的工具包，专门为少儿编程 AI 场景设计。

## 🚀 功能特性

- 🔍 **精确差异检测**: 基于 jsdiff 库，支持行级文本比较
- 📍 **智能定位**: 提供精确的行号和上下文信息
- 🎯 **类型区分**: 区分插入(insert)和追加(append)类型
- ⚡ **高性能**: 执行时间 < 100ms
- 🧪 **完整测试**: 基于真实 AI 场景的验收测试

## 📦 安装

```bash
pnpm install @crc/xml-diff-toolkit
```

## 🎯 核心 API

```typescript
import { diffCode } from '@crc/xml-diff-toolkit';

const result = diffCode(currentCode, suggestedCode);

console.log(result);
// {
//   hasDifferences: true,
//   additions: [
//     {
//       lineNumber: 4,
//       content: '    改变y坐标("减少", 3);',
//       type: 'insert',
//       context: {
//         beforeLine: '  永远循环(() => {',
//         afterLine: '    如果(角色坐标("自己", "y坐标") < -450, () => {'
//       }
//     }
//   ],
//   stats: {
//     totalAdditions: 1,
//     addedLines: 1
//   }
// }
```

## 🧪 验收测试

本项目包含完整的验收测试系统，基于真实的 AI 输出场景：

### 运行验收测试

```bash
# 运行验收测试
pnpm test:acceptance

# 或者直接运行
npx tsx __tests__/acceptance-runner.ts
```

### 测试用例

验收测试包含 5 个基于真实 AI 场景的测试用例：

1. **飞机大战游戏 - 敌机代码补全**: 中间插入代码行
2. **子弹碰撞检测补全**: 末尾追加代码块
3. **键盘事件补全**: 末尾追加多行代码
4. **广播消息处理补全**: 末尾追加事件监听
5. **无差异场景**: 验证相同代码的处理

### 测试报告

每次运行测试后会生成详细的 Markdown 报告：

- 📊 测试概览（成功率、执行时间等）
- 📋 详细的测试结果
- 📈 性能分析
- ✅/❌ 总结和问题分析

## 🔧 开发流程

### 1. 实现 diff 功能

```bash
# 编辑核心实现
vim src/diff-engine.ts
vim src/index.ts
```

### 2. 运行验收测试

```bash
pnpm test:acceptance
```

### 3. 查看测试报告

```bash
cat acceptance-test-report.md
```

### 4. 修复问题并重复

直到所有测试通过为止。

## 📁 项目结构

```
packages/xml-diff-toolkit/
├── src/
│   ├── index.ts           # 主入口
│   ├── diff-engine.ts     # 核心diff逻辑 (待实现)
│   ├── types.ts           # 类型定义
│   └── utils.ts           # 工具函数 (待实现)
├── __tests__/
│   ├── acceptance-runner.ts        # 验收测试运行器
│   └── fixtures/
│       └── acceptance-cases.ts     # 测试用例数据
├── examples/                       # 使用示例 (待创建)
├── acceptance-test-report.md       # 测试报告 (自动生成)
└── README.md
```

## 🎖️ 验收标准

- ✅ 所有 5 个测试用例通过
- ✅ 执行时间 < 100ms
- ✅ 精确的行号定位
- ✅ 完整的上下文信息
- ✅ 正确的类型区分 (insert/append)

## 🚀 下一步

1. 实现 `src/diff-engine.ts` 核心逻辑
2. 实现 `src/index.ts` 主入口
3. 运行验收测试验证功能
4. 创建使用示例和文档

---

**当前状态**: 🔧 开发中 - 验收测试框架已完成，等待核心功能实现 
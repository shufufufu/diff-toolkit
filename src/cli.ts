#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { diffCode } from './index.js';
import chalk from 'chalk';

// 版本信息
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

program
  .name('xml-diff')
  .description('A CLI tool for comparing code differences')
  .version(packageJson.version);

// 文件比较命令
program
  .command('file')
  .description('Compare two files')
  .argument('<current-file>', 'Current code file')
  .argument('<suggested-file>', 'Suggested code file')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .option('-o, --output <file>', 'Output file path')
  .action((currentFile, suggestedFile, options) => {
    try {
      const currentCode = readFileSync(currentFile, 'utf-8');
      const suggestedCode = readFileSync(suggestedFile, 'utf-8');
      
      const result = diffCode(currentCode, suggestedCode);
      
      if (options.format === 'json') {
        const output = JSON.stringify(result, null, 2);
        if (options.output) {
          import('fs').then(fs => fs.writeFileSync(options.output, output));
          console.log(chalk.green(`✓ Results saved to ${options.output}`));
        } else {
          console.log(output);
        }
      } else {
        printTextDiff(result);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// 文本比较命令
program
  .command('text')
  .description('Compare two text inputs')
  .option('-c, --current <text>', 'Current code text')
  .option('-s, --suggested <text>', 'Suggested code text')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .action((options) => {
    if (!options.current || !options.suggested) {
      console.error(chalk.red('Error: Both --current and --suggested options are required'));
      process.exit(1);
    }
    
    const result = diffCode(options.current, options.suggested);
    
    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTextDiff(result);
    }
  });

// 打印文本格式的差异
function printTextDiff(result: ReturnType<typeof diffCode>) {
  console.log(chalk.blue('📊 Diff Results:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  if (!result.hasDifference) {
    console.log(chalk.green('✓ No differences found'));
    return;
  }
  
  // 显示相同的部分
  if (result.equal.length > 0) {
    console.log(chalk.green('\n📋 Equal blocks:'));
    result.equal.forEach((block, index) => {
      console.log(chalk.gray(`  Block ${index + 1}: Lines ${block.startLine}-${block.endLine}`));
      console.log(chalk.gray(`    ${block.content.split('\n').length} lines`));
    });
  }
  
  // 显示删除的部分
  if (result.remove.length > 0) {
    console.log(chalk.red('\n❌ Removed blocks:'));
    result.remove.forEach((block, index) => {
      console.log(chalk.red(`  Block ${index + 1}: Lines ${block.startLine}-${block.endLine}`));
      const lines = block.content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(chalk.red(`    - ${line}`));
      });
    });
  }
  
  // 显示添加的部分
  if (result.addition.length > 0) {
    console.log(chalk.green('\n✅ Added blocks:'));
    result.addition.forEach((block, index) => {
      console.log(chalk.green(`  Block ${index + 1}: Insert after line ${block.insertAfterLine}`));
      const lines = block.content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(chalk.green(`    + ${line}`));
      });
    });
  }
  
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.blue(`�� Summary: ${result.equal.length} equal, ${result.remove.length} removed, ${result.addition.length} added`));
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

program.parse();

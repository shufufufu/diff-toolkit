import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// 测试数据
const testData = {
  current: `function greet(name) {
  console.log("Hello, " + name);
}

greet("World");`,
  
  suggested: `function greet(name) {
  console.log("Hello, " + name);
}

function farewell(name) {
  console.log("Goodbye, " + name);
}

greet("World");
farewell("World");`,
};

// 创建临时测试目录
const tempDir = join(process.cwd(), 'temp-cli-test');
const currentFile = join(tempDir, 'current.js');
const suggestedFile = join(tempDir, 'suggested.js');

console.log('🧪 CLI Testing Suite');
console.log('='.repeat(50));

// 清理并创建测试目录
try {
  rmSync(tempDir, { recursive: true, force: true });
} catch {}
mkdirSync(tempDir, { recursive: true });

// 创建测试文件
writeFileSync(currentFile, testData.current);
writeFileSync(suggestedFile, testData.suggested);

// 测试用例
const tests = [
  {
    name: 'File comparison (text format)',
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/cli.ts', 'file', currentFile, suggestedFile],
    expectedOutput: ['Added blocks', 'farewell', 'Summary'],
  },
  {
    name: 'File comparison (JSON format)',
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/cli.ts', 'file', currentFile, suggestedFile, '-f', 'json'],
    expectedOutput: ['"hasDifference": true', '"addition"', '"insertAfterLine"'],
  },
  {
    name: 'Simple text comparison',
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/cli.ts', 'text', '-c', 'hello', '-s', 'hello world'],
    expectedOutput: ['Added blocks'],
  },
  {
    name: 'Help command',
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/cli.ts', '--help'],
    expectedOutput: ['Usage:', 'Commands:', 'file', 'text'],
  },
  {
    name: 'Version command',
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/cli.ts', '--version'],
    expectedOutput: ['0.0.1'],
  },
];

// 运行测试
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 Testing: ${test.name}`);
    
    try {
      const result = await runCommand(test.command, test.args);
      
      // 检查预期输出
      const allExpectedFound = test.expectedOutput.every(expected => 
        result.stdout.includes(expected) || result.stderr.includes(expected)
      );
      
      if (allExpectedFound && result.exitCode === 0) {
        console.log(`   ✅ PASSED`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`   Expected: ${test.expectedOutput.join(', ')}`);
        console.log(`   Exit code: ${result.exitCode}`);
        console.log(`   Stdout: ${result.stdout.slice(0, 300)}...`);
        if (result.stderr) {
          console.log(`   Stderr: ${result.stderr.slice(0, 300)}...`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

// 运行命令的工具函数
function runCommand(command: string, args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      stdio: 'pipe',
      shell: false,
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
    
    // 超时处理
    setTimeout(() => {
      child.kill();
      resolve({
        stdout,
        stderr: stderr + '\nTimeout',
        exitCode: -1,
      });
    }, 30000);
  });
}

// 清理函数
function cleanup() {
  try {
    rmSync(tempDir, { recursive: true, force: true });
    console.log('\n🧹 Cleanup completed');
  } catch (error) {
    console.log(`\n⚠️  Cleanup error: ${error}`);
  }
}

// 主程序
async function main() {
  try {
    await runTests();
  } finally {
    cleanup();
  }
}

main().catch(console.error);

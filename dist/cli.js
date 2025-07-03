#!/usr/bin/env node
import * as __WEBPACK_EXTERNAL_MODULE_commander__ from "commander";
import * as __WEBPACK_EXTERNAL_MODULE_fs__ from "fs";
import * as __WEBPACK_EXTERNAL_MODULE_diff__ from "diff";
import * as __WEBPACK_EXTERNAL_MODULE_chalk__ from "chalk";
function diffCode(currentCode, suggestedCode, options = {}) {
    if (currentCode === suggestedCode) {
        const currentLines = currentCode.split('\n');
        return {
            hasDifference: false,
            equal: currentLines.length > 0 ? [
                {
                    startLine: 1,
                    endLine: currentLines.length,
                    content: currentCode
                }
            ] : [],
            remove: [],
            addition: []
        };
    }
    if (isPureAppendScenario(currentCode, suggestedCode)) return handlePureAppendScenario(currentCode, suggestedCode);
    return handleWithJsDiff(currentCode, suggestedCode, options);
}
function isPureAppendScenario(currentCode, suggestedCode) {
    return suggestedCode.startsWith(currentCode);
}
function handlePureAppendScenario(currentCode, suggestedCode) {
    const currentLines = currentCode.split('\n');
    const appendedContent = suggestedCode.slice(currentCode.length);
    const cleanAppendedContent = appendedContent.startsWith('\n') ? appendedContent.slice(1) : appendedContent;
    return {
        hasDifference: true,
        equal: [
            {
                startLine: 1,
                endLine: currentLines.length,
                content: currentCode
            }
        ],
        remove: [],
        addition: cleanAppendedContent ? [
            {
                insertAfterLine: currentLines.length,
                content: cleanAppendedContent
            }
        ] : []
    };
}
function handleWithJsDiff(currentCode, suggestedCode, options) {
    const changes = (0, __WEBPACK_EXTERNAL_MODULE_diff__.diffLines)(currentCode, suggestedCode, {
        ignoreWhitespace: options.ignoreWhitespace || false,
        newlineIsToken: false
    });
    const result = {
        hasDifference: true,
        equal: [],
        remove: [],
        addition: []
    };
    let originalLineNumber = 1;
    for (const change of changes){
        const lines = change.value.split('\n');
        if ('' === lines[lines.length - 1]) lines.pop();
        if (change.added || change.removed) {
            if (change.removed) {
                if (lines.length > 0) {
                    result.remove.push({
                        startLine: originalLineNumber,
                        endLine: originalLineNumber + lines.length - 1,
                        content: lines.join('\n')
                    });
                    originalLineNumber += lines.length;
                }
            } else if (change.added) {
                if (lines.length > 0) result.addition.push({
                    insertAfterLine: originalLineNumber - 1,
                    content: lines.join('\n')
                });
            }
        } else if (lines.length > 0) {
            result.equal.push({
                startLine: originalLineNumber,
                endLine: originalLineNumber + lines.length - 1,
                content: lines.join('\n')
            });
            originalLineNumber += lines.length;
        }
    }
    return applySafeOptimizations(result);
}
function applySafeOptimizations(result) {
    result.equal = mergeConsecutiveEqualBlocks(result.equal);
    if (0 === result.equal.length && result.remove.length > 0 && result.addition.length > 0) result.addition = result.addition.map((add)=>({
            ...add,
            insertAfterLine: 0
        }));
    return result;
}
function mergeConsecutiveEqualBlocks(equalBlocks) {
    if (equalBlocks.length <= 1) return equalBlocks;
    const merged = [];
    let current = equalBlocks[0];
    for(let i = 1; i < equalBlocks.length; i++){
        const next = equalBlocks[i];
        if (current.endLine + 1 === next.startLine) current = {
            startLine: current.startLine,
            endLine: next.endLine,
            content: current.content + '\n' + next.content
        };
        else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    return merged;
}
const packageJson = JSON.parse((0, __WEBPACK_EXTERNAL_MODULE_fs__.readFileSync)(new URL('../package.json', import.meta.url), 'utf-8'));
__WEBPACK_EXTERNAL_MODULE_commander__.program.name('xml-diff').description('A CLI tool for comparing code differences').version(packageJson.version);
__WEBPACK_EXTERNAL_MODULE_commander__.program.command('file').description('Compare two files').argument('<current-file>', 'Current code file').argument('<suggested-file>', 'Suggested code file').option('-f, --format <format>', 'Output format (json|text)', 'text').option('-o, --output <file>', 'Output file path').action((currentFile, suggestedFile, options)=>{
    try {
        const currentCode = (0, __WEBPACK_EXTERNAL_MODULE_fs__.readFileSync)(currentFile, 'utf-8');
        const suggestedCode = (0, __WEBPACK_EXTERNAL_MODULE_fs__.readFileSync)(suggestedFile, 'utf-8');
        const result = diffCode(currentCode, suggestedCode);
        if ('json' === options.format) {
            const output = JSON.stringify(result, null, 2);
            if (options.output) {
                import("fs").then((fs)=>fs.writeFileSync(options.output, output));
                console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green(`✓ Results saved to ${options.output}`));
            } else console.log(output);
        } else printTextDiff(result);
    } catch (error) {
        console.error(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
__WEBPACK_EXTERNAL_MODULE_commander__.program.command('text').description('Compare two text inputs').option('-c, --current <text>', 'Current code text').option('-s, --suggested <text>', 'Suggested code text').option('-f, --format <format>', 'Output format (json|text)', 'text').action((options)=>{
    if (!options.current || !options.suggested) {
        console.error(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red('Error: Both --current and --suggested options are required'));
        process.exit(1);
    }
    const result = diffCode(options.current, options.suggested);
    if ('json' === options.format) console.log(JSON.stringify(result, null, 2));
    else printTextDiff(result);
});
function printTextDiff(result) {
    console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].blue('📊 Diff Results:'));
    console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].gray('─'.repeat(50)));
    if (!result.hasDifference) {
        console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green('✓ No differences found'));
        return;
    }
    if (result.equal.length > 0) {
        console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green('\n📋 Equal blocks:'));
        result.equal.forEach((block, index)=>{
            console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].gray(`  Block ${index + 1}: Lines ${block.startLine}-${block.endLine}`));
            console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].gray(`    ${block.content.split('\n').length} lines`));
        });
    }
    if (result.remove.length > 0) {
        console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red('\n❌ Removed blocks:'));
        result.remove.forEach((block, index)=>{
            console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red(`  Block ${index + 1}: Lines ${block.startLine}-${block.endLine}`));
            const lines = block.content.split('\n').filter((line)=>line.trim());
            lines.forEach((line)=>{
                console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red(`    - ${line}`));
            });
        });
    }
    if (result.addition.length > 0) {
        console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green('\n✅ Added blocks:'));
        result.addition.forEach((block, index)=>{
            console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green(`  Block ${index + 1}: Insert after line ${block.insertAfterLine}`));
            const lines = block.content.split('\n').filter((line)=>line.trim());
            lines.forEach((line)=>{
                console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].green(`    + ${line}`));
            });
        });
    }
    console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].gray('\n─'.repeat(50)));
    console.log(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].blue(`�� Summary: ${result.equal.length} equal, ${result.remove.length} removed, ${result.addition.length} added`));
}
process.on('uncaughtException', (error)=>{
    console.error(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red('Uncaught Exception:'), error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason)=>{
    console.error(__WEBPACK_EXTERNAL_MODULE_chalk__["default"].red('Unhandled Rejection:'), reason);
    process.exit(1);
});
__WEBPACK_EXTERNAL_MODULE_commander__.program.parse();

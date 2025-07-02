import * as __WEBPACK_EXTERNAL_MODULE_diff__ from "diff";
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
    return applyUniversalOptimizations(result, currentCode, suggestedCode);
}
function applyUniversalOptimizations(result, currentCode, suggestedCode) {
    result.equal = mergeConsecutiveEqualBlocks(result.equal);
    result.addition = mergeAdjacentAdditions(result.addition);
    result = fixCompleteReplacementInsertPosition(result);
    result = convertRemoveAddToPureInsert(result, currentCode, suggestedCode);
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
function mergeAdjacentAdditions(additions) {
    if (additions.length <= 1) return additions;
    const merged = [];
    let i = 0;
    while(i < additions.length){
        let current = additions[i];
        let j = i + 1;
        while(j < additions.length && additions[j].insertAfterLine === current.insertAfterLine + 1){
            current = {
                insertAfterLine: current.insertAfterLine,
                content: current.content + '\n' + additions[j].content
            };
            j++;
        }
        merged.push(current);
        i = j;
    }
    return merged;
}
function fixCompleteReplacementInsertPosition(result) {
    if (0 === result.equal.length && result.remove.length > 0 && result.addition.length > 0) return {
        ...result,
        addition: result.addition.map((add)=>({
                ...add,
                insertAfterLine: 0
            }))
    };
    return result;
}
function convertRemoveAddToPureInsert(result, currentCode, suggestedCode) {
    if (result.remove.length > 0 && result.addition.length > 0) {
        const removedContent = result.remove.map((r)=>r.content).join('\n');
        if (suggestedCode.includes(removedContent)) return {
            hasDifference: true,
            equal: [
                {
                    startLine: 1,
                    endLine: currentCode.split('\n').length,
                    content: currentCode
                }
            ],
            remove: [],
            addition: result.addition.map((add)=>({
                    ...add,
                    insertAfterLine: add.insertAfterLine
                }))
        };
    }
    return result;
}
export { diffCode };

#!/usr/bin/env node
/**
 * Script to find JavaScript hoisting and initialization issues
 * Specifically looking for function calls before function declarations
 * and useCallback dependency issues
 */

const fs = require('fs');
const path = require('path');

function findHoistingIssues() {
    const issues = [];
    const srcPath = path.join(__dirname, 'src');
    
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const fileIssues = analyzeFile(filePath, content);
                    issues.push(...fileIssues);
                } catch (error) {
                    console.warn(`Error reading ${filePath}: ${error.message}`);
                }
            }
        }
    }
    
    function analyzeFile(filePath, content) {
        const fileIssues = [];
        const lines = content.split('\n');
        
        // Find all function declarations and useCallback definitions
        const functionDefs = [];
        const functionCalls = [];
        const useCallbackDeps = [];
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Find function declarations
            const funcDecMatch = line.match(/^\s*(const|let|var)\s+(\w+)\s*=\s*(?:useCallback\()?(?:async\s+)?\(?/);
            if (funcDecMatch) {
                functionDefs.push({
                    name: funcDecMatch[2],
                    line: lineNum,
                    type: 'declaration'
                });
            }
            
            // Find useCallback dependencies
            const useCallbackMatch = line.match(/useCallback\([^,]+,\s*\[(.*?)\]/);
            if (useCallbackMatch) {
                const deps = useCallbackMatch[1].split(',').map(dep => dep.trim().replace(/['"]/g, ''));
                useCallbackDeps.push({
                    line: lineNum,
                    dependencies: deps.filter(dep => dep && dep !== '')
                });
            }
            
            // Find function calls within the file
            functionDefs.forEach(func => {
                if (line.includes(func.name + '(') && lineNum !== func.line) {
                    functionCalls.push({
                        name: func.name,
                        calledAt: lineNum,
                        definedAt: func.line
                    });
                }
            });
        });
        
        // Check for hoisting issues
        functionCalls.forEach(call => {
            if (call.calledAt < call.definedAt) {
                fileIssues.push({
                    file: filePath,
                    type: 'hoisting_issue',
                    function: call.name,
                    calledAt: call.calledAt,
                    definedAt: call.definedAt,
                    description: `Function '${call.name}' called at line ${call.calledAt} before being defined at line ${call.definedAt}`
                });
            }
        });
        
        // Check for useCallback dependency issues
        useCallbackDeps.forEach(callback => {
            callback.dependencies.forEach(dep => {
                const funcDef = functionDefs.find(f => f.name === dep);
                if (funcDef && callback.line < funcDef.line) {
                    fileIssues.push({
                        file: filePath,
                        type: 'callback_dependency_issue',
                        function: dep,
                        callbackLine: callback.line,
                        definedAt: funcDef.line,
                        description: `useCallback at line ${callback.line} depends on '${dep}' which is defined later at line ${funcDef.line}`
                    });
                }
            });
        });
        
        return fileIssues;
    }
    
    scanDirectory(srcPath);
    return issues;
}

// Run the analysis
const issues = findHoistingIssues();

if (issues.length === 0) {
    console.log('✅ No hoisting issues found!');
} else {
    console.log(`❌ Found ${issues.length} potential hoisting issues:\n`);
    
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type.toUpperCase()}`);
        console.log(`   File: ${issue.file}`);
        console.log(`   ${issue.description}`);
        console.log('');
    });
}
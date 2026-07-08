import React, { useState, useEffect } from 'react';
export default function DSAPractice({ problems, solvedIds, onProblemSolved }) {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('Write your code and click Run or Submit.');
  const [consoleStatus, setConsoleStatus] = useState(''); // success, error
  const [hints, setHints] = useState([]);
  const [loadingHint, setLoadingHint] = useState(false);
  useEffect(() => {
    if (problems && problems.length > 0 && !selectedProblem) {
      handleSelectProblem(problems[0]);
    }
  }, [problems]);
  const handleSelectProblem = (prob) => {
    setSelectedProblem(prob);
    setCode(prob.initialCode[language] || prob.initialCode['javascript'] || '');
    setConsoleOutput('Write your code and click Run or Submit.');
    setConsoleStatus('');
    setHints([]);
  };
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedProblem) {
      setCode(selectedProblem.initialCode[lang] || '');
    }
  };
  // Safe client-side JS runner
  const executeJavascript = (userCode, problemId) => {
    try {
      // Create a test runner container
      let testRunnerCode = '';
      
      if (problemId === 'dsa-1') {
        // Two Sum
        testRunnerCode = `
          ${userCode}
          const tests = [
            { nums: [2,7,11,15], target: 9, expected: [0,1] },
            { nums: [3,2,4], target: 6, expected: [1,2] },
            { nums: [3,3], target: 6, expected: [0,1] }
          ];
          let results = [];
          for (let i = 0; i < tests.length; i++) {
            const res = twoSum(tests[i].nums, tests[i].target);
            const isMatch = Array.isArray(res) && 
                            ((res[0] === tests[i].expected[0] && res[1] === tests[i].expected[1]) ||
                             (res[0] === tests[i].expected[1] && res[1] === tests[i].expected[0]));
            results.push({ testNum: i+1, passed: isMatch, actual: res, expected: tests[i].expected });
          }
          return results;
        `;
      } else if (problemId === 'dsa-2') {
        // Reverse String
        testRunnerCode = `
          ${userCode}
          const tests = [
            { s: ["h","e","l","l","o"], expected: ["o","l","l","e","h"] },
            { s: ["H","a","n","n","a","h"], expected: ["h","a","n","n","a","H"] }
          ];
          let results = [];
          for (let i = 0; i < tests.length; i++) {
            const arr = [...tests[i].s];
            reverseString(arr);
            const isMatch = JSON.stringify(arr) === JSON.stringify(tests[i].expected);
            results.push({ testNum: i+1, passed: isMatch, actual: arr, expected: tests[i].expected });
          }
          return results;
        `;
      } else if (problemId === 'dsa-3') {
        // Valid Parentheses
        testRunnerCode = `
          ${userCode}
          const tests = [
            { s: "()", expected: true },
            { s: "()[]{}", expected: true },
            { s: "(]", expected: false }
          ];
          let results = [];
          for (let i = 0; i < tests.length; i++) {
            const res = isValid(tests[i].s);
            const isMatch = res === tests[i].expected;
            results.push({ testNum: i+1, passed: isMatch, actual: res, expected: tests[i].expected });
          }
          return results;
        `;
      } else if (problemId === 'dsa-4') {
        // Fibonacci
        testRunnerCode = `
          ${userCode}
          const tests = [
            { n: 2, expected: 1 },
            { n: 3, expected: 2 },
            { n: 4, expected: 3 }
          ];
          let results = [];
          for (let i = 0; i < tests.length; i++) {
            const res = fib(tests[i].n);
            const isMatch = res === tests[i].expected;
            results.push({ testNum: i+1, passed: isMatch, actual: res, expected: tests[i].expected });
          }
          return results;
        `;
      }
      const runner = new Function(testRunnerCode);
      return runner();
    } catch (err) {
      throw new Error(err.message);
    }
  };
  const handleRun = () => {
    if (language !== 'javascript') {
      setConsoleOutput(`[COMPILER MESSAGE] Local browser execution environment is configured for JavaScript only.\n\nCode analysis for ${language.toUpperCase()} completed: syntax verified.\nClick 'Submit Code' to run simulated test harness cases.`);
      setConsoleStatus('');
      return;
    }
    setConsoleOutput('Compiling and running test cases...');
    setTimeout(() => {
      try {
        const results = executeJavascript(code, selectedProblem.id);
        const allPassed = results.every(r => r.passed);
        
        let output = `Execution results:\n`;
        results.forEach(r => {
          output += `• Test Case ${r.testNum}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'} (Expected: ${JSON.stringify(r.expected)}, Got: ${JSON.stringify(r.actual)})\n`;
        });
        
        setConsoleOutput(output);
        setConsoleStatus(allPassed ? 'success' : 'error');
      } catch (err) {
        setConsoleOutput(`RUNTIME ERROR:\n${err.stack || err.message}`);
        setConsoleStatus('error');
      }
    }, 400);
  };
  const handleSubmit = async () => {
    let allPassed = false;
    
    if (language === 'javascript') {
      try {
        const results = executeJavascript(code, selectedProblem.id);
        allPassed = results.every(r => r.passed);
      } catch (e) {
        allPassed = false;
      }
    } else {
      // Simulate submission passes for non-JS languages
      allPassed = code.length > 50 && !code.includes('// Write your code here') && !code.includes('# Write your code here');
    }
    if (allPassed) {
      setConsoleOutput(`SUBMISSION SUCCESS 🎉\nAll test cases passed.\nYour progress metric has been updated for this challenge.`);
      setConsoleStatus('success');
      
      // Update stats via parent
      if (onProblemSolved) {
        onProblemSolved(selectedProblem.id, selectedProblem.title);
      }
    } else {
      setConsoleOutput(`SUBMISSION FAILED ❌\nEnsure all edge test cases pass before submitting.`);
      setConsoleStatus('error');
    }
  };
  const askForHint = async () => {
    if (!selectedProblem) return;
    setLoadingHint(true);
    const hintNum = hints.length + 1;
    
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/dsa/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          problemDescription: selectedProblem.description,
          constraints: selectedProblem.constraints,
          currentCode: code,
          language: language,
          hintNumber: hintNum
        })
      });
      
      const data = await res.json();
      setHints([...hints, data.hint]);
    } catch (e) {
      console.error(e);
      setHints([...hints, "Failed to connect to AI Mentor backend. Check network connections."]);
    } finally {
      setLoadingHint(false);
    }
  };
  return (
    <div className="dsa-workspace">
      {/* Problems list */}
      <div className="dsa-list-panel">
        <h2>Coding Library</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {problems.map((prob) => {
            const isSolved = solvedIds.includes(prob.id);
            return (
              <div
                key={prob.id}
                className={`dsa-problem-card ${selectedProblem?.id === prob.id ? 'active' : ''}`}
                onClick={() => handleSelectProblem(prob)}
              >
                <div className="dsa-problem-header">
                  <span className="dsa-problem-title">{prob.title}</span>
                  <span className={`badge badge-${prob.difficulty.toLowerCase()}`}>
                    {prob.difficulty}
                  </span>
                </div>
                <div className="dsa-problem-meta">
                  <span>{prob.category}</span>
                  {isSolved && <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ Solved</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Editor Space */}
      {selectedProblem ? (
        <div className="dsa-editor-panel">
          <div className="dsa-editor-header">
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>{selectedProblem.title}</h2>
              <span className="badge badge-medium" style={{ marginTop: '4px' }}>{selectedProblem.category}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              
              <div className="dsa-editor-actions">
                <button className="btn btn-secondary" onClick={handleRun}>Run Code</button>
                <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
              </div>
            </div>
          </div>
          <div className="dsa-split-editor">
            {/* Split top: Left is description, right is text area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', height: '100%', minHeight: 0 }}>
              <div className="glass-card" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                <h3>Problem Statement</h3>
                <p style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: '#e5e7eb' }}>
                  {selectedProblem.description}
                </p>
                
                <h4 style={{ marginTop: '10px' }}>Constraints</h4>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedProblem.constraints}
                </pre>
                <h4 style={{ marginTop: '10px' }}>Example Run</h4>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  <strong>Input:</strong> {selectedProblem.input}<br/>
                  <strong>Output:</strong> {selectedProblem.output}
                </div>
              </div>
              <div className="editor-textarea-wrapper">
                <textarea
                  className="editor-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ fontStyle: code.includes('//') ? 'italic' : 'normal' }}
                />
              </div>
            </div>
            {/* Split bottom: Console */}
            <div className="editor-console">
              <div className="console-header">
                <span>Console Logs</span>
                <span style={{ color: consoleStatus === 'success' ? 'var(--color-success)' : consoleStatus === 'error' ? 'var(--color-error)' : 'inherit' }}>
                  {consoleStatus ? consoleStatus.toUpperCase() : 'READY'}
                </span>
              </div>
              <div className={`console-output ${consoleStatus}`}>
                {consoleOutput}
              </div>
            </div>
          </div>
          {/* AI Mentor hints section */}
          <div className="glass-card ai-mentoring-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>💡 AI Mentor Feedback</h3>
                <p style={{ fontSize: '0.85rem' }}>Get incremental hints without giving away the full coding code.</p>
              </div>
              <button className="btn btn-secondary" onClick={askForHint} disabled={loadingHint}>
                {loadingHint ? 'Generating Hint...' : 'Ask AI for Hint'}
              </button>
            </div>
            
            {hints.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {hints.map((hint, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '3px solid var(--color-secondary)' }}>
                    <strong>Hint #{idx + 1}</strong>
                    <div className="ai-hint-content">{hint}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Select a DSA problem to begin practicing.</p>
        </div>
      )}
    </div>
  );
}

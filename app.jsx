import React, { useState, useEffect, useRef } from 'react';
export default function Aptitude({ quizzes, onQuizCompleted }) {
  // Stages: 'select', 'quiz', 'results'
  const [stage, setStage] = useState('select');
  const [topic, setTopic] = useState('quantitative');
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedIndex
  const [markedForReview, setMarkedForReview] = useState({}); // questionId -> boolean
  // Timer
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 secs)
  const timerRef = useRef(null);
  // AI Explanations state
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({}); // questionId -> text
  const startQuiz = (selectedTopic) => {
    setTopic(selectedTopic);
    const quizSet = quizzes[selectedTopic] || [];
    setQuestions(quizSet);
    setCurrentIdx(0);
    setAnswers({});
    setMarkedForReview({});
    setTimeLeft(300);
    setStage('quiz');
    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitQuiz(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  const handleSelectOption = (qId, optionIdx) => {
    setAnswers({
      ...answers,
      [qId]: optionIdx
    });
  };
  const toggleMarkReview = (qId) => {
    setMarkedForReview({
      ...markedForReview,
      [qId]: !markedForReview[qId]
    });
  };
  const submitQuiz = (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!auto && !confirm('Are you sure you want to submit your quiz?')) {
      // resume timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }
    setStage('results');
    // Calculate final score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    if (onQuizCompleted) {
      onQuizCompleted(scorePercentage, `Aptitude: ${topic.toUpperCase()}`);
    }
  };
  const getExplanation = async (q) => {
    if (explanations[q.id]) return; // already loaded
    setExplainingId(q.id);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/aptitude/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.correctAnswer,
          explanation: q.explanation
        })
      });
      const data = await res.json();
      setExplanations({
        ...explanations,
        [q.id]: data.detailedExplanation
      });
    } catch (e) {
      console.error(e);
      setExplanations({
        ...explanations,
        [q.id]: `Failed to retrieve AI explanation. Quick logic: ${q.explanation}`
      });
    } finally {
      setExplainingId(null);
    }
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const getQuestionBadgeClass = (qId, idx) => {
    let base = 'btn ';
    if (currentIdx === idx) {
      base += 'btn-cyan';
    } else if (markedForReview[qId]) {
      base += 'btn-secondary';
      // yellow outline border if marked
    } else if (answers[qId] !== undefined) {
      base += 'btn-primary';
    } else {
      base += 'btn-secondary';
      // styled default grey
    }
    return base;
  };
  return (
    <div>
      {stage === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h1>Aptitude Training Hub</h1>
            <p>Placement screening rounds start here. Practice timed exams across major subject verticals.</p>
          </div>
          <div className="quiz-topic-select">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '2.5rem' }}>🧮</div>
              <h3>Quantitative Aptitude</h3>
              <p>Solve arithmetic, speeds, percentages, ratios, and time-work proofs.</p>
              <button className="btn btn-primary" onClick={() => startQuiz('quantitative')} style={{ marginTop: 'auto' }}>
                Start Quant Quiz
              </button>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '2.5rem' }}>🧩</div>
              <h3>Logical Reasoning</h3>
              <p>Practice logical deductions, numeric series, patterns matching, and codes.</p>
              <button className="btn btn-primary" onClick={() => startQuiz('logical')} style={{ marginTop: 'auto' }}>
                Start Logical Quiz
              </button>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '2.5rem' }}>📚</div>
              <h3>Verbal Ability</h3>
              <p>Master English syntax, sentence completions, grammar errors, and synonyms.</p>
              <button className="btn btn-primary" onClick={() => startQuiz('verbal')} style={{ marginTop: 'auto' }}>
                Start Verbal Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      {stage === 'quiz' && questions.length > 0 && (
        <div className="quiz-container">
          <div className="quiz-header">
            <div>
              <h2>{topic.charAt(0).toUpperCase() + topic.slice(1)} Quiz</h2>
              <p style={{ marginTop: '4px' }}>Question {currentIdx + 1} of {questions.length}</p>
            </div>
            <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
              <span>⏱</span> {formatTime(timeLeft)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '24px', alignItems: 'start' }}>
            <div className="glass-card question-card">
              <span className="badge badge-medium" style={{ width: 'fit-content' }}>
                {markedForReview[questions[currentIdx].id] ? '★ MARKED FOR REVIEW' : 'PRACTICE QUESTION'}
              </span>
              <p className="question-text">{questions[currentIdx].question}</p>
              
              <div className="options-list">
                {questions[currentIdx].options.map((opt, oIdx) => {
                  const isSelected = answers[questions[currentIdx].id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(questions[currentIdx].id, oIdx)}
                    >
                      <span style={{ fontWeight: '700', marginRight: '10px' }}>{String.fromCharCode(65 + oIdx)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="quiz-nav">
                <button
                  className="btn btn-secondary"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(currentIdx - 1)}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleMarkReview(questions[currentIdx].id)}
                >
                  {markedForReview[questions[currentIdx].id] ? 'Unmark Review' : 'Mark Review'}
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button className="btn btn-secondary" onClick={() => setCurrentIdx(currentIdx + 1)}>
                    Next →
                  </button>
                ) : (
                  <button className="btn btn-cyan" onClick={() => submitQuiz(false)}>
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
            {/* Side Navigator palette */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>Exam Palette</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    className={getQuestionBadgeClass(q.id, idx)}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      border: markedForReview[q.id] ? '2px dashed var(--color-warning)' : '1px solid var(--border-glass)'
                    }}
                    onClick={() => setCurrentIdx(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }} />
                  <span>Answered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px dashed var(--color-warning)', borderRadius: '2px' }} />
                  <span>Marked for Review</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {stage === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div>
            <h1>Performance Summary</h1>
            <p>Take time to review step-by-step answers derivation using our mentoring models.</p>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Your Score: {questions.filter(q => answers[q.id] === q.correctAnswer).length} / {questions.length}</h2>
                <span className="badge badge-easy" style={{ marginTop: '4px' }}>
                  {Math.round((questions.filter(q => answers[q.id] === q.correctAnswer).length / questions.length) * 100)}% accuracy
                </span>
              </div>
              <button className="btn btn-primary" onClick={() => setStage('select')}>
                Take Another Quiz
              </button>
            </div>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <h4>Q{idx + 1}. {q.question}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                      {q.options.map((opt, oIdx) => {
                        let cls = '';
                        if (oIdx === q.correctAnswer) cls = 'correct';
                        else if (oIdx === userAns) cls = 'wrong';
                        return (
                          <div
                            key={oIdx}
                            className={`option-btn ${cls}`}
                            style={{ cursor: 'default', transform: 'none', padding: '10px 16px', maxWidth: '500px' }}
                          >
                            <span style={{ fontWeight: '700', marginRight: '8px' }}>{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                            {oIdx === q.correctAnswer && <span style={{ float: 'right', color: 'var(--color-success)' }}>✓ Correct Choice</span>}
                            {oIdx === userAns && oIdx !== q.correctAnswer && <span style={{ float: 'right', color: 'var(--color-error)' }}>✖ Selected Choice</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => getExplanation(q)}>
                          {explainingId === q.id ? 'Analyzing Formula...' : explanations[q.id] ? 'AI Explanation Loaded' : '💡 Explain with AI'}
                        </button>
                      </div>
                      
                      {explanations[q.id] && (
                        <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.03)', borderLeft: '3px solid var(--color-primary)', borderRadius: '6px', fontSize: '0.9rem', whiteSpace: 'pre-line', color: '#d1d5db', lineHeight: '1.6' }}>
                          {explanations[q.id]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
export default function Interview({ onInterviewCompleted }) {
  // States: 'setup', 'interviewing', 'evaluating', 'report'
  const [stage, setStage] = useState('setup');
  const [role, setRole] = useState('Software Engineer');
  const [type, setType] = useState('Technical');
  
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  // Evaluation Report States
  const [evaluation, setEvaluation] = useState(null);
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
    // Voice configs from settings
    const savedVoice = localStorage.getItem('enable_voice_interview') !== 'false';
    setIsVoiceEnabled(savedVoice);
  }, []);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  // Voice output (TTS)
  const speakText = (text) => {
    if (!isVoiceEnabled) return;
    try {
      window.speechSynthesis.cancel(); // Stop any current speech
      const rate = parseFloat(localStorage.getItem('voice_rate')) || 1.0;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };
  const startInterview = async () => {
    setStage('interviewing');
    setMessages([]);
    setLoadingChat(true);
    const initialGreeting = `Hello! Welcome to your ${type} Interview simulation for the ${role} position. Let's get started. Could you tell me a little bit about yourself and why you're interested in this role?`;
    // Load initial prompt
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    setLoadingChat(false);
    
    // Play voice greeting
    setTimeout(() => {
      speakText(initialGreeting);
    }, 500);
  };
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || loadingChat) return;
    // Stop speaking immediately if user answers
    window.speechSynthesis.cancel();
    const userMsg = { role: 'user', content: userInput };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserInput('');
    setLoadingChat(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          messages: updatedMessages,
          role,
          type
        })
      });
      const data = await res.json();
      
      setMessages([...updatedMessages, { role: 'assistant', content: data.message }]);
      speakText(data.message);
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { role: 'system', content: 'Connection timed out. Please retry sending message.' }]);
    } finally {
      setLoadingChat(false);
    }
  };
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please try Google Chrome or MS Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  const finishInterview = async () => {
    // Stop voices
    window.speechSynthesis.cancel();
    setStage('evaluating');
    setEvaluatingLoading(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          messages,
          role,
          type
        })
      });
      const data = await res.json();
      setEvaluation(data);
      setStage('report');
      // Update parent component's database stats
      if (onInterviewCompleted) {
        onInterviewCompleted(data.score, `${type} Mock (${role})`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate interview analysis report.');
      setStage('interviewing');
    } finally {
      setEvaluatingLoading(false);
    }
  };
  const resetInterview = () => {
    window.speechSynthesis.cancel();
    setMessages([]);
    setEvaluation(null);
    setStage('setup');
  };
  // Helper for scorecard border color
  const getScoreColorClass = (score) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  };
  return (
    <div>
      {stage === 'setup' && (
        <div className="interview-setup glass-card">
          <h2 style={{ textAlign: 'center' }}>AI Mock Interview Panel</h2>
          <p style={{ textAlign: 'center', fontSize: '0.95rem' }}>
            Practice real-time technical code reviews, project architectures, or behavioral HR scenarios.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div className="form-group">
              <label>Target Job Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Fullstack Engineer">Fullstack Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>
            <div className="form-group">
              <label>Interview Category</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Technical">Technical (Coding, Architecture, Design)</option>
                <option value="HR">HR Behavioral (Culture, Cooperation, Leadership)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={startInterview}>
                Start Interview Session
              </button>
            </div>
          </div>
        </div>
      )}
      {stage === 'interviewing' && (
        <div className="interview-container">
          {/* Main Chat space */}
          <div className="chat-panel glass-card" style={{ padding: 0 }}>
            <div className="chat-header">
              <div>
                <strong style={{ color: '#ffffff' }}>{type} Interview</strong>
                <span className="badge badge-medium" style={{ marginLeft: '12px' }}>{role}</span>
              </div>
              <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={finishInterview}>
                Finish & Evaluate
              </button>
            </div>
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {loadingChat && (
                <div className="chat-bubble assistant" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                  Interviewer is typing responses...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-panel" onSubmit={handleSendMessage}>
              <textarea
                className="chat-textarea"
                placeholder="Type your response here or click the microphone to speak..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              <button
                type="button"
                className={`voice-indicator ${isListening ? 'listening' : ''}`}
                onClick={toggleVoiceInput}
                title="Speak Answer"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ height: '48px' }} disabled={loadingChat || !userInput.trim()}>
                Send
              </button>
            </form>
          </div>
          {/* Quick tips sidebar */}
          <div className="side-panel">
            <div className="glass-card">
              <h3>💡 Interview Tips</h3>
              <ul className="bullet-list" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {type === 'Technical' ? (
                  <>
                    <li>Explain your design thought process clearly before writing equations.</li>
                    <li>Discuss algorithm complexities: Big O notation of your suggestions.</li>
                    <li>Mention trade-offs in memory versus speed performance.</li>
                  </>
                ) : (
                  <>
                    <li>Use the STAR format: Situation, Task, Action, Result.</li>
                    <li>Explain *your* individual contributions, not just general team efforts.</li>
                    <li>Talk about outcomes with numeric data where possible.</li>
                  </>
                )}
                <li>Speak at a comfortable, steady pace. Take breaths.</li>
              </ul>
            </div>
            
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SESSION CONFIG</span>
              <p style={{ marginTop: '6px', fontWeight: '600' }}>Voice Output: {isVoiceEnabled ? 'ON' : 'OFF'}</p>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem' }} 
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              >
                Toggle TTS Output
              </button>
            </div>
          </div>
        </div>
      )}
      {stage === 'evaluating' && (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2>AI Placement Assessor</h2>
          <div style={{ padding: '20px 0' }}>
            <div className="voice-indicator listening" style={{ margin: '0 auto 20px', width: '60px', height: '60px' }}>
              <span></span><span></span><span></span>
            </div>
            <p>Analyzing conversation flow, vocabulary depth, answers correctness, and STAR structures compliance...</p>
          </div>
        </div>
      )}
      {stage === 'report' && evaluation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <div>
            <h1>Assessment Report Card</h1>
            <p>Review detailed performance logs compiled by the placement simulator.</p>
          </div>
          <div className="glass-card report-card">
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '24px', alignItems: 'center' }}>
              <div className={`score-meter ${getScoreColorClass(evaluation.score)}`}>
                <div className="score-meter-inner">
                  <span className="score-num">{evaluation.score}</span>
                  <br />
                  <span className="score-label">rating</span>
                </div>
              </div>
              <div>
                <h2>{type} Evaluation: {role}</h2>
                <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>{evaluation.detailedSummary}</p>
              </div>
            </div>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
            <div className="grid-2">
              <div className="report-section">
                <h4>✓ Key Performance Strengths</h4>
                <ul className="bullet-list pos" style={{ marginTop: '8px' }}>
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
              <div className="report-section">
                <h4>⚠ Gaps / Areas to Improve</h4>
                <ul className="bullet-list neg" style={{ marginTop: '8px' }}>
                  {evaluation.weaknesses.map((weak, idx) => (
                    <li key={idx}>{weak}</li>
                  ))}
                </ul>
              </div>
            </div>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
            <div className="report-section">
              <h4>🎯 Actionable Improvement Tips</h4>
              <p style={{ fontSize: '0.95rem', color: '#e5e7eb', marginTop: '6px', lineHeight: '1.5' }}>
                {evaluation.improvementTips}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={resetInterview}>
                Start New Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

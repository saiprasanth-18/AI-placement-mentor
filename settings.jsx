import React, { useState, useEffect } from 'react';
export default function Settings({ onSettingsChange, onResetData }) {
  const [apiKey, setApiKey] = useState('');
  const [enableVoice, setEnableVoice] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1);
  const [apiStatus, setApiStatus] = useState('checking');
  useEffect(() => {
    // Load from local storage
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedVoice = localStorage.getItem('enable_voice_interview') !== 'false';
    const savedRate = parseFloat(localStorage.getItem('voice_rate')) || 1;
    setApiKey(savedKey);
    setEnableVoice(savedVoice);
    setVoiceRate(savedRate);
    checkBackendStatus();
  }, []);
  const checkBackendStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.envKeyExists) {
        setApiStatus('env_configured');
      } else {
        setApiStatus('needs_key');
      }
    } catch (e) {
      setApiStatus('offline');
    }
  };
  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('enable_voice_interview', enableVoice);
    localStorage.setItem('voice_rate', voiceRate.toString());
    
    alert('Settings saved successfully!');
    if (onSettingsChange) onSettingsChange();
    checkBackendStatus();
  };
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all placement progress data? This cannot be undone.')) {
      try {
        const res = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dsaSolvedCount: 0,
            interviewsCompletedCount: 0,
            averageInterviewScore: 0,
            quizzesTakenCount: 0,
            averageQuizScore: 0,
            latestResumeScore: 0,
            solvedDsaIds: [],
            recentActivity: [
              {
                id: `act-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'system',
                description: 'Progress database reset successfully.'
              }
            ]
          })
        });
        if (res.ok) {
          alert('Progress has been reset.');
          if (onResetData) onResetData();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to reset backend progress.');
      }
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1>Settings Configuration</h1>
        <p>Configure your Gemini API Keys, Audio models, and manage progress backups.</p>
      </div>
      <div className="glass-card">
        <div className="settings-group">
          <h3>Google Gemini Integration</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
            We connect to Gemini 1.5 Flash for coding feedback, interactive interview flow, and resume optimization.
          </p>
          <div style={{ marginTop: '16px' }} className="form-group">
            <label htmlFor="apiKey">Gemini API Key</label>
            <input
              id="apiKey"
              type="password"
              className="form-control"
              placeholder="Paste your AI Studio GEMINI_API_KEY here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="settings-desc-text">
              Key is stored locally in your browser. Grab a key from{' '}
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-secondary)' }}>
                Google AI Studio
              </a>.
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            {apiStatus === 'env_configured' && (
              <span className="badge badge-easy">✓ Backend ENV Key Loaded (API Active)</span>
            )}
            {apiStatus === 'needs_key' && apiKey && (
              <span className="badge badge-medium">⚠ Client-Side Local Key Entered (Requires Save)</span>
            )}
            {apiStatus === 'needs_key' && !apiKey && (
              <span className="badge badge-hard">⚠ Running in Demo/Mock Mode (Add key to unlock full AI responses)</span>
            )}
            {apiStatus === 'offline' && (
              <span className="badge badge-hard">✖ Backend Connection Error</span>
            )}
          </div>
        </div>
        <div className="settings-group">
          <h3>Voice Synthesis Configurations</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
            Customize Web Speech parameters for interactive oral mock interviews.
          </p>
          <div className="settings-row">
            <div>
              <span style={{ fontWeight: '500' }}>Enable Voice Narration</span>
              <p className="settings-desc-text">The AI interviewer speaks questions aloud.</p>
            </div>
            <input
              type="checkbox"
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              checked={enableVoice}
              onChange={(e) => setEnableVoice(e.target.checked)}
            />
          </div>
          <div className="settings-row">
            <div>
              <span style={{ fontWeight: '500' }}>Interviewer Speech Rate ({voiceRate}x)</span>
              <p className="settings-desc-text">Adjust voice speed parameters.</p>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceRate}
              onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
        <div className="settings-group">
          <h3>Data Maintenance</h3>
          <div className="settings-row" style={{ alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: '500', color: 'var(--color-error)' }}>Reset Progress Metrics</span>
              <p className="settings-desc-text">Erase all scores, activity logs, and achievements.</p>
            </div>
            <button className="btn btn-danger" onClick={handleReset}>
              Reset Database
            </button>
          </div>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Configurations
          </button>
        </div>
      </div>
    </div>
  );
}

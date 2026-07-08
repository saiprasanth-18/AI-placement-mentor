import React, { useState } from 'react';
export default function Resume({ onResumeChecked }) {
  const [targetRole, setTargetRole] = useState('Junior Fullstack Developer');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState(null);
  const handleScan = async () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text content.');
      return;
    }
    setIsScanning(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/resume/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          resumeText,
          targetRole
        })
      });
      const data = await res.json();
      setReport(data);
      if (onResumeChecked) {
        onResumeChecked(data.score);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to ATS scanner. Ensure server is running.');
    } finally {
      setIsScanning(false);
    }
  };
  const resetScanner = () => {
    setReport(null);
    setResumeText('');
    setJobDescription('');
  };
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1>ATS Resume Checker</h1>
        <p>Align your resume with specific industry job postings and optimize ATS performance.</p>
      </div>
      {!report && !isScanning && (
        <div className="resume-workspace">
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Target Role details</h3>
            <div className="form-group">
              <label htmlFor="role-select">Select Job Target Profile</label>
              <select id="role-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option value="Junior Fullstack Developer">Junior Fullstack Developer</option>
                <option value="Associate Software Engineer">Associate Software Engineer</option>
                <option value="Frontend Developer (React)">Frontend Developer (React)</option>
                <option value="Backend Developer (Node/Python)">Backend Developer (Node/Python)</option>
                <option value="Data Analyst / Engineer">Data Analyst / Engineer</option>
                <option value="Product Analyst">Product Analyst</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="jd-text">Target Job Description (Optional)</label>
              <textarea
                id="jd-text"
                className="form-control"
                placeholder="Paste the target job description details here to extract keywords..."
                style={{ height: '140px', resize: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Resume Content</h3>
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="resume-text">Paste Text-only Resume Profile</label>
              <textarea
                id="resume-text"
                className="resume-paste-area"
                placeholder="Paste the plain text of your resume (Copy all from Word or PDF, including Experience, Projects, Skills, Education)..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                style={{ flex: 1, minHeight: '180px' }}
              />
            </div>
            
            <button className="btn btn-primary" onClick={handleScan} style={{ width: '100%' }}>
              Scan & Optimize ATS Profile
            </button>
          </div>
        </div>
      )}
      {isScanning && (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
          <div className="voice-indicator listening" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }}>
            <span></span><span></span><span></span>
          </div>
          <h2>ATS Engine Parsing Content...</h2>
          <p style={{ marginTop: '12px' }}>Checking keyword weights, experience syntax, formatting gaps, and calculating job alignment ratio...</p>
        </div>
      )}
      {report && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '24px', alignItems: 'center' }}>
            <div className={`score-meter ${getScoreColorClass(report.score)}`}>
              <div className="score-meter-inner">
                <span className="score-num">{report.score}%</span>
                <br />
                <span className="score-label">ats match</span>
              </div>
            </div>
            <div>
              <h2>Analysis Report: {targetRole}</h2>
              <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>{report.generalSummary}</p>
            </div>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
          <div className="grid-2">
            <div className="report-section">
              <h4 style={{ color: 'var(--color-success)' }}>✓ Matching Keywords found ({report.matchingKeywords.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {report.matchingKeywords.map((kw, idx) => (
                  <span key={idx} className="badge badge-easy" style={{ fontSize: '0.8rem' }}>{kw}</span>
                ))}
              </div>
            </div>
            <div className="report-section">
              <h4 style={{ color: 'var(--color-error)' }}>✖ Critical Missing Keywords ({report.missingKeywords.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {report.missingKeywords.map((kw, idx) => (
                  <span key={idx} className="badge badge-hard" style={{ fontSize: '0.8rem' }}>{kw}</span>
                ))}
              </div>
            </div>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
          <div className="report-section">
            <h4>📄 Formatting & Layout Suggestions</h4>
            <ul className="bullet-list neg" style={{ marginTop: '8px' }}>
              {report.formattingFeedback.map((fb, idx) => (
                <li key={idx}>{fb}</li>
              ))}
            </ul>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />
          <div className="report-section">
            <h4>💡 Recommended Bullet-Point Improvements (STAR Method)</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              We rewritten some of your achievements to display quantifiable impact (what you built, metrics achieved, technologies used).
            </p>
            <div className="resume-diff-box">
              {report.bulletImprovements.map((diff, idx) => (
                <div key={idx} className="resume-diff-item">
                  <div className="diff-original">{diff.original}</div>
                  <div className="diff-improved">{diff.improved}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={resetScanner}>
              Upload Another Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

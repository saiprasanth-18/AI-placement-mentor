import React from 'react';
export default function Dashboard({ stats, setActiveTab }) {
  // Simple overall readiness calculation
  const calculateReadiness = () => {
    let score = 0;
    
    // DSA solved ratio (e.g. out of 10)
    score += Math.min(stats.dsaSolvedCount * 10, 30); // Max 30 pts
    
    // Interviews completed ratio (e.g. out of 3)
    score += Math.min(stats.interviewsCompletedCount * 10, 20); // Max 20 pts
    if (stats.interviewsCompletedCount > 0) {
      score += Math.min(stats.averageInterviewScore * 0.15, 15); // Max 15 pts
    }
    
    // Quizzes taken (e.g. out of 5)
    score += Math.min(stats.quizzesTakenCount * 4, 20); // Max 20 pts
    if (stats.quizzesTakenCount > 0) {
      score += Math.min(stats.averageQuizScore * 0.15, 15); // Max 15 pts
    }
    
    // Resume ATS Score
    if (stats.latestResumeScore > 0) {
      // Scale ATS score to 15 max points
      score += Math.min(stats.latestResumeScore * 0.15, 15);
    }
    
    return Math.round(score);
  };
  const readiness = calculateReadiness();
  const getRecommendation = () => {
    if (stats.dsaSolvedCount === 0) {
      return {
        title: "Kickstart your DSA Journey",
        text: "DSA forms the core of technical interviews. Solve 'Two Sum' or other easy problems to get comfortable.",
        actionTab: "dsa",
        actionText: "Practice DSA"
      };
    }
    if (stats.latestResumeScore === 0) {
      return {
        title: "Optimize Your Resume",
        text: "Most companies use ATS scanners. Get an instant score and suggestions to format your accomplishments.",
        actionTab: "resume",
        actionText: "Upload Resume"
      };
    }
    if (stats.interviewsCompletedCount === 0) {
      return {
        title: "Simulate a Mock Interview",
        text: "Put your knowledge to the test. Simulate a behavioral HR rounds or software development mock interviews.",
        actionTab: "interview",
        actionText: "Start Interview"
      };
    }
    if (stats.quizzesTakenCount === 0 || stats.averageQuizScore < 60) {
      return {
        title: "Strengthen Aptitude Foundations",
        text: "Aptitude assessments are the first elimination rounds in placements. Practice Logical and Quant quizzes.",
        actionTab: "aptitude",
        actionText: "Take Quiz"
      };
    }
    return {
      title: "Excellent Progress!",
      text: "You are doing great. Keep practice streaks alive by solving more DSA or taking a mock HR behavioral round.",
      actionTab: "interview",
      actionText: "Practice HR Round"
    };
  };
  const rec = getRecommendation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Grid */}
      <div className="dashboard-header">
        <div>
          <h1>Placement Dashboard</h1>
          <p className="dashboard-user-greeting">Welcome back! Tracking your preparation stats and AI feedback metrics.</p>
        </div>
        <div className="glass-card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>OVERALL PLACEMENT READINESS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-secondary)' }}>{readiness}%</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ready</span>
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎯
          </div>
        </div>
      </div>
      {/* Recommended Banner */}
      <div className="glass-card roadmap-alert">
        <div className="roadmap-details">
          <h3>
            <span>💡</span> AI Mentor Recommendation: {rec.title}
          </h3>
          <p style={{ color: '#d1d5db', fontSize: '0.95rem' }}>{rec.text}</p>
        </div>
        <button className="btn btn-cyan" onClick={() => setActiveTab(rec.actionTab)}>
          {rec.actionText} →
        </button>
      </div>
      {/* Grid Stats */}
      <div className="grid-4">
        <div className="glass-card stats-card">
          <span className="stats-label">DSA Solved</span>
          <span className="stats-value color-primary">{stats.dsaSolvedCount}</span>
          <span className="stats-desc">Problems solved on coding panel</span>
        </div>
        <div className="glass-card stats-card">
          <span className="stats-label">Mock Interviews</span>
          <span className="stats-value color-secondary">
            {stats.interviewsCompletedCount}
          </span>
          <span className="stats-desc">
            {stats.interviewsCompletedCount > 0 ? `Avg Score: ${stats.averageInterviewScore}%` : 'No mock scores loaded'}
          </span>
        </div>
        <div className="glass-card stats-card">
          <span className="stats-label">Quizzes Completed</span>
          <span className="stats-value color-success">{stats.quizzesTakenCount}</span>
          <span className="stats-desc">
            {stats.quizzesTakenCount > 0 ? `Avg Score: ${stats.averageQuizScore}%` : 'Aptitude metrics idle'}
          </span>
        </div>
        <div className="glass-card stats-card">
          <span className="stats-label">Resume Optimization</span>
          <span className="stats-value color-warning">
            {stats.latestResumeScore > 0 ? `${stats.latestResumeScore}%` : '0%'}
          </span>
          <span className="stats-desc">Latest ATS scanner score</span>
        </div>
      </div>
      {/* Grid 2-column details */}
      <div className="grid-2">
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2>Recent Preparation Activity</h2>
          <div className="activity-list">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice().reverse().map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-text">
                    <p style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>{act.description}</p>
                    <span className="activity-time">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No activities logged yet.</p>
            )}
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
          <div>
            <h2>Preparation Checklist</h2>
            <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Build standard profile strengths to stand out in recruitment drives.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" readOnly checked={stats.dsaSolvedCount >= 3} style={{ cursor: 'not-allowed' }} />
                <span style={{ textDecoration: stats.dsaSolvedCount >= 3 ? 'line-through' : 'none', color: stats.dsaSolvedCount >= 3 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  Solve at least 3 DSA algorithms
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" readOnly checked={stats.interviewsCompletedCount >= 1} style={{ cursor: 'not-allowed' }} />
                <span style={{ textDecoration: stats.interviewsCompletedCount >= 1 ? 'line-through' : 'none', color: stats.interviewsCompletedCount >= 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  Complete a mock interview round
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" readOnly checked={stats.quizzesTakenCount >= 2} style={{ cursor: 'not-allowed' }} />
                <span style={{ textDecoration: stats.quizzesTakenCount >= 2 ? 'line-through' : 'none', color: stats.quizzesTakenCount >= 2 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  Finish at least 2 Aptitude Quizzes
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" readOnly checked={stats.latestResumeScore >= 75} style={{ cursor: 'not-allowed' }} />
                <span style={{ textDecoration: stats.latestResumeScore >= 75 ? 'line-through' : 'none', color: stats.latestResumeScore >= 75 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  Get ATS Resume score above 75%
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('dsa')}>
              Code Workspace
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveTab('settings')}>
              Manage Configs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

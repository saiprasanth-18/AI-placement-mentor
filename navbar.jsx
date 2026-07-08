import React from 'react';
export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'dsa', label: 'DSA Practice', icon: '💻' },
    { id: 'interview', label: 'Mock Interview', icon: '🤝' },
    { id: 'aptitude', label: 'Aptitude Quiz', icon: '📝' },
    { id: 'resume', label: 'Resume Review', icon: '📄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <span>🚀</span> AI Placement Mentor
      </div>
      <ul className="nav-links">
        {tabs.map((tab) => (
          <li
            key={tab.id}
            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
            {tab.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}

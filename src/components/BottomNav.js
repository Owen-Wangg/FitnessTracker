import React from 'react';
import { FaHome, FaHistory, FaUser, FaDumbbell } from 'react-icons/fa';
import '../assets/styles/BottomNav.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: FaHome },
  { id: 'history', label: 'History', Icon: FaHistory },
  { id: 'profile', label: 'Profile', Icon: FaUser },
];

// Bottom tab bar on mobile; becomes a left sidebar on desktop (see BottomNav.css)
const BottomNav = ({ activeScreen, onNavigate }) => {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="nav-brand">
        <FaDumbbell size={22} aria-hidden="true" />
        <span>Fitness Tracker</span>
      </div>
      <div className="nav-items">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-button ${activeScreen === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={activeScreen === id ? 'page' : undefined}
          >
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

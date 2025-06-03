import React from 'react';
// Import FaHistory instead of FaCalendarAlt
import { FaHome, FaHistory } from 'react-icons/fa';
import '../assets/styles/BottomNav.css';

const BottomNav = ({ activeScreen, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={activeScreen === 'home' ? 'active' : ''}
        onClick={() => onNavigate('home')}
      >
        <FaHome size={24} />
        <span>Home</span>
      </button>
      <button
        className={activeScreen === 'history' ? 'active' : ''}
        onClick={() => onNavigate('history')}
      >
        {/* Updated Icon */}
        <FaHistory size={24} />
        <span>History</span>
      </button>
    </nav>
  );
};

export default BottomNav;
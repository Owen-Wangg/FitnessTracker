import React from 'react';
// Import FaUser for the profile icon
import { FaHome, FaHistory, FaUser } from 'react-icons/fa'; // Added FaUser
import '../assets/styles/BottomNav.css';

const BottomNav = ({ activeScreen, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-button ${activeScreen === 'home' ? 'active' : ''}`} // Added common class
        onClick={() => onNavigate('home')}
      >
        <FaHome size={24} />
        <span>Home</span>
      </button>
      <button
        className={`nav-button ${activeScreen === 'history' ? 'active' : ''}`} // Added common class
        onClick={() => onNavigate('history')}
      >
        <FaHistory size={24} />
        <span>History</span>
      </button>
      {/* --- ADDED PROFILE BUTTON --- */}
      <button
        className={`nav-button ${activeScreen === 'profile' ? 'active' : ''}`} // Added common class
        onClick={() => onNavigate('profile')}
      >
        <FaUser size={24} />
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
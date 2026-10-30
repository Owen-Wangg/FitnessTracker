import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaHistory, FaUser, FaDumbbell } from 'react-icons/fa';
import '../assets/styles/BottomNav.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: FaHome },
  { to: '/history', label: 'History', Icon: FaHistory },
  { to: '/profile', label: 'Profile', Icon: FaUser },
];

// Bottom tab bar on mobile; becomes a left sidebar on desktop (see BottomNav.css)
const BottomNav = () => {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="nav-brand">
        <FaDumbbell size={22} aria-hidden="true" />
        <span>Fitness Tracker</span>
      </div>
      <div className="nav-items">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

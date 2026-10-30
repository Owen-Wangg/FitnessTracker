import React from 'react';
import BodyWeightCard from '../components/BodyWeightCard';
import ThemeSelector from '../components/ThemeSelector';
import { displayNameFor, avatarUrlFor } from '../utils/userProfile';
import '../assets/styles/ProfileScreen.css';

const ProfileScreen = ({
  user = null,
  handleSignOut,
  lifetimeStats = { totalWeightLifted: 0 },
  bodyWeights = [],
  onLogBodyWeight,
  onDeleteBodyWeight,
  themePreference = 'system',
  onThemeChange,
}) => {
  const displayName = displayNameFor(user);
  const avatarUrl = avatarUrlFor(user);
  const latestBodyWeight = bodyWeights[bodyWeights.length - 1];

  return (
    <div className="profile-screen">
      <h1>My Profile</h1>

      <div className="profile-card card">
        <div className="profile-header">
          <div className="profile-picture-placeholder">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{displayName.substring(0, 1).toUpperCase()}</span>
            )}
          </div>
          <h2 className="display-name">{displayName}</h2>
          {user?.email && <p className="profile-email">{user.email}</p>}
        </div>

        <div className="profile-stats">
          <h3>Stats</h3>
          <div className="stat-item">
            <span className="stat-label">Body weight</span>
            <span className="stat-value">
              {latestBodyWeight ? `${latestBodyWeight.weight} lbs` : 'Not logged'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total weight lifted</span>
            <span className="stat-value">
              {(lifetimeStats?.totalWeightLifted || 0).toLocaleString()} lbs
            </span>
          </div>
        </div>

        {handleSignOut && (
          <div className="profile-actions">
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        )}
      </div>

      {onThemeChange && (
        <div className="appearance-card card">
          <h3 className="appearance-title">Appearance</h3>
          <ThemeSelector value={themePreference} onChange={onThemeChange} />
        </div>
      )}

      <BodyWeightCard
        entries={bodyWeights}
        onLog={onLogBodyWeight}
        onDelete={onDeleteBodyWeight}
      />
    </div>
  );
};

export default ProfileScreen;

import React from 'react';
import BodyWeightCard from '../components/BodyWeightCard';
import '../assets/styles/ProfileScreen.css'; // We'll create this CSS file

// Accept handleSignOut and potentially user data as props later
const ProfileScreen = ({
  user,
  handleSignOut,
  lifetimeStats,
  bodyWeights = [],
  onLogBodyWeight,
  onDeleteBodyWeight,
}) => {

  // Placeholder data - you'll replace this with actual data from state/props
  const displayName = user?.email?.split('@')[0] || 'Fitness Enthusiast'; // Example
  const height = 'N/A'; // e.g., "5'10\"" or "178 cm"
  const latestBodyWeight = bodyWeights[bodyWeights.length - 1];
  const weight = latestBodyWeight ? `${latestBodyWeight.weight} lbs` : 'N/A';
  const lifetimeWeightLifted = lifetimeStats?.totalWeightLifted || 0; // Example structure

  return (
    <div className="profile-screen">
      <h1>My Profile</h1>

      <div className="profile-card card"> {/* Re-use .card style if you have one globally */}
        <div className="profile-header">
          <div className="profile-picture-placeholder">
            {/* Placeholder for an image - could be an icon or initials */}
            <span>{displayName.substring(0, 1).toUpperCase()}</span>
          </div>
          <h2 className="display-name">{displayName}</h2>
          {user?.email && <p className="profile-email">{user.email}</p>}
        </div>

        <div className="profile-details">
          <h3>Details</h3>
          <div className="detail-item">
            <span className="detail-label">Height:</span>
            <span className="detail-value">{height}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Current Weight:</span>
            <span className="detail-value">{weight}</span>
          </div>
        </div>

        <div className="profile-stats">
          <h3>Lifetime Stats</h3>
          <div className="stat-item">
            <span className="stat-label">Total Weight Lifted:</span>
            <span className="stat-value">
              {lifetimeWeightLifted.toLocaleString()} lbs
            </span>
          </div>
          {/* Add more stats here later */}
        </div>

        <div className="profile-actions">
          {/* <button className="edit-profile-btn">Edit Profile</button> */} {/* Placeholder for later */}
          {handleSignOut && ( // Only show if handleSignOut is provided
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          )}
        </div>
      </div>

      <BodyWeightCard
        entries={bodyWeights}
        onLog={onLogBodyWeight}
        onDelete={onDeleteBodyWeight}
      />
    </div>
  );
};

ProfileScreen.defaultProps = {
  user: null,
  lifetimeStats: { totalWeightLifted: 0 }
};

export default ProfileScreen;
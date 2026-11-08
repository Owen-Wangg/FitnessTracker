import React from 'react';
import BodyWeightCard from '../components/BodyWeightCard';
import ThemeSelector from '../components/ThemeSelector';
import ConsistencyCard from '../components/ConsistencyCard';
import PersonalRecordsCard from '../components/PersonalRecordsCard';
import UnitSelector from '../components/UnitSelector';
import { useUnit } from '../components/UnitProvider';
import { toDisplay } from '../utils/units';
import { displayNameFor, avatarUrlFor, type UserLike } from '../utils/userProfile';
import type { BodyWeight, BodyWeightDraft, ThemePreference, Workout } from '../types';
import '../assets/styles/ProfileScreen.css';

interface ProfileScreenProps {
  user?: UserLike | null;
  handleSignOut?: () => void | Promise<void>;
  lifetimeStats?: { totalWeightLifted: number };
  workouts?: Workout[]; // everything logged, for the records and trends
  bodyWeights?: BodyWeight[]; // oldest first
  onLogBodyWeight: (entry: BodyWeightDraft) => Promise<boolean>;
  onDeleteBodyWeight: (id: string) => void;
  themePreference?: ThemePreference;
  onThemeChange?: (preference: ThemePreference) => void;
}

const ProfileScreen = ({
  user = null,
  handleSignOut,
  lifetimeStats = { totalWeightLifted: 0 },
  workouts = [],
  bodyWeights = [],
  onLogBodyWeight,
  onDeleteBodyWeight,
  themePreference = 'system',
  onThemeChange,
}: ProfileScreenProps) => {
  const { unit, setUnit } = useUnit();
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
              {latestBodyWeight ? `${toDisplay(latestBodyWeight.weight, unit)} ${unit}` : 'Not logged'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total weight lifted</span>
            <span className="stat-value">
              {toDisplay(lifetimeStats?.totalWeightLifted || 0, unit).toLocaleString()} {unit}
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

      <ConsistencyCard workouts={workouts} />

      <PersonalRecordsCard workouts={workouts} />

      {onThemeChange && (
        <div className="appearance-card card">
          <h3 className="appearance-title">Appearance</h3>
          <ThemeSelector value={themePreference} onChange={onThemeChange} />
        </div>
      )}

      <div className="appearance-card card">
        <h3 className="appearance-title">Weight unit</h3>
        <UnitSelector value={unit} onChange={setUnit} />
      </div>

      <BodyWeightCard
        entries={bodyWeights}
        onLog={onLogBodyWeight}
        onDelete={onDeleteBodyWeight}
      />
    </div>
  );
};

export default ProfileScreen;

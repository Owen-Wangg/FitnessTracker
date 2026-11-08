import React, { useMemo } from 'react';
import BodyWeightCard from '../components/BodyWeightCard';
import ThemeSelector from '../components/ThemeSelector';
import ConsistencyCard from '../components/ConsistencyCard';
import MuscleSplitCard from '../components/MuscleSplitCard';
import PersonalRecordsCard from '../components/PersonalRecordsCard';
import UnitSelector from '../components/UnitSelector';
import { useUnit } from '../components/UnitProvider';
import { toDisplay } from '../utils/units';
import { compactNumber, monthYear } from '../utils/format';
import { lifetimeStats } from '../utils/lifetime';
import { displayNameFor, avatarUrlFor, type UserLike } from '../utils/userProfile';
import type { BodyWeight, BodyWeightDraft, ThemePreference, Workout } from '../types';
import '../assets/styles/ProfileScreen.css';

interface ProfileScreenProps {
  user?: UserLike | null;
  handleSignOut?: () => void | Promise<void>;
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
  const totals = useMemo(() => lifetimeStats(workouts), [workouts]);

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
          <h3>Your training</h3>
          <dl className="stat-tiles">
            <div className="stat-tile">
              <dd className="stat-tile-value">{totals.daysTrained.toLocaleString()}</dd>
              <dt className="stat-tile-label">Days trained</dt>
            </div>
            <div className="stat-tile">
              <dd className="stat-tile-value">{totals.sets.toLocaleString()}</dd>
              <dt className="stat-tile-label">Sets logged</dt>
            </div>
            <div className="stat-tile">
              <dd className="stat-tile-value" title={`${toDisplay(totals.volume, unit).toLocaleString()} ${unit}`}>
                {compactNumber(toDisplay(totals.volume, unit))}
              </dd>
              <dt className="stat-tile-label">{unit} lifted</dt>
            </div>
            <div className="stat-tile">
              <dd className="stat-tile-value">{totals.firstDate ? monthYear(totals.firstDate) : '–'}</dd>
              <dt className="stat-tile-label">Training since</dt>
            </div>
          </dl>
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

      <MuscleSplitCard workouts={workouts} />

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

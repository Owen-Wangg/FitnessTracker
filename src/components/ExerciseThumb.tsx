import React, { useState } from 'react';
import { FaDumbbell } from 'react-icons/fa';
import { exerciseImageUrl } from '../utils/exerciseLibrary';
import type { Exercise } from '../types';
import '../assets/styles/ExerciseThumb.css';

// Exercise illustration, with a dumbbell placeholder for older entries not in the list, or failed loads.
interface ExerciseThumbProps {
  exercise?: Exercise | null; // null for an older entry not in the list
  size?: number;
}

const ExerciseThumb = ({ exercise, size = 56 }: ExerciseThumbProps) => {
  const [failed, setFailed] = useState(false);
  const src = exerciseImageUrl(exercise);

  return (
    <span className={`exercise-thumb ${src && !failed ? '' : 'placeholder'}`} style={{ width: size, height: size }}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <FaDumbbell aria-hidden="true" />
      )}
    </span>
  );
};

export default ExerciseThumb;

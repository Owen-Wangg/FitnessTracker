import React, { useState } from 'react';
import { FaDumbbell } from 'react-icons/fa';
import { exerciseImageUrl } from '../utils/exerciseLibrary';
import '../assets/styles/ExerciseThumb.css';

// Exercise illustration, with a dumbbell placeholder for custom exercises or failed loads.
const ExerciseThumb = ({ exercise, size = 56 }) => {
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

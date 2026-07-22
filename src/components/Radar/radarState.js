import { useState, useEffect } from 'react';

// Create a simple event emitter for sharing state outside of React context
const createEventEmitter = () => {
  const listeners = new Set();

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (data) => {
      listeners.forEach((listener) => listener(data));
    }
  };
};

const hiddenLevelsEmitter = createEventEmitter();
let currentHiddenLevels = new Set();

export const useRadarFilters = () => {
  const [hiddenLevels, setHiddenLevels] = useState(currentHiddenLevels);

  useEffect(() => {
    return hiddenLevelsEmitter.subscribe(setHiddenLevels);
  }, []);

  const toggleLevel = (levelLabel) => {
    const newHidden = new Set(currentHiddenLevels);
    if (newHidden.has(levelLabel)) {
      newHidden.delete(levelLabel);
    } else {
      newHidden.add(levelLabel);
    }
    currentHiddenLevels = newHidden;
    hiddenLevelsEmitter.emit(currentHiddenLevels);
  };

  return { hiddenLevels, toggleLevel };
};

import React from 'react';
import { Equalizer10Band } from './Equalizer10Band';

export const EqualizerPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Equalizer10Band className={className} />;
};

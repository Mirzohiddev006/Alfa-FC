// @ts-nocheck
import React from 'react';

export const Icon = {
  Key: ({size=16}) => <svg width={size} height={size}><rect width={size} height={size} fill="currentColor"/></svg>,
  Check: ({size=16, color}) => <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={size/2} fill={color||'currentColor'}/></svg>,
};

export default Icon;

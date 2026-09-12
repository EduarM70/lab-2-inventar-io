import { PropsWithChildren, useEffect } from 'react';
import { Uniwind } from 'uniwind';

import { ThemePreference } from '@/theme/theme';

interface GluestackUIProviderProps extends PropsWithChildren {
  mode?: ThemePreference;
}

export function GluestackUIProvider({ children, mode = 'system' }: GluestackUIProviderProps) {
  useEffect(() => {
    Uniwind.setTheme(mode);
  }, [mode]);

  return children;
}

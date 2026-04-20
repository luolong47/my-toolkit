'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipPrimitive.Provider delayDuration={100}>
        {children}
      </TooltipPrimitive.Provider>
    </NextThemesProvider>
  );
}

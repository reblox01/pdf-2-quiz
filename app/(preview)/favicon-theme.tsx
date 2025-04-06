'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function FaviconHandler() {
  const { theme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    // Get current favicon elements
    const darkFavicon = document.querySelector('link[media="(prefers-color-scheme: dark)"]');
    const lightFavicon = document.querySelector('link[media="(prefers-color-scheme: light)"]');
    const fallbackFavicon = document.querySelector('link[sizes="any"]');
    
    // Determine which favicon to use based on the current theme
    const currentTheme = resolvedTheme || theme;
    
    if (currentTheme === 'dark') {
      // For dark theme, remove the media attribute from dark favicon
      if (darkFavicon) {
        darkFavicon.setAttribute('media', '');
      }
      // Add media attribute to light favicon to hide it
      if (lightFavicon) {
        lightFavicon.setAttribute('media', 'not all');
      }
    } else {
      // For light theme, remove the media attribute from light favicon
      if (lightFavicon) {
        lightFavicon.setAttribute('media', '');
      }
      // Add media attribute to dark favicon to hide it
      if (darkFavicon) {
        darkFavicon.setAttribute('media', 'not all');
      }
    }
  }, [theme, resolvedTheme]);

  return null; // This component doesn't render anything
} 
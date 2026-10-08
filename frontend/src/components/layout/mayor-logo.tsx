import { useEffect, useState } from 'react';
import { useTheme } from '@/context/theme-context';
import { fallbackLogoUrl, useBranding, type BrandingVariant } from '@/context/branding-context';

interface MayorLogoProps {
  className?: string
  isCollapsed?: boolean
}

const MayorLogo = ({ className = '', isCollapsed = false }: MayorLogoProps) => {
  const { theme } = useTheme();
  const { brandName, logoUrl } = useBranding();

  // Function to determine logo source based on theme and collapse state
  const getLogoVariant = (currentTheme: string, currentIsCollapsed: boolean): BrandingVariant => {
    let effectiveTheme = currentTheme;

    // If theme is 'system', determine based on system preference
    if (currentTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // When theme is dark, use the dark logo (has light colors that show on dark background)
    // When theme is light, use the light logo (has dark colors that show on light background)
    const isDarkTheme = effectiveTheme === 'dark';

    // Choose compact or full logo based on collapse state
    if (currentIsCollapsed) {
      return isDarkTheme ? 'compactDark' : 'compactLight';
    }
    return isDarkTheme ? 'fullDark' : 'fullLight';
  };

  const [logoVariant, setLogoVariant] = useState(() => getLogoVariant(theme, isCollapsed));

  useEffect(() => {
    setLogoVariant(getLogoVariant(theme, isCollapsed));
  }, [theme, isCollapsed]);

  return (
    <img
      src={logoUrl(logoVariant)}
      alt={brandName}
      className={`${isCollapsed ? 'h-12 w-auto max-w-[150px]' : 'h-10 w-auto max-w-full'} ${className}`}
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = fallbackLogoUrl(logoVariant)
      }}
    />
  );
};

export default MayorLogo;

import { useMediaQuery } from '@mantine/hooks';

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isSmallScreen = useMediaQuery('(max-width: 1024px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
  };
}

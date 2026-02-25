import { useEffect } from 'react';

interface LMSZoomResetProps {
  children: React.ReactNode;
}

/**
 * Wrapper that resets the global zoom from 0.7 to 1.0 for LMS pages.
 * Same pattern used by MonitoringTVPage.
 */
const LMSZoomReset: React.FC<LMSZoomResetProps> = ({ children }) => {
  useEffect(() => {
    const html = document.documentElement;
    const original = html.style.zoom;
    html.style.zoom = '1';
    return () => { html.style.zoom = original; };
  }, []);

  return <>{children}</>;
};

export default LMSZoomReset;

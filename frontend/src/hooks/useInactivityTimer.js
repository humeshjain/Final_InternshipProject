import { useEffect } from "react";

export function useInactivityTimer(sessionToken, handleLogout) {
  useEffect(() => {
    if (!sessionToken) return;
    
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout(true);
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [sessionToken, handleLogout]);
}

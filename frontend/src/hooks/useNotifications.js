import { useState, useCallback } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [dismissingId, setDismissingId] = useState(null);

  const addNotification = useCallback((text, type) => {
    const newNotif = {
      id: "n-" + Date.now(),
      text,
      type,
      time: "Just now"
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const handleDismissNotification = useCallback((id) => {
    setDismissingId(id);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setDismissingId(null);
    }, 250);
  }, []);

  return {
    notifications,
    setNotifications,
    dismissingId,
    addNotification,
    handleDismissNotification
  };
}

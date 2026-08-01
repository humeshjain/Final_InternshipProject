import React from "react";
import { ShieldAlert } from "lucide-react";
import { getAlertStyles } from "../../utils/alertStyles.js";

export default function NotificationBanner({ currentNotif, dismissingId, handleDismissNotification }) {
  if (!currentNotif) return null;
  const isDismissing = currentNotif.id === dismissingId;
  const style = getAlertStyles(currentNotif.type);

  return (
    <div 
      id={`notification-banner-${currentNotif.id}`}
      key={currentNotif.id}
      className={`border rounded-2xl p-4.5 flex items-start gap-3 mb-6 transition-all ${
        style.bg
      } ${
        isDismissing ? "animate-slide-out" : "animate-slide-in"
      }`}
    >
      <ShieldAlert className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
      <div className={`flex-1 text-xs leading-relaxed ${style.text}`}>
        <span className={`font-extrabold uppercase tracking-wide block mb-0.5 ${style.title}`}>
          {style.titleText}
        </span> 
        {currentNotif.text}
      </div>
      <button 
        id={`btn-dismiss-${currentNotif.id}`}
        onClick={() => handleDismissNotification(currentNotif.id)} 
        className={`hover:brightness-125 text-xs font-bold self-center transition-all ${style.iconColor}`}
      >
        Dismiss
      </button>
    </div>
  );
}

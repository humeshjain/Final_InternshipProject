import { useState, useEffect } from "react";

export function useVoiceCommand(handleSendMessage, addNotification) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSpeechSupported, setVoiceSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setVoiceSpeechSupported(true);
    }
  }, []);

  const triggerVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-IN";
      rec.onstart = () => {
        setVoiceActive(true);
        if (addNotification) addNotification("Voice assistant listening... Speak in Hindi or English", "success");
      };
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        handleSendMessage(text);
        if (addNotification) addNotification(`Heard: "${text}"`, "success");
      };
      rec.onend = () => {
        setVoiceActive(false);
      };
      rec.start();
    } else {
      const samples = [
        "What are today's sales?",
        "What is my profit?",
        "Which products need reorder?",
        "आज का मुनाफा कितना है?"
      ];
      const randomSample = samples[Math.floor(Math.random() * samples.length)];
      handleSendMessage(randomSample);
      if (addNotification) addNotification(`Speech simulation triggered: "${randomSample}"`, "success");
    }
  };

  return {
    voiceActive,
    setVoiceActive,
    voiceSpeechSupported,
    triggerVoiceCommand
  };
}

export const speakText = (text) => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  }
};

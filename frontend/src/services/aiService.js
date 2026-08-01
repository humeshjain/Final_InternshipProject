import { aiApi } from '../api/aiApi.js';

export const aiService = {
  sendChat: aiApi.sendChat,
  analyze: aiApi.analyze
};

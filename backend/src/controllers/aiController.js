import { aiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const aiController = {
  getConfig(req, res) {
    return res.json({ apiKey: aiService.getApiKey() });
  },

  async chat(req, res, next) {
    try {
      const { messages, companyContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return sendError(res, "messages array is required", 400);
      }
      const response = await aiService.handleChat(messages, companyContext);
      return res.json(response);
    } catch (err) {
      console.error("AI Controller Chat Error:", err);
      return sendError(res, err.message || "Failed to contact AI engine", 500);
    }
  },

  async analyze(req, res, next) {
    try {
      const { type, companyContext } = req.body;
      if (!type || !companyContext) {
        return sendError(res, "type and companyContext are required", 400);
      }
      const result = await aiService.handleAnalysis(type, companyContext);
      return res.json(result);
    } catch (err) {
      console.error("AI Controller Analyze Error:", err);
      return sendError(res, err.message || "Failed to run AI analysis", 500);
    }
  }
};

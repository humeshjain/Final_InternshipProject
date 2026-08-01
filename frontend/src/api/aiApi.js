const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const aiApi = {
  async sendChat(messages, companyContext) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, companyContext })
      });
      if (!res.ok) {
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch (_) {}
        return {
          role: 'assistant',
          content: `⚠️ **API Error (${res.status})**: ${json.error || json.message || text.slice(0, 100) || "Server request failed."}`
        };
      }
      return await res.json();
    } catch (err) {
      console.error("aiApi.sendChat error:", err);
      return {
        role: 'assistant',
        content: `⚠️ **Connection Error**: ${err.message || "Unable to communicate with backend AI service."}`
      };
    }
  },

  async analyze(type, companyContext) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, companyContext })
      });
      if (!res.ok) {
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch (_) {}
        return {
          error: json.error || `HTTP ${res.status}: ${text.slice(0, 100)}`
        };
      }
      return await res.json();
    } catch (err) {
      console.error("aiApi.analyze error:", err);
      return {
        error: err.message || "Failed to reach AI analysis service."
      };
    }
  }
};

import { createApp } from './src/app.js';
import { config } from './src/config/env.js';

createApp().then((app) => {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on port ${config.port}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
});

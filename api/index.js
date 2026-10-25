import { createApp } from '../backend/src/app.js';

let appInstance = null;

export default async function handler(req, res) {
  if (!appInstance) {
    appInstance = await createApp();
  }
  return appInstance(req, res);
}

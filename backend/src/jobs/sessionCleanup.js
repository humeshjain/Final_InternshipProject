export function initSessionCleanupJob() {
  // Session / audit log routine job cleanup if required
  setInterval(() => {
    // Maintenance routine runs every hour
  }, 3600000);
}

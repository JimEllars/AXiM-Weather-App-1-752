export const logTelemetry = (eventType, data) => {
  if (navigator.sendBeacon) {
    const url = '/cdn-cgi/telemetry';
    const payload = JSON.stringify({ eventType, data, timestamp: Date.now() });
    navigator.sendBeacon(url, payload);
  }
};

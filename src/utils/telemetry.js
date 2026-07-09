let telemetryQueue = [];
let flushIntervalId = null;
const MAX_QUEUE_SIZE = 50;
const FLUSH_INTERVAL_MS = 15000;

const flushQueue = () => {
  if (telemetryQueue.length === 0) return;

  if (navigator.sendBeacon) {
    const url = '/cdn-cgi/telemetry';
    // Send as a batch
    const payload = JSON.stringify({ events: telemetryQueue });
    navigator.sendBeacon(url, payload);
  }

  telemetryQueue = [];
};

const startFlusher = () => {
  if (typeof window !== 'undefined' && !flushIntervalId) {
    flushIntervalId = setInterval(flushQueue, FLUSH_INTERVAL_MS);

    // Attempt to flush remaining events when leaving the page
    window.addEventListener('beforeunload', () => {
      flushQueue();
    });
  }
};

export const logTelemetry = (eventType, data) => {
  const event = { eventType, data, timestamp: Date.now() };

  const isHighSeverity = eventType === 'crash' || eventType === 'error' || eventType === 'fatal';

  // High-severity exceptions bypass the queue to emit instantly
  if (isHighSeverity) {
    if (navigator.sendBeacon) {
      const url = '/cdn-cgi/telemetry';
      const payload = JSON.stringify({ events: [event] });
      navigator.sendBeacon(url, payload);
    }
    return;
  }

  telemetryQueue.push(event);

  if (!flushIntervalId) {
    startFlusher();
  }

  if (telemetryQueue.length >= MAX_QUEUE_SIZE) {
    flushQueue();
  }
};

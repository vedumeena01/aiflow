/**
 * AutoFlow AI — In-App Feedback & Product Telemetry Service
 * Collects user ratings, bug reports with diagnostic state snapshots,
 * feature requests, and tracks workflow analytics / feature adoption.
 */

const FEEDBACK_STORAGE_KEY = 'autoflow_user_feedback_v1';
const TELEMETRY_STORAGE_KEY = 'autoflow_telemetry_events_v1';
const ONBOARDING_KEY = 'autoflow_onboarding_completed_v1';

/**
 * Submit user rating, bug report, or feature request
 */
export function submitUserFeedback({
  type = 'rating', // 'rating' | 'bug' | 'feature'
  rating = 5,
  title = '',
  description = '',
  category = 'general',
  diagnostics = {}
}) {
  const existing = getStoredFeedback();
  
  const record = {
    id: `fb_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type,
    rating: Number(rating) || 5,
    title: title.trim(),
    description: description.trim(),
    category,
    diagnostics: {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      timestamp: new Date().toISOString(),
      ...diagnostics
    }
  };

  existing.unshift(record);
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to persist user feedback:', e);
  }

  // Also log telemetry event
  trackTelemetryEvent('feedback_submitted', { type, rating, category });
  return record;
}

export function getStoredFeedback() {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Product Analytics & Feature Adoption Telemetry
 */
export function trackTelemetryEvent(eventName, metadata = {}) {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const events = raw ? JSON.parse(raw) : [];

    const eventRecord = {
      event: eventName,
      timestamp: new Date().toISOString(),
      metadata
    };

    events.push(eventRecord);
    // Keep last 250 telemetry records
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events.slice(-250)));
  } catch (e) {}
}

export function getTelemetrySummary() {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const events = raw ? JSON.parse(raw) : [];
    
    const counts = {};
    events.forEach(e => {
      counts[e.event] = (counts[e.event] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventCounts: counts,
      recentEvents: events.slice(-10).reverse()
    };
  } catch (e) {
    return { totalEvents: 0, eventCounts: {}, recentEvents: [] };
  }
}

/**
 * Onboarding Status
 */
export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboardingCompleted() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
  trackTelemetryEvent('onboarding_completed');
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}

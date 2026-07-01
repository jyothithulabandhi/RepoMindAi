// API configuration and utilities for RepoMind AI

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Safely parse a response as JSON, with text fallback.
 * @param {Response} response 
 * @returns {Promise<any>}
 */
export async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  if (isJson) {
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`Failed to parse response JSON: ${e.message}`);
    }
  } else {
    try {
      const text = await response.text();
      return text;
    } catch (e) {
      return '';
    }
  }
}

/**
 * Robust fetch wrapper to handle errors gracefully.
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  let response;
  try {
    response = await fetch(url, options);
  } catch (netErr) {
    console.error('Network error during fetch:', netErr);
    throw new Error(
      `Network Connection Failed!\n\n` +
      `Could not connect to the Backend API at "${url}".\n\n` +
      `If you deployed to Render, please ensure:\n` +
      `1. Your Backend Render service is active (not sleeping). Free web services spin down after 15 minutes of inactivity and take ~1 minute to wake up.\n` +
      `2. If you deployed the Frontend and Backend as separate Render services, you MUST configure the frontend with the backend's URL. In your Render Frontend Static Site dashboard, set the environment variable 'VITE_API_BASE_URL' to your backend's Render URL (e.g. https://your-backend.onrender.com).`
    );
  }

  if (!response.ok) {
    let data;
    try {
      data = await parseResponse(response);
    } catch (_) {
      data = null;
    }

    const detail = typeof data === 'object' && data !== null ? data.detail : null;
    const bodyText = typeof data === 'string' ? data : null;
    
    // Construct user-friendly error message based on common HTTP status codes
    let errMsg = detail || bodyText || '';
    if (response.status === 404) {
      errMsg = errMsg || 'Endpoint not found. Make sure the API URL is correct or backend is properly mounted.';
    } else if (response.status === 550 || response.status === 502 || response.status === 504) {
      errMsg = errMsg || 'Bad gateway / server timeout. The backend might be starting up or sleeping on Render. Please wait a minute and try again.';
    } else if (response.status === 500) {
      errMsg = errMsg || 'Internal server error. The backend encountered an unexpected error.';
    } else {
      errMsg = errMsg || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errMsg);
  }

  return parseResponse(response);
}

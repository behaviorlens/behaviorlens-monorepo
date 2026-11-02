export const describeUserAgentParts = userAgent => {
  if (!userAgent) {
    return null;
  }

  const ua = String(userAgent);
  let browser = 'Browser';
  if (/edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  }

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/mac os x|macintosh/i.test(ua)) {
    os = 'macOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/iphone|ipad|ios/i.test(ua)) {
    os = 'iOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return { browser, os };
};

// Coarse, honest browser/OS description derived from a recorded user-agent
// string. Returns null when no user agent is available.
export const describeUserAgent = userAgent => {
  const parts = describeUserAgentParts(userAgent);
  return parts ? `${parts.browser} · ${parts.os}` : null;
};

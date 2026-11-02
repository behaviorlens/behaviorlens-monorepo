// Visitor profiles derived from recorded sessions, in the shape the visitor
// cards and session rows read: { name, category: [...] }.
//
// Only identified visitors (sessions with a username, set by the site through
// BehaviorLens.identify) get a profile: an anonymous visit cannot be told
// apart from a returning one. Countries are not derived; IPs are not stored.
//
//   first_visits / returnings   one session vs. more than one for that visitor
//   organic / referrals         first session came from a search engine vs. any other site

const SEARCH_ENGINES = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia|startpage|search\.brave)\./i;

export const trafficSourceOf = (referrer, siteUrl) => {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    if (siteUrl && host === new URL(siteUrl).hostname) return null; // internal navigation
    return SEARCH_ENGINES.test(`${host}.`) ? 'organic' : 'referrals';
  } catch (error) {
    return null;
  }
};

export const buildVisitorProfiles = sessions => {
  const byVisitor = new Map();
  (Array.isArray(sessions) ? sessions : []).forEach(session => {
    const name = String(session?.username || '').trim();
    if (!name) return;
    const list = byVisitor.get(name) || [];
    list.push(session);
    byVisitor.set(name, list);
  });
  return Array.from(byVisitor.entries()).map(([name, list]) => {
    const first = list.slice().sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)))[0];
    const source = trafficSourceOf(first?.referrer, first?.url);
    return {
      name,
      category: [list.length > 1 ? 'returnings' : 'first_visits', source].filter(Boolean)
    };
  });
};

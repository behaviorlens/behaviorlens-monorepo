// Dashboard numbers for the sessions currently in the list.

const dayKey = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T]/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

export const buildFilteredDashboardStats = sessions => {
  const items = Array.isArray(sessions) ? sessions : [];
  const totalDuration = items.reduce((total, session) => total + (Number(session?.duration_s) || 0), 0);
  const totalEvents = items.reduce((total, session) => total + (Number(session?.event_count) || 0), 0);
  const days = new Map();
  const pages = new Map();

  items.forEach(session => {
    const day = dayKey(session?.started_at);
    if (day) {
      days.set(day, (days.get(day) || 0) + 1);
    }
    const url = String(session?.url || '').trim();
    if (url) {
      pages.set(url, (pages.get(url) || 0) + 1);
    }
  });

  return {
    timeseries: [...days.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, total]) => ({ day, total })),
    topPages: [...pages.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 10)
      .map(([url, pageSessions]) => ({ sessions: pageSessions, url })),
    totals: {
      active: items.filter(session => session?.status === 'active').length,
      avg_duration_s: items.length ? totalDuration / items.length : 0,
      avg_event_count: items.length ? totalEvents / items.length : 0,
      total: items.length
    }
  };
};

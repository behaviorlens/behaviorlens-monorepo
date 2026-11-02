export const VISITOR_CATEGORIES = Object.freeze([
  Object.freeze({ category: 'first_visits', color: '#ffb629', label: 'First visits' }),
  Object.freeze({ category: 'returnings', color: '#ff6100', label: 'Returning' }),
  Object.freeze({ category: 'organic', color: '#0099ff', label: 'Organic' }),
  Object.freeze({ category: 'referrals', color: '#0a1551', label: 'Referrals' })
]);

const validCategories = new Set(VISITOR_CATEGORIES.map(item => item.category));

// A visitor can carry both a traffic source (organic/referrals) and a visitor
// type (first_visits/returnings). Accept a string or an array of those keys.
export const getUserVisitorCategories = user => {
  const raw = user?.category;
  const values = Array.isArray(raw) ? raw : [raw];
  const unique = [];

  values.forEach(value => {
    if (validCategories.has(value) && !unique.includes(value)) {
      unique.push(value);
    }
  });

  return unique;
};

export const aggregateVisitors = (sessions, users) => {
  const categoriesByUsername = new Map();

  if (Array.isArray(users)) {
    users.forEach(user => {
      if (typeof user?.name !== 'string' || categoriesByUsername.has(user.name)) {
        return;
      }

      const categories = getUserVisitorCategories(user);
      if (categories.length > 0) {
        categoriesByUsername.set(user.name, categories);
      }
    });
  }

  const counts = new Map(VISITOR_CATEGORIES.map(item => [item.category, 0]));
  let total = 0;
  if (Array.isArray(sessions)) {
    sessions.forEach(session => {
      const categories = categoriesByUsername.get(session?.username);
      if (!categories) {
        return;
      }

      total += 1;
      categories.forEach(category => {
        counts.set(category, counts.get(category) + 1);
      });
    });
  }

  const membershipTotal = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return {
    categories: VISITOR_CATEGORIES.map(item => ({
      ...item,
      count: counts.get(item.category),
      percentage: membershipTotal > 0 ? (counts.get(item.category) / membershipTotal) * 100 : 0
    })),
    total
  };
};

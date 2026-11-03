import { listReviewUsers } from '../../services/BehaviorLensService';

let reviewerFilterOptions = [];
let reviewerFilterOptionsPromise = null;

const toReviewerFilterOptions = users => (
  (Array.isArray(users) ? users : []).map(user => ({
    label: user.name,
    value: user.username
  }))
);

export const getReviewerInitials = name => {
  const words = String(name || '').trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const firstInitial = Array.from(words[0])[0];
  if (words.length === 1) {
    return firstInitial.toLocaleUpperCase();
  }
  const lastInitial = Array.from(words.at(-1))[0];
  return `${firstInitial}${lastInitial}`.toLocaleUpperCase();
};

export const matchesReviewerDirectoryQuery = (user, query) => {
  const needle = String(query || '').trim().toLocaleLowerCase();
  if (!needle) {
    return true;
  }
  return [user?.name, user?.username, user?.email].some(value => (
    String(value || '').toLocaleLowerCase().includes(needle)
  ));
};

export const loadReviewerFilterOptions = () => {
  if (!reviewerFilterOptionsPromise) {
    reviewerFilterOptionsPromise = listReviewUsers()
      .then(users => {
        reviewerFilterOptions = toReviewerFilterOptions(users);
        return reviewerFilterOptions;
      })
      .catch(() => {
        reviewerFilterOptions = [];
        reviewerFilterOptionsPromise = null;
        return reviewerFilterOptions;
      });
  }
  return reviewerFilterOptionsPromise;
};

export const getReviewerFilterLabel = value => (
  reviewerFilterOptions.find(option => option.value === value)?.label || String(value || '')
);

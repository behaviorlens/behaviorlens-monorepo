// Planted usability defects, all off by default. Turn one on by opening any page
// with ?defect=<name> (several: ?defect=a,b). The choice lasts for the browser
// tab, so it survives navigation; ?defect=none clears it.
//
// Each defect has a known effect, which gives the evaluator golden set and the
// RQ2 study a ground truth to measure against.
export const DEFECTS = {
  'hidden-checkout': 'The cart\'s checkout button is low-contrast, small and placed below a long note, so it is easy to miss.',
  'silent-search': 'Search is case-sensitive and shows an empty page with no "no results" message.'
};

const STORAGE_KEY = 'demo-site:defects';

const readStored = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const store = list => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // Storage blocked: the flag then only applies to this page load.
  }
};

export const initDefects = (search = window.location.search) => {
  const param = new URLSearchParams(search).get('defect');
  let active = readStored();
  if (param !== null) {
    active = param === 'none'
      ? []
      : param.split(',').map(name => name.trim()).filter(name => name in DEFECTS);
    store(active);
  }
  window.__DEMO_SITE_DEFECTS__ = active;
  return active;
};

export const hasDefect = name => (window.__DEMO_SITE_DEFECTS__ || []).includes(name);

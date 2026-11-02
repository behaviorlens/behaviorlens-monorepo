// Returns window.localStorage, or null when it is unavailable (private mode,
// blocked site data, sandboxed iframes).
export const getLocalStorage = () => {
  try {
    const storage = window.localStorage;
    const probe = '__bl_storage_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch (error) {
    return null;
  }
};

export const getUrlParameter = (name, search = window.location.search) => (
  new URLSearchParams(search).get(name)
);

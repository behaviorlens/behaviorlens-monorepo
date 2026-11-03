// Shared default prop values. A default written inline (`items = []`,
// `onClose = () => {}`) creates a new value on every render, which re-runs any
// effect or memo that depends on it; these are created once, like the
// defaultProps they replace.
export const NOOP = () => {};
export const RETURN_NULL = () => null;
export const RETURN_FALSE = () => false;
export const EMPTY_ARRAY = [];
export const EMPTY_OBJECT = {};

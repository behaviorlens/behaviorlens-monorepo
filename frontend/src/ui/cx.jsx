// Joins class names, skipping falsy values.
export const cx = (...names) => names.filter(Boolean).join(' ');

// Renders an icon passed either as a component type or as an element.
export const renderIcon = (icon, props = {}) => {
  if (!icon) {
    return null;
  }
  if (typeof icon === 'function' || (typeof icon === 'object' && icon.$$typeof && !icon.props)) {
    const Icon = icon;
    return <Icon aria-hidden="true" {...props} />;
  }
  return icon;
};

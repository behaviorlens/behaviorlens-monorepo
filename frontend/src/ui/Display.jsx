import { forwardRef } from 'react';
import { Avatar as MantineAvatar } from '@mantine/core';
import { X } from 'lucide-react';
import { cx } from './cx';

const AVATAR_SIZE = {
  '4x-small': 16,
  '3x-small': 20,
  '2x-small': 24,
  'x-small': 32,
  small: 40,
  medium: 48
};

export const Avatar = forwardRef(function Avatar({
  className, img, initials, size = '2x-small', variant: _variant, ...rest
}, ref) {
  return (
    <MantineAvatar
      ref={ref}
      src={img || null}
      size={AVATAR_SIZE[size] || size}
      radius="xl"
      color="navy"
      className={cx('bl-avatar', className)}
      {...rest}
    >
      {initials}
    </MantineAvatar>
  );
});

// span.bl-tag > span (label) [+ button (close)]
export const Tag = forwardRef(function Tag({
  children, className, closable, colorStyle = 'gray', onClose, size = 'medium', ...rest
}, ref) {
  return (
    <span ref={ref} className={cx('bl-tag', className)} data-size={size} data-color={colorStyle} {...rest}>
      <span>{children}</span>
      {closable && (
        <button type="button" aria-label="Remove" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      )}
    </span>
  );
});

export const Tabs = forwardRef(function Tabs({ className, ...rest }, ref) {
  return <div ref={ref} role="tablist" className={cx('bl-tabs', className)} {...rest} />;
});

export const TabItem = forwardRef(function TabItem({
  activeTab, className, type = 'button', ...rest
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      role="tab"
      aria-selected={Boolean(activeTab)}
      tabIndex={activeTab ? 0 : -1}
      data-active={activeTab || undefined}
      className={cx('bl-tab-item', className)}
      {...rest}
    />
  );
});

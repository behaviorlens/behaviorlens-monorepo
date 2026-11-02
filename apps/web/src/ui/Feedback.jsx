import { forwardRef } from 'react';
import { Alert as MantineAlert, Loader as MantineLoader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { cx } from './cx';

const LOADER_SIZE = { small: 20, medium: 28, large: 40 };

const COLOR_BY_STYLE = {
  error: 'red',
  success: 'green',
  warning: 'orange',
  informative: 'brand',
  info: 'brand',
  primary: 'brand'
};

export const Loader = forwardRef(function Loader({ className, size = 'medium', ...rest }, ref) {
  return (
    <MantineLoader
      ref={ref}
      className={cx('bl-loader', className)}
      size={LOADER_SIZE[size] || size}
      color="brand"
      role="status"
      aria-label="Loading"
      {...rest}
    />
  );
});

export const Alert = forwardRef(function Alert({
  className, colorStyle = 'informative', compact, description, title, children, ...rest
}, ref) {
  return (
    <MantineAlert
      ref={ref}
      className={cx('bl-alert', className)}
      color={COLOR_BY_STYLE[colorStyle] || 'brand'}
      variant="light"
      title={title}
      p={compact ? 'xs' : 'sm'}
      {...rest}
    >
      {description}
      {children}
    </MantineAlert>
  );
});

// Magnet's Notification.show({ title, description, colorStyle }) on top of
// Mantine notifications. The <Notifications /> host is mounted once in main.jsx.
export const Notification = {
  show({
    title, description, message, colorStyle, autoClose, id
  } = {}) {
    return notifications.show({
      id,
      title,
      message: description ?? message ?? '',
      color: COLOR_BY_STYLE[colorStyle] || 'brand',
      autoClose: autoClose ?? 4000
    });
  },
  hide(id) {
    notifications.hide(id);
  }
};

// Kept so existing pages can stay unchanged; the single host lives in main.jsx.
export const NotificationContainer = () => null;

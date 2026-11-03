import { forwardRef } from 'react';
import { Button as MantineButton, Loader as MantineLoader, UnstyledButton as MantineUnstyledButton } from '@mantine/core';
import { cx, renderIcon } from './cx';

const SIZE_VARS = {
  small: { '--button-height': '32px', '--button-padding-x': '12px', '--button-fz': '14px' },
  medium: { '--button-height': '40px', '--button-padding-x': '16px', '--button-fz': '14px' },
  large: { '--button-height': '48px', '--button-padding-x': '20px', '--button-fz': '16px' }
};

const COLOR_BY_STYLE = {
  primary: 'brand',
  secondary: 'navy',
  error: 'red',
  success: 'green'
};

// Secondary outline is the dashboard's most common control: quiet gray border,
// navy text, white fill.
const SECONDARY_OUTLINE_VARS = {
  '--button-bg': '#ffffff',
  '--button-hover': '#f3f3fe',
  '--button-color': '#343c6a',
  '--button-bd': '1px solid #c7c9dc'
};

const mantineVariant = (variant, colorStyle) => {
  if (variant === 'outline') {
    return 'outline';
  }
  if (variant === 'ghost') {
    return 'subtle';
  }
  return colorStyle === 'secondary' ? 'light' : 'filled';
};

/**
 * Magnet-compatible Button: colorStyle (primary | secondary | error),
 * variant (filled | outline | ghost), size (small | medium | large),
 * startIcon / endIcon (icon components), loader + loaderText, as / to.
 */
export const Button = forwardRef(function Button({
  as,
  children,
  className,
  colorStyle = 'primary',
  disabled,
  endIcon,
  fullWidth,
  loader,
  loaderText,
  size = 'medium',
  startIcon,
  style,
  theme: _theme,
  type = 'button',
  variant = 'filled',
  ...rest
}, ref) {
  const vars = {
    ...(SIZE_VARS[size] || SIZE_VARS.medium),
    ...(colorStyle === 'secondary' && variant === 'outline' ? SECONDARY_OUTLINE_VARS : {})
  };
  const leftSection = loader
    ? <MantineLoader size={14} color="currentColor" aria-hidden="true" />
    : renderIcon(startIcon);

  return (
    <MantineButton
      ref={ref}
      component={as}
      type={as ? undefined : type}
      className={cx('bl-button', className)}
      color={COLOR_BY_STYLE[colorStyle] || 'brand'}
      variant={mantineVariant(variant, colorStyle)}
      disabled={disabled || loader}
      data-loading={loader || undefined}
      fullWidth={fullWidth}
      leftSection={leftSection}
      rightSection={renderIcon(endIcon)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {loader && loaderText ? loaderText : children}
    </MantineButton>
  );
});

// A bare <button type="button"> with no visual styling of its own.
export const UnstyledButton = forwardRef(function UnstyledButton({ className, type = 'button', ...rest }, ref) {
  return (
    <MantineUnstyledButton
      ref={ref}
      type={type}
      className={cx('bl-unstyled-button', className)}
      {...rest}
    />
  );
});

export const Link = forwardRef(function Link({ className, ...rest }, ref) {
  return <a ref={ref} className={cx('bl-link', className)} {...rest} />;
});

import {
  cloneElement, createContext, forwardRef, isValidElement, useCallback, useContext, useState
} from 'react';
import { Modal as MantineModal, Popover, Tooltip as MantineTooltip } from '@mantine/core';
import { X } from 'lucide-react';
import { cx, renderIcon } from './cx';

/* ------------------------------------------------------------------ Tooltip */

// Magnet's Tooltip renders its own trigger element (`as`, default <span>) and
// shows `title` on hover/focus. open={false} disables it.
export const Tooltip = forwardRef(function Tooltip({
  as: Component = 'span',
  children,
  open,
  placement = 'top',
  title,
  tooltipStyle,
  usePortal: _usePortal,
  ...rest
}, ref) {
  const trigger = <Component ref={ref} {...rest}>{children}</Component>;
  if (!title) {
    return trigger;
  }
  return (
    <MantineTooltip
      label={title}
      position={placement}
      disabled={open === false}
      opened={open === true ? true : undefined}
      withinPortal
      multiline
      openDelay={150}
      zIndex={1000}
      classNames={{ tooltip: 'bl-tooltip' }}
      styles={tooltipStyle ? { tooltip: tooltipStyle } : undefined}
    >
      {trigger}
    </MantineTooltip>
  );
});

/* ------------------------------------------------------------- Modal/Dialog */

const ModalContext = createContext({ onClose: undefined });

const MODAL_WIDTH = { small: 480, medium: 600, large: 800 };

export const Modal = function Modal({
  ariaLabel, children, className, onClose, open, size = 'medium', zIndex
}) {
  return (
    <ModalContext.Provider value={{ onClose }}>
      <MantineModal.Root
        opened={Boolean(open)}
        onClose={onClose || (() => {})}
        size={MODAL_WIDTH[size] || size}
        centered
        zIndex={zIndex}
      >
        <MantineModal.Overlay />
        <MantineModal.Content aria-label={ariaLabel} className={cx('bl-modal', className)}>
          <MantineModal.Body p={0}>{children}</MantineModal.Body>
        </MantineModal.Content>
      </MantineModal.Root>
    </ModalContext.Provider>
  );
};

export const ModalHeader = function ModalHeader({
  className, closeButtonVisible, description, title
}) {
  const { onClose } = useContext(ModalContext);
  return (
    <div className={cx('bl-modal-header', className)}>
      <div>
        {title && <h2 className="bl-modal-title">{title}</h2>}
        {description && <p className="bl-modal-description">{description}</p>}
      </div>
      {closeButtonVisible && onClose && (
        <button type="button" className="bl-modal-close" aria-label="Close" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export const ModalBody = forwardRef(function ModalBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('bl-modal-body', className)} {...rest} />;
});

export const ModalActions = forwardRef(function ModalActions({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('bl-modal-actions', className)} {...rest} />;
});

export const Dialog = function Dialog({ ariaLabel, children, className, onClose, open, zIndex }) {
  return (
    <Modal ariaLabel={ariaLabel} className={cx('bl-dialog', className)} onClose={onClose} open={open} size="small" zIndex={zIndex}>
      {children}
    </Modal>
  );
};

const part = (name, Tag = 'div') => forwardRef(function DialogPart({ className, ...rest }, ref) {
  return <Tag ref={ref} className={cx(name, className)} {...rest} />;
});

export const DialogBody = part('bl-dialog-body');
export const DialogContent = part('bl-dialog-content');
export const DialogActions = part('bl-dialog-actions');
export const DialogFooter = part('bl-dialog-footer');
export const DialogTitle = part('bl-dialog-title', 'h2');
export const DialogDescription = part('bl-dialog-description', 'p');

export const DialogIcon = function DialogIcon({ colorStyle = 'informative', icon }) {
  return (
    <span className="bl-dialog-icon" data-color={colorStyle}>
      {renderIcon(icon)}
    </span>
  );
};

export const DialogCloseButton = forwardRef(function DialogCloseButton({ className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label="Close" className={cx('bl-dialog-close', className)} {...rest}>
      <X aria-hidden="true" />
    </button>
  );
});

/* --------------------------------------------------------------------- Menu */

const MenuContext = createContext({ close: () => {} });

// triggerElement(isOpen) returns the trigger; open/setOpen make it controlled.
export const Menu = function Menu({
  children, className, open, placement = 'bottom-start', setOpen, theme: _theme, triggerElement, zIndex = 300
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? Boolean(open) : innerOpen;
  const change = useCallback(next => {
    if (!controlled) {
      setInnerOpen(next);
    }
    setOpen?.(next);
  }, [controlled, setOpen]);

  const trigger = typeof triggerElement === 'function' ? triggerElement(isOpen) : triggerElement;
  // The popover anchors on the trigger element itself, which must forward its ref.
  const anchoredTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
      onClick: event => {
        trigger.props.onClick?.(event);
        change(!isOpen);
      }
    })
    : <button type="button" onClick={() => change(!isOpen)}>{trigger}</button>;

  // Rendered in a portal; className (from styled(Menu)) lands on the popover.
  return (
    <MenuContext.Provider value={{ close: () => change(false) }}>
      <Popover
        opened={isOpen}
        onChange={change}
        position={placement}
        withinPortal
        shadow="md"
        zIndex={zIndex}
        offset={4}
      >
        <Popover.Target>{anchoredTrigger}</Popover.Target>
        <Popover.Dropdown className={cx('bl-menu', className)} p={0}>
          {children}
        </Popover.Dropdown>
      </Popover>
    </MenuContext.Provider>
  );
};

export const MenuList = forwardRef(function MenuList({ className, ...rest }, ref) {
  return <div ref={ref} role="menu" className={cx('bl-menu-list', className)} {...rest} />;
});

export const MenuItem = forwardRef(function MenuItem({ className, ...rest }, ref) {
  return <div ref={ref} role="none" className={cx('bl-menu-item', className)} {...rest} />;
});

export const MenuItemButton = forwardRef(function MenuItemButton({
  className, closeMenuOnClick, colorStyle, onClick, type = 'button', ...rest
}, ref) {
  const { close } = useContext(MenuContext);
  return (
    <button
      ref={ref}
      type={type}
      role="menuitem"
      className={cx('bl-menu-item-button', className)}
      data-color={colorStyle}
      onClick={event => {
        onClick?.(event);
        if (closeMenuOnClick) {
          close();
        }
      }}
      {...rest}
    />
  );
});

export const MenuItemTitle = forwardRef(function MenuItemTitle({ className, ...rest }, ref) {
  return <span ref={ref} className={cx('bl-menu-item-title', className)} {...rest} />;
});

export const MenuItemIcon = function MenuItemIcon({ icon }) {
  return <span className="bl-menu-item-icon">{renderIcon(icon)}</span>;
};

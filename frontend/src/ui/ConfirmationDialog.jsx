import React from 'react';

import {
  bool, elementType, func, node, object, string
} from 'prop-types';

import { Button } from './Button';
import {
  Dialog, DialogActions, DialogBody, DialogCloseButton, DialogContent,
  DialogDescription, DialogFooter, DialogIcon, DialogTitle
} from './Overlay';
import { EMPTY_OBJECT, NOOP } from '../lib/propDefaults';

// A confirm/cancel dialog built from the Overlay parts; generic, no dashboard knowledge.
const ConfirmationDialog = props => {
  const {
    cancelButtonProps = EMPTY_OBJECT,
    cancelText = 'Cancel',
    closeButtonProps = EMPTY_OBJECT,
    confirmButtonProps = EMPTY_OBJECT,
    confirmLoadingText = '',
    confirmText = 'Confirm',
    content = null,
    description = null,
    footer = null,
    icon = null,
    iconColorStyle = 'informative',
    isConfirming = false,
    isOpen = false,
    onCancel = NOOP,
    onConfirm = NOOP,
    showCloseButton = true,
    title,
    ...dialogProps
  } = props;

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    if (isConfirming) {
      return;
    }

    onCancel();
  };

  const ariaLabel = dialogProps.ariaLabel || (typeof title === 'string' ? title : 'Confirmation dialog');

  return (
    <Dialog
      {...dialogProps}
      open
      ariaLabel={ariaLabel}
      onClose={handleCancel}
    >
      <DialogBody>
        {icon && (
          <DialogIcon
            colorStyle={iconColorStyle}
            icon={icon}
          />
        )}
        <DialogTitle>
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription>
            {description}
          </DialogDescription>
        )}
        {content && (
          <DialogContent className='text-center'>
            {content}
          </DialogContent>
        )}
      </DialogBody>
      <DialogActions>
        <Button
          colorStyle='secondary'
          variant='outline'
          {...cancelButtonProps}
          disabled={isConfirming || cancelButtonProps.disabled}
          onClick={handleCancel}
        >
          {cancelText}
        </Button>
        <Button
          colorStyle='primary'
          variant='filled'
          {...confirmButtonProps}
          loader={isConfirming}
          loaderText={confirmLoadingText}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </DialogActions>
      {footer && (
        <DialogFooter className='text-center'>
          {footer}
        </DialogFooter>
      )}
      {showCloseButton && (
        <DialogCloseButton
          {...closeButtonProps}
          onClick={handleCancel}
        />
      )}
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  cancelButtonProps: object,
  cancelText: node,
  closeButtonProps: object,
  confirmButtonProps: object,
  confirmLoadingText: string,
  confirmText: node,
  content: node,
  description: node,
  footer: node,
  icon: elementType,
  iconColorStyle: string,
  isConfirming: bool,
  isOpen: bool,
  onCancel: func,
  onConfirm: func,
  showCloseButton: bool,
  title: node.isRequired
};

export default ConfirmationDialog;

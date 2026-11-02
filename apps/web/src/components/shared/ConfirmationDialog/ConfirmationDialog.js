import React from 'react';

import {
  bool, elementType, func, node, object, string
} from 'prop-types';

import {
  Button, Dialog, DialogActions, DialogBody, DialogCloseButton, DialogContent,
  DialogDescription, DialogFooter, DialogIcon, DialogTitle
} from '../../../ui';

const ConfirmationDialog = props => {
  const {
    cancelButtonProps = {},
    cancelText = 'Cancel',
    closeButtonProps = {},
    confirmButtonProps = {},
    confirmLoadingText = '',
    confirmText = 'Confirm',
    content = null,
    description = null,
    footer = null,
    icon = null,
    iconColorStyle = 'informative',
    isConfirming = false,
    isOpen = false,
    onCancel = () => { },
    onConfirm = () => { },
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

ConfirmationDialog.defaultProps = {
  cancelButtonProps: {},
  cancelText: 'Cancel',
  closeButtonProps: {},
  confirmButtonProps: {},
  confirmLoadingText: '',
  confirmText: 'Confirm',
  content: null,
  description: null,
  footer: null,
  icon: null,
  iconColorStyle: 'informative',
  isConfirming: false,
  isOpen: false,
  onCancel: () => { },
  onConfirm: () => { },
  showCloseButton: true
};

export default ConfirmationDialog;

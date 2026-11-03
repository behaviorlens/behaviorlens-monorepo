// The edit/delete overflow menu on a note or reply.
import React from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  MenuItemButton,
  MenuItemIcon,
  MenuItemTitle,
  MenuList
} from '../../ui';
import {
  IconEllipsisVertical,
  IconPencilLineFilled,
  IconTrashFilled
} from '../../ui/icons';
import {
  CommentMenu,
  OverflowMenuTrigger
} from './ScBehaviorLensSessionNotesThread';

const CommentActionsMenu = ({
  activeMenuId = null,
  deleteLabel = 'Delete',
  editLabel = 'Edit',
  label,
  menuId,
  onActiveMenuChange,
  onDelete,
  onEdit,
  rail = false
}) => (
  <CommentMenu
    $rail={rail}
    open={activeMenuId === menuId}
    placement="bottom-end"
    setOpen={open => onActiveMenuChange(open ? menuId : null)}
    theme="light"
    triggerElement={isOpen => (
      <OverflowMenuTrigger
        $rail={rail}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        data-comment-actions-menu-id={menuId}
      >
        <IconEllipsisVertical aria-hidden="true" />
      </OverflowMenuTrigger>
    )}
  >
    <MenuList>
      <MenuItem>
        <MenuItemButton type="button" closeMenuOnClick onClick={onEdit}>
          {rail && <MenuItemIcon icon={IconPencilLineFilled} />}
          <MenuItemTitle>{editLabel}</MenuItemTitle>
        </MenuItemButton>
      </MenuItem>
      <MenuItem>
        <MenuItemButton
          type="button" colorStyle="error" closeMenuOnClick
          onClick={onDelete}
        >
          {rail && <MenuItemIcon icon={IconTrashFilled} />}
          <MenuItemTitle>{deleteLabel}</MenuItemTitle>
        </MenuItemButton>
      </MenuItem>
    </MenuList>
  </CommentMenu>
);

CommentActionsMenu.propTypes = {
  activeMenuId: PropTypes.string,
  deleteLabel: PropTypes.string,
  editLabel: PropTypes.string,
  label: PropTypes.string.isRequired,
  menuId: PropTypes.string.isRequired,
  onActiveMenuChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  rail: PropTypes.bool
};

export default CommentActionsMenu;

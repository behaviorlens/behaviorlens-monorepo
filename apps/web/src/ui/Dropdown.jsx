import {
  Children, cloneElement, forwardRef, isValidElement, useMemo, useState
} from 'react';
import { Loader as MantineLoader, Popover } from '@mantine/core';
import { Check, ChevronDown, X } from 'lucide-react';
import { cx } from './cx';
import { useFormControl } from './Form';

// Declarative option marker; <Dropdown> reads its props and renders the rows.
export const DropdownOption = () => null;
DropdownOption.displayName = 'DropdownOption';

const textOf = node => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join('');
  }
  if (isValidElement(node)) {
    return textOf(node.props.children);
  }
  return '';
};

const toOptions = (children, optionsProp) => {
  if (optionsProp) {
    return optionsProp
      .filter(option => !option.isGroup)
      .map(option => ({ value: option.value, label: option.text ?? option.label ?? String(option.value), props: {} }));
  }
  return Children.toArray(children)
    .filter(isValidElement)
    .map(element => ({
      value: element.props.value,
      label: element.props.children ?? element.props.text ?? String(element.props.value),
      props: element.props
    }));
};

const asArray = value => {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return value === undefined || value === null || value === '' ? [] : [String(value)];
};

/**
 * Magnet-compatible select. Trigger: div.bl-dropdown > span.bl-dropdown-value +
 * span.bl-dropdown-arrow (or a customTrigger). List: div.bl-dropdown-list in a portal.
 * Supports multiple, searchable (+ onSearch for server-side filtering), loader,
 * customTrigger(selected), forceWidth, placement, zIndex and style (applied to the list).
 */
export const Dropdown = forwardRef(function Dropdown({
  children,
  className,
  customTrigger,
  disabled,
  forceWidth,
  hideArrowIcon,
  id,
  loader,
  multiple,
  noResultFoundText = 'No results found',
  onChange,
  onOpenChange,
  onSearch,
  options: optionsProp,
  placeholder,
  placement = 'bottom-start',
  readOnly,
  searchable,
  size = 'medium',
  style,
  value,
  zIndex = 300,
  // Magnet-era options with no equivalent here; dropped so they never reach the DOM.
  colorStyle: _colorStyle,
  defaultIcon: _defaultIcon,
  expand: _expand,
  ghost: _ghost,
  hasMore: _hasMore,
  loadingMore: _loadingMore,
  onLoadMore: _onLoadMore,
  placeholderIcon: _placeholderIcon,
  rounded: _rounded,
  showCountOnly: _showCountOnly,
  showLockIconInReadOnly: _showLockIconInReadOnly,
  showOptionIconsForMultiple: _showOptionIconsForMultiple,
  showSelectAll: _showSelectAll,
  theme: _theme,
  themeClasses: _themeClasses,
  useAsSelect: _useAsSelect,
  ...rest
}, ref) {
  const control = useFormControl();
  const triggerId = id || control?.id;
  const [opened, setOpened] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(-1);
  const [targetWidth, setTargetWidth] = useState(0);

  const options = useMemo(() => toOptions(children, optionsProp), [children, optionsProp]);
  const selectedValues = asArray(value);
  const isSelected = option => (multiple
    ? selectedValues.includes(String(option.value))
    : selectedValues[0] === String(option.value));
  const selectedOptions = options.filter(isSelected);
  const selectedOption = multiple ? null : (selectedOptions[0] || null);
  const visibleOptions = searchable && !onSearch && term
    ? options.filter(option => textOf(option.label).toLowerCase().includes(term.toLowerCase()))
    : options;

  const setOpen = (next, anchor) => {
    if (next && (disabled || readOnly)) {
      return;
    }
    if (next && anchor) {
      setTargetWidth(anchor.getBoundingClientRect().width);
    }
    setOpened(next);
    if (!next) {
      setTerm('');
      setActive(-1);
    }
    onOpenChange?.(next);
  };

  const choose = option => {
    if (multiple) {
      const key = String(option.value);
      const next = selectedValues.includes(key)
        ? selectedValues.filter(item => item !== key)
        : [...selectedValues, key];
      onChange?.(options.filter(item => next.includes(String(item.value))).map(item => item.value));
      return;
    }
    onChange?.(option.value);
    setOpen(false);
  };

  const onListKey = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(index => Math.min(visibleOptions.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(index => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && visibleOptions[active]) {
      event.preventDefault();
      choose(visibleOptions[active]);
    }
  };

  const onTriggerKey = event => {
    if (!opened && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      setOpen(true, event.currentTarget);
    } else if (opened) {
      onListKey(event);
    }
  };

  const toggle = event => setOpen(!opened, event.currentTarget);

  let trigger;
  if (customTrigger) {
    const element = typeof customTrigger === 'function'
      ? customTrigger(multiple ? selectedOptions : selectedOption)
      : customTrigger;
    trigger = cloneElement(element, {
      id: element.props.id ?? triggerId,
      disabled: disabled || element.props.disabled,
      'aria-haspopup': 'listbox',
      'aria-expanded': opened,
      onClick: event => {
        element.props.onClick?.(event);
        toggle(event);
      },
      onKeyDown: event => {
        element.props.onKeyDown?.(event);
        if (opened) {
          onListKey(event);
        }
      }
    });
  } else {
    const empty = multiple ? !selectedOptions.length : !selectedOption;
    trigger = (
      <div
        ref={ref}
        id={triggerId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={opened}
        aria-disabled={disabled || undefined}
        className={cx('bl-dropdown', className)}
        data-size={size}
        data-disabled={disabled || undefined}
        data-placeholder={empty || undefined}
        onClick={toggle}
        onKeyDown={onTriggerKey}
        {...rest}
      >
        <span className="bl-dropdown-value">
          {multiple && !empty && selectedOptions.map(option => (
            <span key={String(option.value)} data-dropdown-tag="">
              <span className="bl-tag" data-size="small">
                <span>{option.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${textOf(option.label)}`}
                  onClick={event => {
                    event.stopPropagation();
                    choose(option);
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            </span>
          ))}
          {!multiple && !empty && selectedOption.label}
          {empty && <span className="bl-dropdown-placeholder">{placeholder}</span>}
        </span>
        {!hideArrowIcon && (
          <span className="bl-dropdown-arrow" aria-hidden="true"><ChevronDown /></span>
        )}
      </div>
    );
  }

  return (
    <Popover
      opened={opened}
      onChange={next => setOpen(next)}
      position={placement}
      width={forceWidth ? 'target' : undefined}
      withinPortal
      zIndex={zIndex}
      shadow="md"
      offset={4}
      trapFocus={false}
    >
      <Popover.Target>{trigger}</Popover.Target>
      <Popover.Dropdown
        className="bl-dropdown-list"
        p={0}
        style={{ minWidth: Math.max(160, targetWidth), ...style }}
        onKeyDown={onListKey}
      >
        {searchable && (
          <div className="bl-dropdown-search">
            <input
              autoFocus
              type="search"
              aria-label={typeof searchable === 'string' ? searchable : 'Search'}
              placeholder={typeof searchable === 'string' ? searchable : 'Search'}
              value={term}
              onChange={event => {
                setTerm(event.target.value);
                setActive(-1);
                onSearch?.(event.target.value);
              }}
            />
          </div>
        )}
        <div role="listbox" aria-multiselectable={multiple || undefined} className="bl-dropdown-options">
          {loader && (
            <div className="bl-dropdown-status"><MantineLoader size={18} color="brand" /></div>
          )}
          {!loader && visibleOptions.length === 0 && (
            <div className="bl-dropdown-status">{noResultFoundText}</div>
          )}
          {!loader && visibleOptions.map((option, index) => (
            <div
              key={String(option.value)}
              role="option"
              aria-selected={isSelected(option)}
              data-active={index === active || undefined}
              className={cx('bl-dropdown-option', option.props.className)}
              style={option.props.style}
              onMouseEnter={() => setActive(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span className="bl-dropdown-option-label">{option.label}</span>
              {isSelected(option) && <Check className="bl-dropdown-option-check" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
});

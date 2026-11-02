import { createContext, forwardRef, useContext } from 'react';
import {
  Checkbox as MantineCheckbox,
  SegmentedControl as MantineSegmentedControl,
  Switch as MantineSwitch,
  TextInput as MantineTextInput
} from '@mantine/core';
import { cx } from './cx';

const FormControlContext = createContext(null);

export const useFormControl = () => useContext(FormControlContext);

// Groups a label, a field and helper text; children pick up the id from context.
export const FormControl = forwardRef(function FormControl({
  children, className, colorStyle, id, required, ...rest
}, ref) {
  return (
    <FormControlContext.Provider value={{ id, colorStyle, required }}>
      <div ref={ref} className={cx('bl-form-control', className)} data-color={colorStyle} {...rest}>
        {children}
      </div>
    </FormControlContext.Provider>
  );
});

export const FormLabel = forwardRef(function FormLabel({ className, htmlFor, ...rest }, ref) {
  const control = useFormControl();
  return (
    <label
      ref={ref}
      className={cx('bl-label', className)}
      htmlFor={htmlFor || control?.id}
      {...rest}
    />
  );
});

export const FormHelperText = forwardRef(function FormHelperText({ className, id, ...rest }, ref) {
  const control = useFormControl();
  return (
    <p
      ref={ref}
      className={cx('bl-form-helper-text', className)}
      id={id || (control?.id ? `${control.id}-helper` : undefined)}
      {...rest}
    />
  );
});

export const InputText = forwardRef(function InputText({ className, id, size, ...rest }, ref) {
  const control = useFormControl();
  return (
    <MantineTextInput
      ref={ref}
      id={id || control?.id}
      required={control?.required}
      size={size === 'small' ? 'xs' : 'sm'}
      classNames={{ root: cx('bl-input-container', className), input: 'bl-input' }}
      {...rest}
    />
  );
});

// Plain number <input>: callers read event.target.value and style the box itself.
export const InputNumber = forwardRef(function InputNumber({
  className, ghost: _ghost, hideStepButtons: _hide, id, rounded: _rounded, size: _size, type = 'number', ...rest
}, ref) {
  const control = useFormControl();
  return (
    <input
      ref={ref}
      type={type}
      id={id || control?.id}
      className={cx('bl-input', 'bl-input-number', className)}
      {...rest}
    />
  );
});

export const UnstyledInput = forwardRef(function UnstyledInput({ className, ...rest }, ref) {
  return <input ref={ref} className={cx('bl-unstyled-input', className)} {...rest} />;
});

// Container plus <textarea>. The ref and every field prop go to the <textarea>;
// className and style go to the container so existing overrides keep working.
export const Textarea = forwardRef(function Textarea({
  className, id, resize = 'vertical', style, ...rest
}, ref) {
  const control = useFormControl();
  return (
    <div className={cx('bl-textarea-container', className)} style={style}>
      <textarea
        ref={ref}
        id={id || control?.id}
        className="bl-textarea"
        style={{ resize }}
        {...rest}
      />
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox({ className, size, ...rest }, ref) {
  return (
    <MantineCheckbox
      ref={ref}
      className={cx('bl-checkbox', className)}
      size={size === 'small' ? 'xs' : 'sm'}
      {...rest}
    />
  );
});

export const Toggle = forwardRef(function Toggle({ className, size, ...rest }, ref) {
  return (
    <MantineSwitch
      ref={ref}
      className={cx('bl-toggle', className)}
      size={size === 'small' ? 'xs' : 'sm'}
      {...rest}
    />
  );
});

// options: [{ id, value, text }], selected: value, onChange(value)
export const SegmentedControl = forwardRef(function SegmentedControl({
  className, name, onChange, options = [], selected, size, ...rest
}, ref) {
  return (
    <MantineSegmentedControl
      ref={ref}
      name={name}
      className={cx('bl-segmented-control', className)}
      size={size === 'small' ? 'xs' : 'sm'}
      data={options.map(option => ({ value: String(option.value), label: option.text ?? option.label }))}
      value={selected === undefined || selected === null ? undefined : String(selected)}
      onChange={next => {
        const match = options.find(option => String(option.value) === next);
        onChange?.(match ? match.value : next);
      }}
      {...rest}
    />
  );
});

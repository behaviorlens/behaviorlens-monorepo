import {
  act, cleanup, fireEvent, render, screen
} from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  afterEach, beforeAll, describe, expect, it, vi
} from 'vitest';
import {
  Button, Dropdown, DropdownOption, Menu, MenuItem, MenuItemButton, MenuItemTitle, MenuList, Textarea
} from './index';
import { theme } from './theme';

// env="test" turns off Mantine transitions and portals so popovers render synchronously.
const renderUi = node => render(<MantineProvider theme={theme} env="test">{node}</MantineProvider>);

beforeAll(() => {
  // Mantine reads these browser APIs, which jsdom does not provide.
  window.matchMedia ||= () => ({
    matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}
  });
  window.ResizeObserver ||= class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
});

afterEach(cleanup);

describe('Button', () => {
  it('keeps the bl-button hook and shows loaderText while loading', () => {
    renderUi(<Button loader loaderText="Saving...">Save</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bl-button');
    expect(button).toHaveProperty('disabled', true);
    expect(button.textContent).toContain('Saving...');
  });
});

describe('Dropdown', () => {
  it('shows the selected label and reports the chosen value', () => {
    const onChange = vi.fn();
    renderUi(
      <Dropdown value="1" onChange={onChange} aria-label="Speed">
        <DropdownOption value="1">1x</DropdownOption>
        <DropdownOption value="2">2x</DropdownOption>
      </Dropdown>
    );
    const trigger = screen.getByRole('combobox', { name: 'Speed' });
    expect(trigger.textContent).toContain('1x');
    act(() => {
      fireEvent.click(trigger);
    });
    fireEvent.click(screen.getByRole('option', { name: '2x' }));
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('returns every selected value in multiple mode', () => {
    const onChange = vi.fn();
    renderUi(
      <Dropdown multiple value={['a']} onChange={onChange} aria-label="Tags">
        <DropdownOption value="a">Alpha</DropdownOption>
        <DropdownOption value="b">Beta</DropdownOption>
      </Dropdown>
    );
    act(() => {
      fireEvent.click(screen.getByRole('combobox', { name: 'Tags' }));
    });
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });
});

describe('Menu', () => {
  it('runs the item action and closes when closeMenuOnClick is set', () => {
    const onEdit = vi.fn();
    const setOpen = vi.fn();
    renderUi(
      <Menu open setOpen={setOpen} triggerElement={() => <button type="button">More</button>}>
        <MenuList>
          <MenuItem>
            <MenuItemButton closeMenuOnClick onClick={onEdit}>
              <MenuItemTitle>Edit</MenuItemTitle>
            </MenuItemButton>
          </MenuItem>
        </MenuList>
      </Menu>
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});

describe('Textarea', () => {
  it('forwards the ref and field props to the textarea', () => {
    const ref = { current: null };
    renderUi(<Textarea ref={ref} aria-label="Note" defaultValue="hello" className="custom" />);
    const field = screen.getByRole('textbox', { name: 'Note' });
    expect(ref.current).toBe(field);
    expect(field.parentElement.className).toContain('custom');
  });
});

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { useFocusTrap } from './useFocusTrap';

function TrapWrapper({ isActive }: { isActive: boolean }) {
  const ref = useFocusTrap(isActive);
  return createElement(
    'div',
    { ref },
    createElement('button', null, 'First'),
    createElement('button', null, 'Second'),
    createElement('button', null, 'Third'),
  );
}

describe('useFocusTrap', () => {
  it('focuses first element when activated', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('traps Tab from last element back to first', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    const last = buttons[buttons.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last.closest('div')!, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('traps Shift+Tab from first element to last', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(buttons[0].closest('div')!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('does not trap Tab when focus is not on last element', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    // Focus middle button, Tab should not cycle
    buttons[1].focus();
    fireEvent.keyDown(buttons[1].closest('div')!, { key: 'Tab' });
    // Focus stays on middle (no preventDefault or re-focus by our handler)
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('does not trap Shift+Tab when focus is not on first element', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    buttons[1].focus();
    fireEvent.keyDown(buttons[1].closest('div')!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ignores non-Tab keys', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: true }));
    const buttons = getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(buttons[0].closest('div')!, { key: 'Escape' });
    // Focus should remain unchanged
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('does nothing when isActive is false', () => {
    const { getAllByRole } = render(createElement(TrapWrapper, { isActive: false }));
    const buttons = getAllByRole('button');
    // With isActive=false, first element should NOT be auto-focused
    expect(document.activeElement).not.toBe(buttons[0]);
    // Keydown events should not cause any cycling
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(buttons[buttons.length - 1].closest('div')!, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });
});

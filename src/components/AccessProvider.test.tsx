import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessProvider, useFullAccess } from './AccessProvider';

function Probe() {
  return <span>{useFullAccess() ? 'full' : 'free'}</span>;
}

describe('AccessProvider', () => {
  it('defaults to full access when no provider is present', () => {
    render(<Probe />);
    expect(screen.getByText('full')).toBeTruthy();
  });

  it('reports free access when the provider says so', () => {
    render(<AccessProvider value={false}><Probe /></AccessProvider>);
    expect(screen.getByText('free')).toBeTruthy();
  });

  it('reports full access when the provider says so', () => {
    render(<AccessProvider value={true}><Probe /></AccessProvider>);
    expect(screen.getByText('full')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HomePage from './HomePage';

vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('@repo/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('HomePage', () => {
  it('renders home page with headers and buttons', () => {
    render(<HomePage />);

    expect(screen.getByText('Enterprise Communication at Scale')).toBeDefined();
    expect(screen.getByText('Explore V3 API')).toBeDefined();
    expect(screen.getByText('User Guides')).toBeDefined();
  });
});

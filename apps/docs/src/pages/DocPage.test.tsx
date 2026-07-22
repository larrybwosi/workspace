// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DocPage from './DocPage';

vi.mock('react-router', () => ({
  useParams: () => ({ slug: 'sending-messages' }),
  Navigate: () => <div>Navigate Mock</div>,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({
  default: {},
}));

vi.mock('@/components/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

vi.mock('@repo/ui', () => ({
  SyntaxHighlighter: ({ code }: any) => <pre>{code}</pre>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  cn: (...args: any[]) => args.join(' '),
}));

describe('DocPage', () => {
  it('renders doc page states correctly', () => {
    render(<DocPage type="user-guide" />);
    expect(screen.getByText(/Loading...|Page not found/)).toBeDefined();
  });
});

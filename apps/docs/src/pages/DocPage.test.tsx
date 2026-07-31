// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DocPage from './DocPage';

let mockSlug = 'sending-messages';

vi.mock('react-router', () => ({
  useParams: () => ({ slug: mockSlug }),
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
  SyntaxHighlighter: ({ code }: any) => <pre data-testid="syntax-highlighter">{code}</pre>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Badge: ({ children, className }: any) => <span className={`badge ${className || ''}`}>{children}</span>,
  Card: ({ children }: any) => <div className="card">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  Tabs: ({ children }: any) => <div className="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div className="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: any) => <button className="tabs-trigger">{children}</button>,
  TabsContent: ({ children }: any) => <div className="tabs-content">{children}</div>,
  cn: (...args: any[]) => args.join(' '),
}));

describe('DocPage', () => {
  beforeEach(() => {
    mockSlug = 'sending-messages';
  });

  it('renders loading or page states for markdown user-guide', async () => {
    mockSlug = 'joining-workspace';
    render(<DocPage type="user-guide" />);
    // Since markdown fetching is asynchronous via dynamic imports, it starts with Loading...
    expect(screen.getByText(/Loading...|Page not found/)).toBeDefined();
  });

  it('renders dynamic endpoint details for mapped api-reference routes', async () => {
    mockSlug = 'workspaces';
    render(<DocPage type="api-reference" />);

    // Since it's a mapped api-reference route, it immediately renders without Loading state
    // Let's assert that elements for dynamic rendering are shown:
    // e.g. "Workspaces" as header title, and the dynamic help description
    expect(screen.getByText(/Dynamically generated reference documentation/i)).toBeDefined();
    expect(screen.getAllByText(/V3 Workspaces/)[0]).toBeDefined();

    // Check that some workspace operations and paths render correctly
    expect(screen.getAllByText(/GET/)[0]).toBeDefined();
    expect(screen.getAllByText(/\/api\/v3\/workspaces/)[0]).toBeDefined();

    // Check that we have tabs and SDK generation snippets
    expect(screen.getAllByText(/React Hook/)[0]).toBeDefined();
    expect(screen.getAllByText(/Node Client/)[0]).toBeDefined();
  });
});

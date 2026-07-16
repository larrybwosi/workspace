// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoginPage } from './login';

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  signIn: {
    email: vi.fn(),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock @repo/ui components to avoid resolving issues
vi.mock('@repo/ui/components/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@repo/ui/components/input', () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock('@repo/ui/components/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));
vi.mock('@repo/ui/components/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@repo/ui/components/separator', () => ({
  Separator: () => <hr />,
}));

describe('LoginPage', () => {
  it('renders login page with title and inputs', () => {
    render(<LoginPage />);

    expect(screen.getByText('Admin Portal')).toBeDefined();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter your password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Access Dashboard' })).toBeDefined();
  });
});

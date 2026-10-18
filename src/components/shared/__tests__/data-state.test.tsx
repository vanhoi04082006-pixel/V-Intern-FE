import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/auth/api-client';
import { ErrorState } from '../data-state';
describe('safe validation feedback', () => {
  it('shows bounded DTO field feedback for a validation error', () => {
    render(<ErrorState title="Không thể lưu" error={new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', ['prompt must be longer than 10 characters', { private: 'ignored' }])} />);
    expect(screen.getByText('Không thể lưu')).toBeInTheDocument();
    expect(screen.getByText('prompt must be longer than 10 characters')).toBeInTheDocument();
    expect(screen.queryByText('ignored')).toBeNull();
  });
  it('does not display internal error details', () => {
    render(<ErrorState error={new ApiError(500, 'INTERNAL_ERROR', 'Internal', ['private-server-marker'])} />);
    expect(screen.getByRole('alert')).not.toHaveTextContent('private-server-marker');
  });
});

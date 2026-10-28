import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage } from '../api-client';
describe('GitHub invitation recovery feedback', () => {
  it('explains reconnect instead of asking users to retry an expired connection', () => {
    expect(errorMessage(new ApiError(503, 'GITHUB_RECONNECT_REQUIRED', 'private upstream message'))).toContain('Admin kết nối lại');
  });
  it('explains the per-member cooldown without exposing upstream details', () => {
    expect(errorMessage(new ApiError(409, 'GITHUB_INVITATION_COOLDOWN', 'internal'))).toContain('một phút');
  });
});

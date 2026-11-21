import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage } from '../api-client';
it('explains that a submitted source must belong to the session repository', () => {
  expect(errorMessage(new ApiError(400, 'SUBMISSION_REPOSITORY_MISMATCH', 'Internal detail')))
    .toBe('Bài nộp phải thuộc repository của phiên này. Hãy mở repository của phiên và gửi lại đúng link PR, commit hoặc branch/ref.');
});
describe('GitHub invitation recovery feedback', () => {
  it('explains reconnect instead of asking users to retry an expired connection', () => {
    expect(errorMessage(new ApiError(503, 'GITHUB_RECONNECT_REQUIRED', 'private upstream message'))).toContain('Admin kết nối lại');
  });
  it('explains the per-member cooldown without exposing upstream details', () => {
    expect(errorMessage(new ApiError(409, 'GITHUB_INVITATION_COOLDOWN', 'internal'))).toContain('một phút');
  });
  it.each([
    ['SESSION_REPOSITORY_REQUIRED', 'Phiên chưa có repository. Nhờ giảng viên đồng bộ repository của phiên trước khi nộp bài.'],
    ['GITHUB_IDENTITY_REQUIRED', 'Hãy liên kết tài khoản GitHub của bạn trước khi nộp bài.'],
  ])('explains submission prerequisite %s', (code, message) => {
    expect(errorMessage(new ApiError(409, code, 'internal'))).toBe(message);
  });
});

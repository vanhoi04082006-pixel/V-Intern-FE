import { expect, it } from 'vitest';
import { ApiError, errorMessage } from '../api-client';

it('explains the evidence requirement instead of sending an instructor to reload the page', () => {
  const message = errorMessage(new ApiError(409, 'AI_REVIEW_REQUIRED', 'upstream-private-detail'));
  expect(message).toContain('bằng chứng');
  expect(message).toContain('lý do chấm thủ công');
  expect(message).not.toContain('tải lại');
  expect(message).not.toContain('upstream-private-detail');
});
it('explains that automatic review needs an authorized managing instructor', () => {
  expect(errorMessage(new ApiError(403, 'AI_REVIEWER_UNAVAILABLE', 'internal'))).toContain('giảng viên phụ trách');
});

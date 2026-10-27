import { expect, it } from 'vitest';
import { ApiError, errorMessage } from '../api-client';

it('tells staff to add a future slot before opening recruitment without exposing raw server text', () => {
  const message = errorMessage(new ApiError(400, 'RECRUITMENT_ROUND_SLOT_REQUIRED', 'private upstream details'));
  expect(message).toContain('khung giờ');
  expect(message).toContain('tương lai');
  expect(message).not.toContain('private upstream');
});

import { ApiError } from '@/lib/auth/api-client';
import { ErrorState } from '@/components/shared/data-state';
import { InlineAlert } from '@/components/product/primitives';

const messages = new Set(['KNOWLEDGE_INVALID_DRAFT', 'KNOWLEDGE_NOT_PUBLISHABLE', 'KNOWLEDGE_VERSION_CONFLICT', 'KNOWLEDGE_INVALID_TRANSITION']);
export function KnowledgeFailure({ error }: { error: unknown }) {
  return error instanceof ApiError && [400, 409].includes(error.statusCode) && messages.has(error.code)
    ? <InlineAlert tone="danger" title="Chưa thực hiện được thao tác">{error.message.slice(0, 1200)}</InlineAlert>
    : <ErrorState error={error} title="Chưa thực hiện được thao tác" />;
}

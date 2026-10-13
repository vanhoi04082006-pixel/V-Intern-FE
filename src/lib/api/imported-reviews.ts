import { request } from './client';
import { array, nullable, number, oneOf, record, string } from './parse';
function parseReview(value: unknown) {
  const r=record(value);
  return { id:string(r.id), projectId:string(r.projectId), studentId:string(r.studentId), sourceImage:string(r.sourceImage), title:string(r.title), displayName:string(r.displayName), projectName:string(r.projectName), prNumber:number(r.prNumber), score:number(r.score), status:oneOf(r.status,['passed','needs_review','failed']), feedback:nullable(r.feedback,string), occurredAt:string(r.occurredAt), version:number(r.version) };
}
export type ImportedReview = ReturnType<typeof parseReview>;
export const listImportedReviews = (signal?: AbortSignal) => request('/imported-reviews',v=>array(record(v).items,parseReview),{signal});
export const updateImportedReview = (row: ImportedReview, body: {score:number;status:string;feedback:string}) => request('/imported-reviews/'+encodeURIComponent(row.id),v=>number(record(v).version),{method:'PATCH',body:{...body,version:row.version}});

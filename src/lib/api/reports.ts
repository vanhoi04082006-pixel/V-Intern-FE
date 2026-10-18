import { request } from './client';
import { array, nullable, number, oneOf, record, string } from './parse';
import { csvCell } from './management';
import { parseReportDetails } from './report-details';
export const reportLabels={progress:'Tiến độ',performance:'Hiệu suất',evaluation:'Đánh giá',review:'Review PR',risk:'Cảnh báo'};
export type ReportKind=keyof typeof reportLabels;
export type ReportScope={projectId:string;sessionId?:string;sprintId?:string;studentId?:string;from?:string;to?:string};
function parseMetadata(value:unknown){const v=record(value);return {id:string(v.id),title:string(v.title),kind:oneOf(v.kind,['progress','performance','evaluation','review','risk']),projectId:string(v.projectId),projectName:v.projectName===undefined||v.projectName===null?null:string(v.projectName),createdAt:string(v.createdAt)};}
function parseMember(value:unknown){const v=record(value);return {userId:string(v.userId),displayName:nullable(v.displayName,string),totalTaskCount:number(v.totalTaskCount),completedTaskCount:number(v.completedTaskCount),taskCompletionRate:nullable(v.taskCompletionRate,number),averageEvaluationScore:nullable(v.averageEvaluationScore,number),overdueOpenTaskCount:number(v.overdueOpenTaskCount),submissionCount:number(v.submissionCount),approvedCount:number(v.approvedCount),reworkCount:number(v.reworkCount)};}
export function parseSavedReport(value:unknown){const v=record(value),s=record(v.snapshot),scope=record(s.scope);return {...parseMetadata(v),snapshot:{projectName:string(s.projectName),scope:{projectId:string(scope.projectId),from:scope.from===undefined?undefined:string(scope.from),to:scope.to===undefined?undefined:string(scope.to),...(scope.sessionId===undefined?{}:{sessionId:string(scope.sessionId)}),...(scope.sprintId===undefined?{}:{sprintId:string(scope.sprintId)}),...(scope.studentId===undefined?{}:{studentId:string(scope.studentId)})},members:array(s.members,parseMember),...(s.details===undefined?{}:{details:parseReportDetails(s.details)})}};}
export type SavedReport=ReturnType<typeof parseSavedReport>;
export function listReports(page:number,kind:string,signal?:AbortSignal,scope:{projectId?:string;sessionId?:string}={}){return request(`/reports?${new URLSearchParams({page:String(page),...(kind?{kind}:{}),...(scope.projectId?{projectId:scope.projectId}:{}),...(scope.sessionId?{sessionId:scope.sessionId}:{})})}`,v=>{const r=record(v);return {items:array(r.items,parseMetadata),total:number(r.total),counts:array(r.counts,v=>{const c=record(v);return {kind:oneOf(c.kind,['progress','performance','evaluation','review','risk']),count:number(c.count),recentCount:number(c.recentCount)};})};},{signal});}
export const getSavedReport=(id:string,signal?:AbortSignal)=>request(`/reports/${id}`,parseSavedReport,{signal});
export const createReport=(input:ReportScope&{title:string;kind:ReportKind;requestId:string})=>request('/reports',parseSavedReport,{method:'POST',body:input});
export const getReportPdf=(id:string)=>request(`/reports/${id}/pdf`,v=>{if(!(v instanceof Blob))throw new Error('Invalid PDF');return v;},{responseType:'blob'});
export const getReportExcel=(id:string)=>request(`/reports/${id}/xlsx`,v=>{if(!(v instanceof Blob))throw new Error('Invalid workbook');return v;},{responseType:'xlsx'});
export function reportCsv(report:SavedReport){return '\ufeff'+[
  ['Báo cáo',report.title,'Thời điểm',report.createdAt],
  ['Dự án',report.snapshot.projectName,'Từ',report.snapshot.scope.from??'','Đến (không gồm)',report.snapshot.scope.to??''],
  ['Thành viên','Task','Hoàn thành','Tỷ lệ (%)','Điểm đã chốt','Quá hạn','Bài nộp','Đã duyệt','Làm lại'],
  ...report.snapshot.members.map(m=>[m.displayName??m.userId,m.totalTaskCount,m.completedTaskCount,m.taskCompletionRate,m.averageEvaluationScore,m.overdueOpenTaskCount,m.submissionCount,m.approvedCount,m.reworkCount]),
  ...(report.snapshot.details ? [
    ['Cảnh báo',report.snapshot.details.summary.risk,...report.snapshot.details.summary.reasons],
    ['Task','Tiêu đề','Người phụ trách','Sprint','Trạng thái','Chờ phụ thuộc','Hạn','Bài nộp','AI status','AI score','Giảng viên'],
    ...report.snapshot.details.tasks.map(t=>[t.code,t.title,t.assigneeName??'Chưa phân công',t.sprintName??'',t.status,t.blocked?'Có':'Không',t.dueDate??'',t.submissionStatus??'',t.aiStatus??'',t.aiScore,t.instructorScore]),
    ['Timeline UTC','Task','Trạng thái'],
    ...report.snapshot.details.timeline.map(t=>[t.createdAt,t.taskCode,t.toStatus]),
  ] : []),
].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function reportScope(projectId:string,sessionId:string,from:string,to:string,sprintId='',studentId=''):ReportScope {
  return {projectId,...(sessionId?{sessionId}:{}),...(sprintId?{sprintId}:{}),...(studentId?{studentId}:{}),...(from?{from:from+'T00:00:00.000Z'}:{}),...(to?{to:new Date(Date.parse(to+'T00:00:00.000Z')+86400000).toISOString()}: {})};
}

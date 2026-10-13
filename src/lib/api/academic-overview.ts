import { request } from './client';
import { array, record, string, number, nullable } from './parse';
import type { AcademicKind } from './academic';
export const getAcademicOverview = (kind:AcademicKind, signal?:AbortSignal) => request(`/dashboard/academic-overview?kind=${kind}`,value=>{
  const v=record(value);
  return {memberCount:number(v.memberCount),statuses:array(v.statuses,value=>{const s=record(value);return {status:string(s.status),count:number(s.count)};}),upcoming:array(v.upcoming,value=>{const row=record(value);return {id:string(row.id),code:string(row.code),name:string(row.name),status:string(row.status),startDate:nullable(row.startDate,string),endDate:nullable(row.endDate,string)};}),technologies:array(v.technologies,value=>{const row=record(value);return {technology:string(row.technology),count:number(row.count)};})};
},{signal});

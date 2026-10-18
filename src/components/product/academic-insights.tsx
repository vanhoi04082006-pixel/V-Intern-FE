"use client";
import { useCallback, useState } from 'react';
import { CalendarDays, Layers, BookOpen, Play, Users, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AcademicKind } from '@/lib/api/academic';
import { getAcademicOverview } from '@/lib/api/academic-overview';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState,LoadingState } from '@/components/shared/data-state';
import { Badge,Empty,Panel,MetricCard } from './primitives';
import { Distribution } from './collection-insights';
const statusLabels:Record<string,string>={recruiting:'Đang tuyển',paused:'Tạm dừng',active:'Đang hoạt động',completed:'Hoàn thành',upcoming:'Sắp bắt đầu',ending:'Sắp kết thúc',cancelled:'Đã hủy',draft:'Bản nháp',archived:'Đã lưu trữ'};
export function AcademicMetrics({kind}:{kind:AcademicKind}) {
  const r=useResource(useCallback((s:AbortSignal)=>getAcademicOverview(kind,s),[kind]));
  if(r.error)return <ErrorState error={r.error} onRetry={r.reload}/>;if(!r.data)return null;
  const d=r.data,count=(status:string)=>d.statuses.find(s=>s.status===status)?.count??0,total=d.statuses.reduce((n,s)=>n+s.count,0);
  const cards = kind==='classes'
    ? [{icon:BookOpen,label:'Tổng lớp học',value:total,sub:'Trong hệ thống hiện tại'},{icon:Play,label:'Lớp đang hoạt động',value:count('active'),sub:'Đang diễn ra'},{icon:Users,label:'Sinh viên tham gia',value:d.memberCount,sub:'Đã được phân công'},{icon:CheckCircle2,label:'Đã hoàn thành',value:count('completed'),sub:'Kết thúc đúng tiến độ'},{icon:Clock,label:'Sắp bắt đầu',value:count('upcoming'),sub:'Chuẩn bị khai giảng'}]
    : kind==='sessions'
    ? [{icon:CalendarDays,label:'Tổng số phiên',value:total,sub:'Trong hệ thống hiện tại'},{icon:Layers,label:'Phiên đang hoạt động',value:count('active'),sub:'Đang diễn ra'},{icon:Users,label:'Sinh viên tham gia',value:d.memberCount,sub:'Đã được phân công'},{icon:CheckCircle2,label:'Đã hoàn thành',value:count('completed'),sub:`${count('completed')} / ${total} phiên`},{icon:Clock,label:'Sắp kết thúc',value:count('ending'),sub:'Cần chú ý trong 7 ngày tới'}]
    : [{icon:Layers,label:'Tổng dự án',value:total,sub:'Trong hệ thống hiện tại'},{icon:Play,label:'Dự án đang hoạt động',value:count('active'),sub:'Đang triển khai'},{icon:Users,label:'Sinh viên tham gia',value:d.memberCount,sub:'Đã được phân công'},{icon:CheckCircle2,label:'Đã hoàn thành',value:count('completed'),sub:'Kết thúc đúng tiến độ'},{icon:BookOpen,label:'Công nghệ phổ biến',value:d.technologies.length,sub:'Công nghệ đang dùng'}];
  return <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((c,i)=><MetricCard key={c.label} icon={c.icon} label={c.label} index={i} value={c.value.toLocaleString('vi-VN')} sub={c.sub}/>)}</div>;
}
export function AcademicInsights({kind}:{kind:AcademicKind}) {
  const r=useResource(useCallback((s:AbortSignal)=>getAcademicOverview(kind,s),[kind]));
  if(r.loading)return <LoadingState/>;if(r.error)return <ErrorState error={r.error} onRetry={r.reload}/>;if(!r.data)return null;const d=r.data;
  return <aside className="min-w-0 space-y-3"><Panel title={kind==='classes'?'Lớp học gần đây':kind==='sessions'?'Lịch mốc phiên thực tập':'Công nghệ phổ biến'} action={kind==='sessions'?<span className="text-xs text-blue-600">Xem tất cả →</span>:undefined}>{kind==='projects'?<ul className="space-y-4">{d.technologies.map((t,i)=><li className="flex items-center gap-3 text-xs" key={t.technology}><span className="text-slate-400">{i+1}</span><Layers size={20} className="text-blue-600"/><strong className="flex-1 text-navy">{t.technology}</strong><span>{t.count} dự án</span><progress value={t.count} max={Math.max(1,...d.technologies.map(t=>t.count))} className="h-1.5 w-20 accent-blue-600" aria-label={t.technology}/></li>)}</ul>:kind==='sessions'?<SessionCalendar rows={d.upcoming}/>:d.upcoming.length?<ul className="space-y-2">{d.upcoming.map(row=><li key={row.id} className="flex items-start gap-3 rounded-md border border-blue-50 p-2.5"><CalendarDays size={19} className="mt-1 shrink-0 text-blue-600"/><div className="min-w-0 flex-1 text-xs"><strong className="block text-navy">{row.code} · {row.name}</strong><p className="mt-1 text-[10px] text-slate-500">{row.startDate?new Date(row.startDate).toLocaleDateString('vi-VN'):'Chưa có ngày bắt đầu'} — {row.endDate?new Date(row.endDate).toLocaleDateString('vi-VN'):'Chưa có ngày kết thúc'}</p></div><Badge>{row.status}</Badge></li>)}</ul>:<Empty>Chưa có lịch.</Empty>}</Panel><Distribution title={`Phân bố ${kind==='classes'?'lớp học':kind==='sessions'?'phiên thực tập':'dự án'}`} values={d.statuses.map(s=>[statusLabels[s.status]??s.status,s.count])} note="Thống kê từ tất cả bản ghi đã lưu trong hệ thống."/></aside>;
}
function SessionCalendar({rows}:{rows:{id:string;code:string;name:string;startDate:string|null;endDate:string|null;status:string}[]}) {
  const today=new Date();const [ym,setYm]=useState({y:today.getFullYear(),m:today.getMonth()});
  const first=new Date(ym.y,ym.m,1),startDay=(first.getDay()+6)%7,days=new Date(ym.y,ym.m+1,0).getDate();
  const inRange=(day:number)=>rows.some(r=>r.startDate&&r.endDate&&Date.parse(r.startDate)<=Date.parse(`${ym.y}-${ym.m+1}-${day}`)&&Date.parse(`${ym.y}-${ym.m+1}-${day}`)<=Date.parse(r.endDate));
  const week=rows.filter(r=>r.startDate&&Math.abs(Date.parse(r.startDate)-today.getTime())<7*86400000).slice(0,5);
  return <div>
    <div className="mb-2 flex items-center justify-between text-xs">
      <button aria-label="Tháng trước" className="rounded p-1 hover:bg-blue-50" onClick={()=>setYm(v=>v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1})}><ChevronLeft size={15}/></button>
      <strong className="text-navy">Tháng {ym.m+1}, {ym.y}</strong>
      <span className="flex items-center gap-2"><button className="rounded border border-blue-100 px-2 py-1 text-blue-600" onClick={()=>setYm({y:today.getFullYear(),m:today.getMonth()})}>Hôm nay</button><button aria-label="Tháng sau" className="rounded p-1 hover:bg-blue-50" onClick={()=>setYm(v=>v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1})}><ChevronRight size={15}/></button></span>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">{["T2","T3","T4","T5","T6","T7","CN"].map(d=><span key={d}>{d}</span>)}</div>
    <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[11px]">
      {Array.from({length:startDay},(_,i)=><span key={`e${i}`}/>)}
      {Array.from({length:days},(_,i)=>{const day=i+1,active=inRange(day),isToday=today.getFullYear()===ym.y&&today.getMonth()===ym.m&&today.getDate()===day;
        return <span key={day} className={`grid h-7 place-items-center rounded-full ${isToday?"bg-blue-600 font-bold text-white":active?"bg-blue-100 font-semibold text-blue-700":"text-slate-500"}`}>{day}</span>;})}
    </div>
    <p className="mb-1 mt-3 text-xs font-semibold text-navy">Sự kiện trong tuần</p>
    {week.length?<ul className="space-y-2">{week.map(r=><li key={r.id} className="flex items-start gap-2 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"/><div className="min-w-0"><strong className="block truncate text-navy">{r.code} · {r.name}</strong><span className="text-[10px] text-slate-500">{r.startDate?new Date(r.startDate).toLocaleDateString('vi-VN'):''}</span></div></li>)}</ul>:<Empty>Không có mốc nào trong 7 ngày tới.</Empty>}
  </div>;
}

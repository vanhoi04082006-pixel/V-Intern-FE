"use client";
import { useCallback, useState } from 'react';
import { IconCalendarDays, IconLayers, IconBookOpen, IconPlay, IconUsers, IconCircleCheck, IconClock, IconChevronLeft, IconChevronRight } from '@/components/v-intern/icons';
import type { AcademicKind } from '@/lib/api/academic';
import { getAcademicOverview } from '@/lib/api/academic-overview';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState,LoadingState } from '@/components/shared/data-state';
import { Empty,Panel,MetricCard } from './primitives';
import { Distribution } from './collection-insights';
const statusLabels:Record<string,string>={recruiting:'Đang tuyển',paused:'Tạm dừng',active:'Đang hoạt động',completed:'Hoàn thành',upcoming:'Sắp bắt đầu',ending:'Sắp kết thúc',cancelled:'Đã hủy',draft:'Bản nháp',archived:'Đã lưu trữ'};
export function AcademicMetrics({kind}:{kind:AcademicKind}) {
  const r=useResource(useCallback((s:AbortSignal)=>getAcademicOverview(kind,s),[kind]));
  if(r.error)return <ErrorState error={r.error} onRetry={r.reload}/>;if(!r.data)return null;
  const d=r.data,count=(status:string)=>d.statuses.find(s=>s.status===status)?.count??0,total=d.statuses.reduce((n,s)=>n+s.count,0);
  const cards = kind==='sessions'
    ? [{icon:IconCalendarDays,label:'Tổng số phiên',value:total,sub:'Trong hệ thống hiện tại'},{icon:IconLayers,label:'Phiên đang hoạt động',value:count('active'),sub:'Đang diễn ra'},{icon:IconUsers,label:'Sinh viên tham gia',value:d.memberCount,sub:'Đã được phân công'},{icon:IconCircleCheck,label:'Đã hoàn thành',value:count('completed'),sub:`${count('completed')} / ${total} phiên`},{icon:IconClock,label:'Sắp kết thúc',value:count('ending'),sub:'Cần chú ý trong 7 ngày tới'}]
    : [{icon:IconLayers,label:'Tổng dự án',value:total,sub:'Trong hệ thống hiện tại'},{icon:IconPlay,label:'Dự án đang hoạt động',value:count('active'),sub:'Đang triển khai'},{icon:IconUsers,label:'Sinh viên tham gia',value:d.memberCount,sub:'Đã được phân công'},{icon:IconCircleCheck,label:'Đã hoàn thành',value:count('completed'),sub:'Kết thúc đúng tiến độ'},{icon:IconBookOpen,label:'Công nghệ phổ biến',value:d.technologies.length,sub:'Công nghệ đang dùng'}];
  return <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((c,i)=><MetricCard key={c.label} icon={c.icon} label={c.label} index={i} value={c.value.toLocaleString('vi-VN')} sub={c.sub}/>)}</div>;
}
export function AcademicInsights({kind}:{kind:AcademicKind}) {
  const r=useResource(useCallback((s:AbortSignal)=>getAcademicOverview(kind,s),[kind]));
  if(r.loading)return <LoadingState/>;if(r.error)return <ErrorState error={r.error} onRetry={r.reload}/>;if(!r.data)return null;const d=r.data;
  return <aside className="min-w-0 space-y-3"><Panel title={kind==='sessions'?'Lịch mốc phiên thực tập':'Công nghệ phổ biến'} action={kind==='sessions'?<span className="text-caption text-primary">Xem tất cả</span>:undefined}>{kind==='projects'?<ul className="space-y-4">{d.technologies.map((t,i)=><li className="flex items-center gap-3 text-caption" key={t.technology}><span className="text-muted-foreground">{i+1}</span><IconLayers size={20} className="text-primary"/><strong className="flex-1 text-foreground">{t.technology}</strong><span>{t.count} dự án</span><progress value={t.count} max={Math.max(1,...d.technologies.map(t=>t.count))} className="h-1.5 w-20 accent-primary" aria-label={t.technology}/></li>)}</ul>:<SessionCalendar rows={d.upcoming}/>}</Panel><Distribution title={`Phân bố ${kind==='sessions'?'phiên thực tập':'dự án'}`} values={d.statuses.map(s=>[statusLabels[s.status]??s.status,s.count])} note="Thống kê từ tất cả bản ghi đã lưu trong hệ thống."/></aside>;
}
function SessionCalendar({rows}:{rows:{id:string;code:string;name:string;startDate:string|null;endDate:string|null;status:string}[]}) {
  const today=new Date();const [ym,setYm]=useState({y:today.getFullYear(),m:today.getMonth()});
  const first=new Date(ym.y,ym.m,1),startDay=(first.getDay()+6)%7,days=new Date(ym.y,ym.m+1,0).getDate();
  const inRange=(day:number)=>rows.some(r=>r.startDate&&r.endDate&&Date.parse(r.startDate)<=Date.parse(`${ym.y}-${ym.m+1}-${day}`)&&Date.parse(`${ym.y}-${ym.m+1}-${day}`)<=Date.parse(r.endDate));
  const week=rows.filter(r=>r.startDate&&Math.abs(Date.parse(r.startDate)-today.getTime())<7*86400000).slice(0,5);
  return <div>
    <div className="mb-2 flex items-center justify-between text-caption">
      <button aria-label="Tháng trước" className="rounded p-1 hover:bg-accent" onClick={()=>setYm(v=>v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1})}><IconChevronLeft size={15}/></button>
      <strong className="text-foreground">Tháng {ym.m+1}, {ym.y}</strong>
      <span className="flex items-center gap-2"><button className="rounded border border-primary px-2 py-1 text-primary" onClick={()=>setYm({y:today.getFullYear(),m:today.getMonth()})}>Hôm nay</button><button aria-label="Tháng sau" className="rounded p-1 hover:bg-accent" onClick={()=>setYm(v=>v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1})}><IconChevronRight size={15}/></button></span>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-caption text-muted-foreground">{["T2","T3","T4","T5","T6","T7","CN"].map(d=><span key={d}>{d}</span>)}</div>
    <div className="mt-1 grid grid-cols-7 gap-1 text-center text-caption">
      {Array.from({length:startDay},(_,i)=><span key={`e${i}`}/>)}
      {Array.from({length:days},(_,i)=>{const day=i+1,active=inRange(day),isToday=today.getFullYear()===ym.y&&today.getMonth()===ym.m&&today.getDate()===day;
        return <span key={day} className={`grid h-7 place-items-center rounded-full ${isToday?"bg-primary font-bold text-primary-foreground":active?"bg-accent font-semibold text-primary":"text-muted-foreground"}`}>{day}</span>;})}
    </div>
    <p className="mb-1 mt-3 text-caption font-semibold text-foreground">Sự kiện trong tuần</p>
    {week.length?<ul className="space-y-2">{week.map(r=><li key={r.id} className="flex items-start gap-2 text-caption"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"/><div className="min-w-0"><strong className="block truncate text-foreground">{r.code} · {r.name}</strong><span className="text-caption text-muted-foreground">{r.startDate?new Date(r.startDate).toLocaleDateString('vi-VN'):''}</span></div></li>)}</ul>:<Empty>Không có mốc nào trong 7 ngày tới.</Empty>}
  </div>;
}

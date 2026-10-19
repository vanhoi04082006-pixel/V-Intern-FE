"use client";
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Layers, ClipboardList, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { request } from '@/lib/api/client';
import { array, nullable, number, record, string } from '@/lib/api/parse';
import { getBoard } from '@/lib/api/work';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Modal, Panel, Badge, Empty, MetricCard } from './primitives';
import { TaskDetail } from './intern-work';
import { TaskStatusPill, PriorityBadge } from './sprint-management';
import { DropColumn, canManageDrop, draggableTask } from './kanban-dnd';
import { saveManagedTask } from '@/lib/api/management';
import { Can } from '@/components/auth/can';
const labels={todo:'To Do',doing:'Doing',review:'Review',done:'Done'};
const colors={todo:'bg-slate-100',doing:'bg-blue-50',review:'bg-amber-50',done:'bg-emerald-50'};
export function SprintOverview({id, activeCount, revision, onUpdated, onManage}: {id:string; activeCount?: number; revision?: number; onUpdated?: () => void; onManage?: () => void}) {
  const board=useResource(useCallback((s:AbortSignal)=>getBoard(id,s),[id]), revision),[task,setTask]=useState('');
  const [now]=useState(()=>Date.now());
  const [dropError,setDropError]=useState<unknown>(null);
  const [dropping,setDropping]=useState(false);
  async function dropTask(taskId:string,to:(typeof b.columns)[number]['status']) {
    if(dropping)return;setDropping(true);setDropError(null);
    try{await saveManagedTask(taskId,{status:to});reload();}catch(e){setDropError(e);}finally{setDropping(false);}
  }
  function reload() { board.reload(); onUpdated?.(); }
  if(board.loading)return <LoadingState/>;if(board.error)return <ErrorState error={board.error} onRetry={board.reload}/>;if(!board.data)return null;
  const b=board.data,done=b.columns.find(c=>c.status==='done')?.count??0,review=b.columns.find(c=>c.status==='review')?.count??0;
  const overdue=b.overdueOpenTaskCount;
  const remain=Math.max(0,Math.ceil((Date.parse(b.sprint.endDate)-now)/86400000));
  const reviewTasks=b.columns.find(c=>c.status==='review')?.tasks.filter((_,i)=>i<4)??[];
  return <>
    <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={Layers} label="Sprint đang hoạt động" index={0} value={activeCount ?? (b.sprint.status === 'active' ? 1 : 0)} sub="Trong phạm vi đang xem" />
      <MetricCard icon={ClipboardList} label="Task tổng" index={1} value={b.total} sub="Trong Sprint đang chọn" />
      <MetricCard icon={CheckCircle2} label="Task hoàn thành" index={2} value={done} sub={`${b.total?Math.round(done/b.total*100):0}% Sprint đang chọn`} />
      <MetricCard icon={Clock} label="Task / PR chờ duyệt" index={3} value={review} sub="Đang ở trạng thái Review" />
      <MetricCard icon={AlertTriangle} label="Task quá hạn" index={4} value={overdue ?? 'Chưa đo được'} sub="Tổng hợp toàn Sprint từ backend" subTone="text-rose-600" />
    </div>
    <div className="mb-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel title="Bảng Sprint hiện tại" action={<span className="flex flex-wrap items-center gap-3"><Link href="#sprint-task-list" className="text-xs text-blue-600">Xem tất cả task →</Link><Can perm="tasks.manage"><a href={onManage ? '#sprint-task-management' : '#sprint-task-list'} onClick={onManage} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={14} />{onManage ? 'Quản lý task' : 'Tạo task mới'}</a></Can></span>}>
        <p className="mb-4 text-sm text-slate-500">{b.sprint.code} · {b.sprint.name}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {b.columns.map(c=><section key={c.status} className={`min-w-0 rounded-lg p-3 ${colors[c.status]}`}>
            <h3 className="mb-3 text-sm font-bold text-navy">{labels[c.status]} <Badge>{c.count}</Badge></h3>
            <DropColumn status={c.status} canDrop={(from)=>canManageDrop(from,c.status)} onDrop={(taskId,to)=>void dropTask(taskId,to)}>
            <div className="space-y-3">
            {c.tasks.slice(0,3).map(t=><button key={t.id} {...draggableTask(t.id,t.status)} title="Mở chi tiết · kéo sang cột được phép để chuyển trạng thái" className="mb-3 w-full rounded-md border border-blue-100 bg-white p-3 text-left" onClick={()=>setTask(t.id)}>
              <span className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-blue-600">{t.code}</span><PriorityBadge priority={t.priority} /></span>
              <p title={t.title} className="mt-1 line-clamp-2 text-[13px] font-bold text-navy">{t.title}</p>
              {t.description&&<p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{t.description}</p>}
              <span className="mt-2 flex items-center justify-between text-[11px] text-slate-500"><span>{t.dueDate?new Date(t.dueDate).toLocaleDateString('vi-VN'):'Chưa có hạn'}</span>{t.storyPoints!==null&&<span className="rounded bg-slate-100 px-2 py-1 text-[10px]">{t.storyPoints} pts</span>}</span>
            </button>)}
            </div>
            </DropColumn>
            {c.count>3&&<a href="#sprint-task-list" className="block rounded bg-white/70 p-2 text-center text-[11px] font-semibold text-blue-600">Xem tất cả {c.count} task →</a>}
          </section>)}
        </div>
      </Panel>
      <div className="min-w-0 space-y-4">
        <Panel title={`Tiến độ ${b.sprint.code}`}>
          <strong className="text-2xl text-navy">{done} / {b.total} task</strong>
          <div role="progressbar" aria-label="Tiến độ Sprint" aria-valuenow={done} aria-valuemin={0} aria-valuemax={b.total||1} className="my-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{width:`${b.total?done/b.total*100:0}%`}}/></div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-blue-100 p-2.5"><p className="text-[10px] text-slate-500">Thời gian còn lại</p><strong className="mt-1 block text-sm text-navy">{remain} ngày</strong></div>
            <div className="rounded-md border border-blue-100 p-2.5"><p className="text-[10px] text-slate-500">Task còn lại</p><strong className="mt-1 block text-sm text-navy">{b.total-done} task</strong></div>
          </div>
          <Burndown id={id} compact />
        </Panel>
        <Panel title="Review & PR cần xử lý" action={<a href="#sprint-task-list" className="text-xs text-blue-600">Xem tất cả →</a>}>
          {reviewTasks.length?<ul className="space-y-2">{reviewTasks.map(t=><li key={t.id} className="flex items-center gap-2 rounded-md border border-blue-50 p-2 text-xs"><div className="min-w-0 flex-1"><strong className="block text-blue-600">{t.code}</strong><span className="mt-0.5 line-clamp-1 block text-navy">{t.title}</span></div><TaskStatusPill status="review" /><button className="rounded border border-blue-100 px-2 py-1 text-blue-600" onClick={()=>setTask(t.id)}>Xem</button></li>)}</ul>:<Empty>Không có task chờ review.</Empty>}
        </Panel>

      </div>
    </div>
    {dropping&&<LoadingState/>}
    {Boolean(dropError)&&<ErrorState error={dropError} onRetry={()=>{setDropError(null);board.reload();}}/>}
    {task&&<Modal title="Chi tiết nhiệm vụ" onClose={()=>setTask('')}><TaskDetail id={task} managed onUpdated={reload}/></Modal>}
  </>;
}
export function Burndown({id,compact=false}: {id:string;compact?:boolean}) {
  const data=useResource(useCallback((signal:AbortSignal)=>request(`/dashboard/sprints/${id}/burndown`,v=>array(record(v).points,x=>{const p=record(x);return{date:string(p.date),actual:nullable(p.actual,number),ideal:number(p.ideal)};}),{signal}),[id]));
  if(data.loading)return <LoadingState/>;if(data.error)return <ErrorState error={data.error} onRetry={data.reload}/>;if(!data.data?.length)return null;
  const points=data.data,max=Math.max(1,...points.flatMap(p=>[p.actual??0,p.ideal]));
  const coords=(i:number,n:number)=>`${35+i/Math.max(1,points.length-1)*420},${175-n/max*140}`;
  const actual=points.flatMap((p,i)=>p.actual===null?[]:[coords(i,p.actual)]).join(' ');
  return <div className={compact?"mt-3":"mt-5"}><h3 className="text-sm font-bold text-navy">Burndown</h3><p className="my-2 text-xs text-slate-500">Xanh: task còn lại · Nét đứt: kế hoạch lý tưởng</p><svg viewBox="0 0 490 210" className={compact?"h-32 w-full":"w-full"} role="img" aria-label="Burndown theo lịch sử trạng thái task hiện thuộc Sprint"><path d="M35 25V175H455" fill="none" stroke="#dbeafe"/>{[0,.5,1].map(f=><g key={f}><line x1="35" x2="455" y1={175-f*140} y2={175-f*140} stroke="#e2e8f0" strokeDasharray="3 3"/><text x="2" y={179-f*140} fontSize="11" fill="#64748b">{Math.round(max*f)}</text></g>)}<polyline points={points.map((p,i)=>coords(i,p.ideal)).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/><polyline points={actual} fill="none" stroke="#246bfe" strokeWidth="3"/>{points.map((p,i)=>p.actual===null?null:<circle key={p.date} cx={35+i/Math.max(1,points.length-1)*420} cy={175-p.actual/max*140} r="3" fill="#246bfe"><title>{new Date(p.date).toLocaleDateString('vi-VN')}: {p.actual} task còn lại</title></circle>)}<text x="35" y="202" fontSize="11" fill="#64748b">{new Date(points[0].date).toLocaleDateString('vi-VN')}</text><text x="455" y="202" textAnchor="end" fontSize="11" fill="#64748b">{new Date(points.at(-1)!.date).toLocaleDateString('vi-VN')}</text></svg><details className="text-xs text-slate-500"><summary>Nguồn dữ liệu và bảng số</summary><p className="my-2">Tái dựng từ lịch sử trạng thái của các task hiện thuộc Sprint, theo ngày UTC; không bao gồm task đã chuyển ra Sprint. Ngày tương lai chỉ có đường kế hoạch.</p><ul>{points.map(p=><li key={p.date}>{new Date(p.date).toLocaleDateString('vi-VN')}: {p.actual??'Chưa diễn ra'}</li>)}</ul></details></div>;
}

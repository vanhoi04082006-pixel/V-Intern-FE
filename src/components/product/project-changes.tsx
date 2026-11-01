"use client";
import { useCallback,useState } from "react";
import { listChanges,proposeChange,applyChange } from "@/lib/api/templates";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState,LoadingState } from "@/components/shared/data-state";
import { Badge,buttonClass,Empty,inputClass,Panel } from "./primitives";
export function ProjectChanges({ id }: { id:string }) {
  const rows=useResource(useCallback((s:AbortSignal)=>listChanges(id,s),[id]));
  const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<unknown>();
  async function apply(id:string) { setBusy(true);setError(undefined);try { await applyChange(id);rows.reload(); } catch(e) { setError(e); } finally { setBusy(false); } }
  return <Panel title="Tình huống PM & yêu cầu thay đổi"><p className="mb-3 text-body text-muted-foreground">Giảng viên đề xuất thay đổi có lý do. Áp dụng sẽ tạo task mới và lưu lịch sử; giao người thực hiện tại Sprint & Task.</p>
    {rows.loading?<LoadingState/>:rows.error?<ErrorState error={rows.error} onRetry={rows.reload}/>:rows.data?.length?<ul className="space-y-3">{rows.data.map(r=><li key={r.id} className="rounded-control border border-border p-3 text-body"><strong>{r.title}</strong> <Badge>{r.status==='applied'?'Đã áp dụng':'Đề xuất'}</Badge><p className="mt-2">{r.description}</p><p className="mt-1 text-caption text-muted-foreground">Lý do: {r.reason}</p>{r.status==='proposed'&&<button className={`${buttonClass} mt-3`} disabled={busy} onClick={()=>void apply(r.id)}>Áp dụng & tạo task</button>}</li>)}</ul>:<Empty title="Chưa có yêu cầu thay đổi" description="Yêu cầu thay đổi từ giảng viên sẽ xuất hiện tại đây sau khi được đề xuất." />}
    <form className="mt-4 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError(undefined);try { await proposeChange(id,{title,description,reason});setTitle('');setDescription('');setReason('');rows.reload(); } catch(e) {setError(e);}finally{setBusy(false);}}}>
      <label className="block text-body">Tiêu đề<input required minLength={2} maxLength={256} className={inputClass} placeholder="VD: Thêm màn hình xuất báo cáo" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="block text-body">Nội dung thay đổi<textarea required minLength={10} maxLength={4000} className={inputClass} placeholder="Mô tả thay đổi cần áp dụng cho dự án" value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="block text-body">Lý do<textarea required minLength={10} maxLength={4000} className={inputClass} placeholder="Vì sao thay đổi này cần thiết lúc này?" value={reason} onChange={e=>setReason(e.target.value)}/></label>{Boolean(error)&&<p role="alert" className="text-body text-destructive">{errorMessage(error)}</p>}<div className="flex justify-end"><button className={buttonClass} disabled={busy}>Đề xuất thay đổi</button></div>
    </form></Panel>;
}

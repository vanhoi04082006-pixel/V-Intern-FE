import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InternSprint } from '../intern-entry';
import type { InternWorkspace } from '@/lib/api/workspace';
const api=vi.hoisted(()=>({getOwnSprints:vi.fn(),getOwnSprintBoard:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()}),usePathname:()=>'/intern/sprint'}));
vi.mock('@/lib/api/work',async original=>({...await original<typeof import('@/lib/api/work')>(),...api}));
const planned={id:'planned',code:'SP-1',name:'Nền tảng',status:'planned',startDate:'2026-10-25',endDate:'2026-11-01'};
const history={...planned,id:'history',code:'SP-0',name:'Lịch sử',status:'completed'};
const workspace:InternWorkspace={status:'active',assignment:{id:'a',assignedAt:'2026-10-25',project:{id:'p',code:'P',name:'Dự án',status:'active'},session:{id:'s',code:'S',name:'Phiên',status:'active'}},recruitment:{status:'passed',selectedRole:'frontend',attemptCount:1,recruitedAt:'2026-10-25'},currentSprint:null,taskSummary:{todo:1,doing:0,review:0,done:0,total:1},focusedTask:null};
beforeEach(()=>{vi.clearAllMocks();api.getOwnSprints.mockResolvedValue({items:[planned,history],total:2,page:1,pageSize:50,totalPages:1});api.getOwnSprintBoard.mockImplementation(async(id:string)=>({sprint:{...(id==='planned'?planned:history),projectId:'p'},total:0,columns:(['todo','doing','review','done'] as const).map(status=>({status,count:0,tasks:[]}))}));});
describe('student sprint visibility',()=>{
  it('shows a planned sprint and its board when no sprint has been activated',async()=>{
    render(<InternSprint workspace={workspace}/>);
    await screen.findByRole('combobox',{name:'Sprint đang xem'});
    await waitFor(()=>expect(api.getOwnSprintBoard).toHaveBeenCalledWith('planned',expect.any(AbortSignal)));
    expect(screen.getByText(/Sprint đã được lên kế hoạch/)).toBeInTheDocument();
    expect(screen.queryByText(/Giảng viên chưa kích hoạt/)).not.toBeInTheDocument();
    expect(api.getOwnSprints).toHaveBeenCalledWith(1,expect.any(AbortSignal));
  });
  it('switches to historical sprints using an assignment-scoped board',async()=>{
    render(<InternSprint workspace={workspace}/>);
    fireEvent.change(await screen.findByRole('combobox',{name:'Sprint đang xem'}),{target:{value:'history'}});
    await waitFor(()=>expect(api.getOwnSprintBoard).toHaveBeenCalledWith('history',expect.any(AbortSignal)));
    expect(screen.queryByText(/Sprint đã được lên kế hoạch/)).not.toBeInTheDocument();
  });
  it('does not claim no sprint when the list fails to load',async()=>{
    api.getOwnSprints.mockRejectedValue(new Error('offline'));render(<InternSprint workspace={workspace}/>);
    await screen.findByRole('button',{name:'Thử lại'});expect(screen.queryByText('Chưa có Sprint trong phiên')).not.toBeInTheDocument();expect(api.getOwnSprintBoard).not.toHaveBeenCalled();
  });
  it('only uses the no-sprint state after a successful empty response',async()=>{
    api.getOwnSprints.mockResolvedValue({items:[],total:0,page:1,pageSize:50,totalPages:0});render(<InternSprint workspace={workspace}/>);
    await screen.findByText('Chưa có Sprint trong phiên');expect(api.getOwnSprintBoard).not.toHaveBeenCalled();
  });
});

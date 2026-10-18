import { TaskDetail } from '@/components/product/intern-work';
import { PageTitle } from '@/components/product/primitives';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className="space-y-4"><PageTitle title="Chi tiết Task" /><TaskDetail id={id} managed /></div>; }

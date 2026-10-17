import { SprintWorkspace } from '@/components/sessions/sprint-workspace';
import { PageTitle } from '@/components/product/primitives';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><PageTitle title="Chi tiết Sprint" /><SprintWorkspace key={id} id={id} basePath="/admin" /></>; }

import { SprintOverview } from '@/components/product/sprint-overview';
import { PageTitle } from '@/components/product/primitives';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><PageTitle title="Chi tiết Sprint" /><SprintOverview id={id} /></>; }

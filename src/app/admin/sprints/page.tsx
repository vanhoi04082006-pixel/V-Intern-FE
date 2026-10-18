import { DeliveryOverview } from '@/components/sessions/delivery-overview';
export default async function Page({ searchParams }: { searchParams: Promise<{ projectId?: string; sessionId?: string }> }) { const params = await searchParams; return <DeliveryOverview basePath="/admin" initialProjectId={params.projectId} initialSessionId={params.sessionId} />; }

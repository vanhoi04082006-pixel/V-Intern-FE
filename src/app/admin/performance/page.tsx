import { MemberPerformance } from '@/components/product/member-performance';
export default async function Page({ searchParams }: { searchParams: Promise<{ projectId?: string; sessionId?: string }> }) { const params = await searchParams; return <MemberPerformance basePath="/admin" initialProjectId={params.projectId} initialSessionId={params.sessionId} />; }

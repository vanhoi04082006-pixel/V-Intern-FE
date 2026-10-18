import { ReportsWorkspace } from '@/components/sessions/reports-workspace';
export default async function Page({ searchParams }: { searchParams: Promise<{ projectId?: string; sessionId?: string }> }) { const params = await searchParams; return <ReportsWorkspace initialProjectId={params.projectId} initialSessionId={params.sessionId} />; }

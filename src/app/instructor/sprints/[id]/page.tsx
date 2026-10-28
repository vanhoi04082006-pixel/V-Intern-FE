import { SprintWorkspace } from '@/components/sessions/sprint-workspace';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SprintWorkspace key={id} id={id} />;
}

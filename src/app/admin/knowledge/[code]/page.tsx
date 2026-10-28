import { KnowledgeEditor } from '@/components/admin/knowledge/editor';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <KnowledgeEditor code={code} />;
}

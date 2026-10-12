import { TemplateDetail } from "@/components/projects/template-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateDetail id={id} />;
}

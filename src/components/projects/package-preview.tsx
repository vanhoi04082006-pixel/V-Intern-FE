"use client";
import { useState } from "react";
import { Download, FileCode2, FolderOpen } from "lucide-react";
import { buttonClass } from "@/components/product/primitives";
import {
  downloadStarter,
  type LearningPackage,
  type PackageFile,
} from "@/lib/api/template-materials";

export function PackageFiles({ files }: { files: PackageFile[] }) {
  const [selected, setSelected] = useState(files[0]?.path);
  const file = files.find((file) => file.path === selected) ?? files[0];
  return (
    <div className="grid min-w-0 overflow-hidden rounded-control border border-border md:grid-cols-[220px_minmax(0,1fr)]">
      <div
        className="border-b border-border bg-background/70 p-2 md:border-b-0 md:border-r"
        role="group"
        aria-label="Các file trong gói"
      >
        <p className="flex items-center gap-2 px-2 py-2 text-caption font-semibold  text-muted-foreground">
          <FolderOpen size={14} aria-hidden="true" /> {files.length} file
        </p>
        {files.map((item) => (
          <button
            key={item.path}
            type="button"
            aria-pressed={file?.path === item.path}
            onClick={() => setSelected(item.path)}
            className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left font-mono text-caption leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${file?.path === item.path ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <FileCode2
              size={14}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span className="break-all">{item.path}</span>
          </button>
        ))}
      </div>
      <div className="min-w-0 bg-foreground text-background">
        <p className="flex flex-wrap gap-3 border-b border-background/20 px-4 py-3 text-caption text-background/90">
          <span className="break-all font-mono">{file?.path ?? "Chưa có file"}</span>
          <span>Chỉ đọc</span>
        </p>
        <pre
          tabIndex={0}
          aria-label={`Nội dung file ${file?.path ?? ""}`}
          className="max-h-[420px] overflow-auto p-4 text-caption leading-6 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <code>{file?.content ?? ""}</code>
        </pre>
      </div>
    </div>
  );
}
export function PackagePreview({
  material,
  archiveName,
  download = downloadStarter,
}: {
  material: LearningPackage | null;
  archiveName: string;
  download?: typeof downloadStarter;
}) {
  const [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  if (!material)
    return (
      <p className="py-4 text-body leading-6 text-muted-foreground">
        Phiên bản này chưa có gói starter. Hãy đọc đề bài và tài liệu đã giao;
        hệ thống giữ nguyên nội dung của phiên cũ.
      </p>
    );
  const files = [...material.starterFiles, ...(material.sampleData ?? [])];
  return (
    <section className="min-w-0 space-y-5" aria-label="Gói học tập công khai">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Bắt đầu từ starter</h3>
          <p className="mt-1 max-w-2xl text-body leading-6 text-muted-foreground">
            Đề bài và dữ liệu mẫu được phép dùng. Nội dung file được hiển thị
            dưới dạng văn bản, không chạy trong trình duyệt.
          </p>
        </div>
        <button
          type="button"
          className={`${buttonClass} gap-2`}
          onClick={() => {
            setError("");
            try {
              download(material, archiveName);
              setNotice(
                "Đã chuẩn bị starter ZIP. Kiểm tra thư mục tải xuống của trình duyệt.",
              );
            } catch {
              setNotice("");
              setError(
                "Không thể chuẩn bị ZIP. Hãy tải lại gói hoặc kiểm tra trình duyệt.",
              );
            }
          }}
        >
          <Download size={15} aria-hidden="true" />
          Tải starter ZIP
        </button>
      </header>
      <div className="grid gap-5 border-y border-border py-5 lg:grid-cols-[minmax(160px,1fr)_2fr_2fr]">
        <div>
          <h4 className="text-caption font-semibold  text-muted-foreground">
            Cần chuẩn bị
          </h4>
          <ul className="mt-2 list-inside list-disc space-y-1 text-body leading-6 text-foreground">
            {material.prerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-caption font-semibold  text-muted-foreground">
            Thiết lập
          </h4>
          <p className="mt-2 whitespace-pre-wrap text-body leading-6 text-foreground">
            {material.setup}
          </p>
        </div>
        <div>
          <h4 className="text-caption font-semibold  text-muted-foreground">
            Chạy và kiểm chứng
          </h4>
          <p className="mt-2 whitespace-pre-wrap text-body leading-6 text-foreground">
            {material.run}
          </p>
        </div>
      </div>
      <PackageFiles files={files} />
      <p className="text-caption leading-5 text-muted-foreground">
        ZIP gồm {files.length} file public. Lời giải, rubric và kiểm thử riêng
        của người chấm được lưu qua đường riêng.
      </p>
      {notice && (
        <p role="status" className="text-body text-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-body text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

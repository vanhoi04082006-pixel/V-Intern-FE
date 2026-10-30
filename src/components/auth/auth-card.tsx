import { Tape } from "@/components/v-intern/doodles";

export function AuthCard({ children, tabs }: { children: React.ReactNode; tabs?: React.ReactNode }) {
  return (
    <div className="auth-form-surface">
      {tabs}
      {children}
      {/* Mẩu băng dính dán lệch trên card giấy — thuần trang trí (aria-hidden). */}
      <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} />
    </div>
  );
}

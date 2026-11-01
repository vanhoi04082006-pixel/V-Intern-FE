import { PaperclipDoodle, Tape } from "@/components/v-intern/doodles";

export function AuthCard({ children, tabs }: { children: React.ReactNode; tabs?: React.ReactNode }) {
  return (
    <div className="auth-form-surface">
      {tabs}
      {children}
      {/* Băng keo sọc đỏ + kẹp giấy — card form như tờ phiếu được ghim lên sổ (thuần trang trí, aria-hidden). */}
      <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} variant="candy" />
      <PaperclipDoodle className="pointer-events-none absolute -right-3.5 -top-5 h-12 w-7 text-ink/35" />
    </div>
  );
}

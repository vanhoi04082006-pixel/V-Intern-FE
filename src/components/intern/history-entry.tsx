"use client";
import Link from 'next/link';
import { MarginNote } from '@/components/workspace/notebook';
import { StudentHeading, StudentLink } from './student-ui';
import {
  IconArrowRight,
  IconAward,
  IconChartColumn,
  IconClipboardCheck,
} from "@/components/v-intern/icons";

const destinations = [
  { href: '/intern/evaluations', title: 'Xem đánh giá đã ghi nhận', description: 'Điểm và nhận xét được giảng viên lưu theo từng kỳ.', icon: IconClipboardCheck },
  { href: '/intern/kpi', title: 'Xem KPI và lương ảo', description: 'Theo dõi kết quả từng kỳ và cách hệ thống tính chỉ số.', icon: IconChartColumn },
  { href: '/intern/certificates', title: 'Xem chứng nhận', description: 'Mở các chứng nhận đã được cấp và trạng thái xác minh.', icon: IconAward },
];

/** History does not imply completion: cancelled assignments can also leave this state. */
export function HistoryEntry({ onReload, refreshing }: { onReload: () => void; refreshing: boolean }) {
  return <div className="space-y-8">
    <StudentHeading
      title="Kết quả và lịch sử thực tập"
      description="Bạn hiện không có phân công đang hoạt động. Các đánh giá, KPI và chứng nhận đã được ghi nhận vẫn có thể xem lại tại đây."
      action={<StudentLink secondary href="/intern/notifications">Xem thông báo</StudentLink>}
    />
    <section aria-label="Truy cập kết quả thực tập">
      {/* Thẻ chờ hành động: viền đứt đường cắt giấy (đặc tả Lớp 8 — empty edge). */}
      <ul className="grid gap-3 sm:grid-cols-3">
        {destinations.map(({ href, title, description, icon: Icon }) => <li key={href}>
          <Link href={href} className="dashed-cut group flex h-full flex-col gap-2 rounded-panel bg-card p-4 text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Icon size={22} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-body leading-6 text-muted-foreground">{description}</span></span>
            <IconArrowRight size={18} className="shrink-0 self-end transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
    </section>
    <section className="flex flex-wrap items-center justify-between gap-4" aria-label="Tiếp tục hành trình">
      <MarginNote className="max-w-xl">Khi có phân công mới, không gian công việc và Sprint sẽ được cập nhật theo dữ liệu của phiên đó.</MarginNote>
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-body font-semibold">
        <button type="button" onClick={onReload} disabled={refreshing} className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60">{refreshing ? 'Đang kiểm tra phân công…' : 'Kiểm tra phân công mới'}</button>
        <Link href="/intern/onboarding/result" className="text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">Xem lại kết quả tuyển dụng</Link>
      </div>
    </section>
  </div>;
}

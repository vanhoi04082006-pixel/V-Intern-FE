/**
 * AuthCard — khung card trắng dùng chung cho Login / Register / Forgot.
 * Width responsive: ~540px ở laptop (1366/1440), 570px chỉ ở màn lớn
 * (≥1536px); padding desktop 32–40px (48px chỉ từ 2xl) để card gọn
 * trong viewport laptop. Bo góc 16px, shadow mềm lớn giữ nguyên.
 */
export function AuthCard({
  children,
  tabs,
}: {
  children: React.ReactNode;
  tabs?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[540px] rounded-2xl bg-white px-5 pb-6 pt-5 shadow-[0_28px_80px_-24px_rgba(22,36,62,0.28)] sm:px-8 sm:pb-7 sm:pt-6 2xl:max-w-[570px] xl:px-10 2xl:px-12 2xl:pb-9">
      {tabs}
      {children}
    </div>
  );
}

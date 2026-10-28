export function AuthCard({ children, tabs }: { children: React.ReactNode; tabs?: React.ReactNode }) {
  return <div className="auth-form-surface">{tabs}{children}</div>;
}

import { AuthCard } from "@/components/auth/auth-card";
import { ChangePassword } from "@/components/auth/change-password";

export default function Page() {
  return (
    <AuthCard>
      <ChangePassword />
    </AuthCard>
  );
}

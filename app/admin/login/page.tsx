import { Container } from "@/components/Container";
import { AdminLoginForm } from "@/components/forms/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="hero-glow flex min-h-screen items-center py-16 text-white">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_0.75fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.38em] text-[var(--gold)]">
            PHOTIZO Admin
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight">
            Secure ministry operations for PHOTIZO Network International
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/82">
            Sign in with your approved admin account to manage programs,
            biblical questions, salvation follow-up, registrations, contact
            messages, and settings.
          </p>
        </div>
        <AdminLoginForm />
      </Container>
    </div>
  );
}

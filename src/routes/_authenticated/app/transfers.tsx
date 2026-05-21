import { createFileRoute } from "@tanstack/react-router";
import { SectionShell } from "@/components/dashboard/SectionShell";

export const Route = createFileRoute("/_authenticated/app/transfers")({
  component: () => <SectionShell title="التحويلات" description="وحدة التحويل من المحفظة إلى الكاش — Phase 6." />,
});

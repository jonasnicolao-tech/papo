import { createFileRoute } from "@tanstack/react-router";
import { CommunitiesPanel } from "@/components/social/panels";

export const Route = createFileRoute("/comunidades/")({
  component: CommunitiesPage,
});

function CommunitiesPage() {
  return <CommunitiesPanel />;
}

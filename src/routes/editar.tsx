import { createFileRoute } from "@tanstack/react-router";
import { EditPanel } from "@/components/social/panels";

export const Route = createFileRoute("/editar")({
  component: EditPage,
});

function EditPage() {
  return <EditPanel />;
}

import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { TestimonialsPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/depoimentos")({
  component: DepoimentosPage,
});

function DepoimentosPage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="depoimentos">
      <TestimonialsPanel id={id} />
    </ProfileChrome>
  );
}

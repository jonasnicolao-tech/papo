import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { PhotosPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/fotos")({
  component: FotosPage,
});

function FotosPage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="fotos">
      <PhotosPanel id={id} />
    </ProfileChrome>
  );
}

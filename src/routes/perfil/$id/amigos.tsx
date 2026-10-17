import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { FriendsPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/amigos")({
  component: AmigosPage,
});

function AmigosPage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="amigos">
      <FriendsPanel id={id} />
    </ProfileChrome>
  );
}

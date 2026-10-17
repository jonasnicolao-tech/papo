import { createFileRoute } from "@tanstack/react-router";
import { SearchPanel } from "@/components/social/panels";

type BuscaSearch = { q: string };

export const Route = createFileRoute("/busca")({
  validateSearch: (search: Record<string, unknown>): BuscaSearch => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const { q } = Route.useSearch();
  return <SearchPanel q={q} />;
}

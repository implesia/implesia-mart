import { Container } from "../../_components/common/container";

export default function BlogArticleLoading() {
  return (
    <main className="force-light w-full bg-[#f5f6f8] text-neutral-950" aria-busy="true">
      <Container className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          লোড হচ্ছে…
        </span>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-4/5 animate-pulse rounded bg-[#e9ebef]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#eef0f3]" />
          <div className="aspect-16/9 w-full animate-pulse rounded-2xl bg-[#e9ebef]" />
          <div className="h-3 w-full animate-pulse rounded bg-[#eef0f3]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-[#eef0f3]" />
        </div>
      </Container>
    </main>
  );
}

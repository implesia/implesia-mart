import { Container } from "../../_components/common/container";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
      <div className="aspect-[16/10] animate-pulse bg-[#e9ebef]" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#e9ebef]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#eef0f3]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#eef0f3]" />
      </div>
    </div>
  );
}

export default function BlogsLoading() {
  return (
    <main
      className="force-light w-full bg-[#f5f6f8] text-neutral-950"
      aria-busy="true"
      data-testid="blogs-loading"
    >
      <Container className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          লোড হচ্ছে…
        </span>
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[#e9ebef]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </main>
  );
}

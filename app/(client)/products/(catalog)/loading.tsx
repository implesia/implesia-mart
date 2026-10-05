import { Container } from "../../_components/common/container";

function Bone({ className }: { className: string }) {
  return (
    <div
      className={`motion-reduce:animate-none animate-pulse rounded-xl bg-neutral-200/80 ${className}`}
    />
  );
}

export default function ProductsLoading() {
  return (
    <main className="force-light w-full overflow-x-clip bg-[#f5f6f8]">
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 pb-6 sm:pt-4">
          <p className="sr-only" role="status">
            পণ্য লোড হচ্ছে
          </p>
          <Bone className="mb-3 h-8 w-40" />
          <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80"
              >
                <Bone className="aspect-4/5 w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Bone className="h-4 w-2/3" />
                  <Bone className="h-4 w-full" />
                  <Bone className="h-6 w-1/2" />
                  <Bone className="h-11 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}

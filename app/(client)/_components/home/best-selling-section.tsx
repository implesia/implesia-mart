import { Container } from "../common/container";
import { BestSellingCarousel } from "./best-selling-carousel";

export function BestSellingSection() {
  return (
    <section
      id="electronics"
      className="overflow-hidden bg-surface-container-low py-10 sm:py-12 lg:py-xl dark:bg-background"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <BestSellingCarousel />
      </Container>
    </section>
  );
}

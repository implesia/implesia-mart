import { Container } from "../common/container";
import { BestSellingCarousel } from "./best-selling-carousel";

export function BestSellingSection() {
  return (
    <section
      id="popular-products"
      className="overflow-hidden bg-surface-container-low py-12 sm:py-14 lg:py-20 dark:bg-background"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <BestSellingCarousel />
      </Container>
    </section>
  );
}

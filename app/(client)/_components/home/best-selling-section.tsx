import { Container } from "../common/container";
import { BestSellingCarousel } from "./best-selling-carousel";

export function BestSellingSection() {
  return (
    <section
      id="electronics"
      className="overflow-hidden bg-surface-container-low py-xl"
    >
      <Container className="px-8">
        <BestSellingCarousel />
      </Container>
    </section>
  );
}

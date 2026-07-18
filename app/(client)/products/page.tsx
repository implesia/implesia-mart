import { Container } from "../_components/common/container";
import { products } from "../_data/products/products";
import { ProductsCatalog } from "./_components/products-catalog";

export default function ProductsPage() {
  return (
    <main className="w-full pt-16 sm:pt-20">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="w-full py-8 lg:py-10">
          <ProductsCatalog products={products} />
        </div>
      </Container>
    </main>
  );
}

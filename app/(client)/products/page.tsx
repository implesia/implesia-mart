import { products } from "../_data/products/products";
import { ProductsFilters } from "./_components/products-filters";
import { ProductsGrid } from "./_components/products-grid";
import { ProductsToolbar } from "./_components/products-toolbar";

export default function ProductsPage() {
  return (
    <main className="mx-auto flex max-w-7xl pt-20">
      <ProductsFilters />
      <section className="min-w-0 flex-1 px-8 py-12">
        <ProductsToolbar />
        <ProductsGrid products={products} />
      </section>
    </main>
  );
}

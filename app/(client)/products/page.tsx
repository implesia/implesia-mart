import { products } from "../_data/products/products";
import { ProductsFilters } from "./_components/products-filters";
import { ProductsGrid } from "./_components/products-grid";
import { ProductsPagination } from "./_components/products-pagination";
import { ProductsToolbar } from "./_components/products-toolbar";

export default function ProductsPage() {
  return (
    <main className="mx-auto flex max-w-[1440px] pt-20">
      <ProductsFilters />
      <section className="min-w-0 flex-1 px-8 py-12">
        <ProductsToolbar />
        <ProductsGrid products={products} />
        <ProductsPagination />
      </section>
    </main>
  );
}

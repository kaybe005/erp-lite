import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProductForm } from "@/components/products/product-form"

export default function NewProductPage() {
  return (
    <PageWrapper title="Add Product" description="Create a new product in your inventory">
      <ProductForm />
    </PageWrapper>
  )
}

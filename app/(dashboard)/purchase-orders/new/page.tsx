import { PageWrapper } from "@/components/layout/page-wrapper"
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form"

export default function NewPurchaseOrderPage() {
  return (
    <PageWrapper
      title="New Purchase Order"
      description="Create a new order for your supplier"
    >
      <PurchaseOrderForm />
    </PageWrapper>
  )
}

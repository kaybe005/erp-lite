import { Suspense } from "react"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form"
import { Spinner } from "@/components/ui/spinner"

export default function NewPurchaseOrderPage() {
  return (
    <PageWrapper
      title="New Purchase Order"
      description="Create a new order for your supplier"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Spinner className="w-8 h-8" />
          </div>
        }
      >
        <PurchaseOrderForm />
      </Suspense>
    </PageWrapper>
  )
}

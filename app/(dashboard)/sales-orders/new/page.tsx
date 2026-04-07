import { PageWrapper } from "@/components/layout/page-wrapper"
import { SalesOrderForm } from "@/components/sales-orders/sales-order-form"

export default function NewSalesOrderPage() {
  return (
    <PageWrapper
      title="New Sales Order"
      description="Create a new customer sale"
    >
      <SalesOrderForm />
    </PageWrapper>
  )
}

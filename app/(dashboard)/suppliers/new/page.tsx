import { PageWrapper } from "@/components/layout/page-wrapper"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default function NewSupplierPage() {
  return (
    <PageWrapper title="Add Supplier" description="Create a new supplier">
      <SupplierForm />
    </PageWrapper>
  )
}

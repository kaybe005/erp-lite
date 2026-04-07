"use client"

import { use } from "react"
import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/suppliers/${id}`, fetcher)

  if (isLoading) {
    return (
      <PageWrapper title="Edit Supplier">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    )
  }

  if (!data?.data) {
    return (
      <PageWrapper title="Edit Supplier">
        <div className="text-center text-muted-foreground">Supplier not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Edit Supplier" description="Update supplier details">
      <SupplierForm supplier={data.data} />
    </PageWrapper>
  )
}

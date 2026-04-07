"use client"

import { use } from "react"
import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProductForm } from "@/components/products/product-form"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/products/${id}`, fetcher)

  if (isLoading) {
    return (
      <PageWrapper title="Edit Product">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    )
  }

  if (!data?.data) {
    return (
      <PageWrapper title="Edit Product">
        <div className="text-center text-muted-foreground">Product not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Edit Product" description="Update product details">
      <ProductForm product={data.data} />
    </PageWrapper>
  )
}

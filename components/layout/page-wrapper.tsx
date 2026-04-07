import { Header } from "./header"

interface PageWrapperProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function PageWrapper({ title, description, children, action }: PageWrapperProps) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title={title} description={description} />
      <main className="flex-1 p-6">
        {action && (
          <div className="flex justify-end mb-6">{action}</div>
        )}
        {children}
      </main>
    </div>
  )
}

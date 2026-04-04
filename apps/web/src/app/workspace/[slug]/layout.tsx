import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workspace",
  description: "View and manage your workspace",
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

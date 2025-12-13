import type { ReactNode } from "react"

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-screen overflow-hidden">{children}</div>
}

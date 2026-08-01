import { useMemo } from "react"
import { RouterProvider } from "react-router-dom"
import { createRouter } from "@/common/router/router"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"

export default function App() {
  const [role] = useCookie<string>(COOKIE_NAME.ROLE)

  const router = useMemo(() => createRouter(role), [role])

  return <RouterProvider router={router} />
}

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { CookiesProvider } from "react-cookie"
import { Toaster } from "react-hot-toast"
import "./index.css"
import App from "./App.tsx"
import { queryClient } from "@/common/lib/queryClient.ts"
import { TOAST_OPTIONS } from "@/common/constants/toast.ts"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
        <App />
      </QueryClientProvider>
    </CookiesProvider>
  </StrictMode>
)

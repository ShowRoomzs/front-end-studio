import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { fetchProxiedImage, resolveProxyTarget } from "./api/_imageProxy"

/**
 * 로컬 개발용 이미지 프록시.
 *
 * 배포에서는 `api/image-proxy.ts`(Vercel 함수)가 같은 일을 하지만 그 함수는 `vite dev`에서
 * 돌지 않는다. 그대로 두면 "이미 올라간 사진의 크롭 조정"이 로컬에서만 실패해, 고쳐 놓고도
 * 안 고쳐진 것처럼 보인다. 허용 규칙은 같은 모듈을 공유한다.
 */
function imageProxyDevPlugin(): Plugin {
  return {
    name: "studio-image-proxy-dev",
    configureServer(server) {
      server.middlewares.use("/api/image-proxy", (req, res) => {
        const requested = new URL(
          req.url ?? "",
          "http://localhost"
        ).searchParams.get("url")
        const target = resolveProxyTarget(requested)

        if (!target) {
          res.statusCode = 400
          res.end("허용되지 않은 주소입니다.")
          return
        }

        fetchProxiedImage(target)
          .then(image => {
            res.setHeader("Content-Type", image.contentType)
            res.end(image.body)
          })
          .catch((error: unknown) => {
            res.statusCode = 502
            res.end(error instanceof Error ? error.message : "원본 로드 실패")
          })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

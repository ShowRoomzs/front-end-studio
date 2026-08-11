import Header from "@/common/components/MainLayout/Header"
import {
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_WIDTH,
} from "@/common/components/MainLayout/config"
import Sidebar from "@/common/components/Sidebar/Sidebar"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { CREATOR_MENU } from "@/common/constants/menu"
import { cookie } from "@/common/lib/cookie"
import { useGetThreadSummary } from "@/features/connections/hooks/useGetThreadSummary"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

/**
 * 셸의 여백·제목·스크롤을 화면이 직접 가져가는 경로들.
 *
 * 연결·소통처럼 좌우 2패널이 화면 끝까지 꽉 차고 **내부 영역만 각자 스크롤**되는
 * 화면은 셸이 `p-6`·`overflow-auto`를 걸면 구조가 깨진다.
 */
const FULL_BLEED_PREFIXES = ["/connections"]

export default function MainLayout() {
  const location = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored === null ? true : stored === "true"
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen))
  }, [isSidebarOpen])

  const handleLogout = useCallback(() => {
    cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
    cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
    cookie.remove(COOKIE_NAME.ROLE)

    /*
      로그인과 같은 이유로 navigate가 아니라 문서를 새로 띄운다 — role 쿠키가
      빠지면 라우트 트리가 통째로 갈아끼워지는데, navigate는 아직 살아 있는
      mainRoutes에서 실행돼 주소와 화면이 어긋난다.

      덤으로 이전 사용자의 조회 캐시(스레드 목록·메시지)가 메모리에서 사라진다.
      같은 브라우저에서 다른 계정으로 다시 로그인할 때 남의 대화가 잠깐
      비치는 걸 막는다.
    */
    window.location.replace("/login")
  }, [])

  const isFullBleed = FULL_BLEED_PREFIXES.some(
    prefix =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  )

  const currentMenu = CREATOR_MENU.groups.find(
    item =>
      item.path &&
      (location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`))
  )

  const { data: threadSummary } = useGetThreadSummary()

  return (
    <div className="flex h-screen bg-sz-n-50">
      <Sidebar
        menu={CREATOR_MENU}
        isOpen={isSidebarOpen}
        badgeCounts={{ connections: threadSummary?.unreadCount ?? 0 }}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{ marginLeft: isSidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px` }}
      >
        <Header
          title={currentMenu?.label}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
        />

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isFullBleed ? "overflow-hidden" : "overflow-auto p-6"
          )}
        >
          {/* 디자인시스템 H1 — 20px/600 */}
          {!isFullBleed && currentMenu && (
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-sz-n-900">
              {currentMenu.label}
            </h1>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

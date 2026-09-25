import Header from "@/common/components/MainLayout/Header"
import {
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_WIDTH,
} from "@/common/components/MainLayout/config"
import Sidebar from "@/common/components/Sidebar/Sidebar"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { CREATOR_MENU } from "@/common/constants/menu"
import { useGetShowroomName } from "@/common/hooks/useGetShowroomName"
import { cookie } from "@/common/lib/cookie"
import { useGetThreadSummary } from "@/features/connections/hooks/useGetThreadSummary"
import { useGetCreatorContractSummary } from "@/features/contracts/hooks/useCreatorContractQueries"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

/**
 * 셸의 여백·제목·스크롤을 화면이 직접 가져가는 경로들.
 *
 * 연결·소통처럼 좌우 2패널이 화면 끝까지 꽉 차고 **내부 영역만 각자 스크롤**되는
 * 화면은 셸이 `p-6`·`overflow-auto`를 걸면 구조가 깨진다.
 */
const FULL_BLEED_PREFIXES = ["/connections"]

/**
 * 셸이 H1을 그리지 않는 경로 — 화면이 제목을 직접 그린다.
 *
 * 계약 관리는 목록에 설명 줄이 붙고, 상세는 공구명이 제목이라 셸 H1로는 표현할 수 없다.
 * 탑바 crumb는 그대로 셸이 그린다(상세는 `usePageSubtitle("계약서")`로 하위 이름을 올린다).
 */
const SELF_TITLED_PREFIXES = ["/contracts"]

export default function MainLayout() {
  const location = useLocation()

  /**
   * 메뉴 아래 화면명 — `usePageSubtitle`로 자식 화면이 올린다.
   *
   * 라우트가 바뀔 때 여기서 지우지 않는다. 훅의 정리 함수가 이미 언마운트 시점에
   * 되돌리는데, 여기서 또 지우면 새 화면이 올린 값을 이전 화면의 정리가 덮는다.
   */
  const [subtitle, setSubtitle] = useState<string | null>(null)
  const shellContext = useMemo(() => ({ setSubtitle }), [])

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

  const isSelfTitled = SELF_TITLED_PREFIXES.some(
    prefix =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  )

  const { data: threadSummary } = useGetThreadSummary()
  // 계약 GNB 배지 — 내 서명이 필요한 계약 건수. 놓치면 만료라 계약 화면 밖에서도 폴링한다
  const { data: contractSummary } = useGetCreatorContractSummary()
  const { data: showroom } = useGetShowroomName()

  return (
    <div className="flex h-screen bg-sz-n-50">
      <Sidebar
        menu={CREATOR_MENU}
        isOpen={isSidebarOpen}
        badgeCounts={{
          connections: threadSummary?.unreadCount ?? 0,
          contracts: contractSummary?.actionRequiredCount ?? 0,
        }}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{ marginLeft: isSidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px` }}
      >
        <Header
          title={currentMenu?.label}
          subtitle={subtitle}
          showroomName={showroom?.showroomName}
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
          {!isFullBleed && !isSelfTitled && (currentMenu || subtitle) && (
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-sz-n-900">
              {subtitle ?? currentMenu?.label}
            </h1>
          )}
          <Outlet context={shellContext} />
        </main>
      </div>
    </div>
  )
}

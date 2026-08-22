import { HEADER_HEIGHT } from "@/common/components/MainLayout/config"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface HeaderProps {
  /** 현재 화면명 (시안 `.crumb`) — GNB 라벨 */
  title?: string
  /** 메뉴 아래 화면명 (시안 `.crumb-s`) — 없으면 crumb는 메뉴 라벨 하나로 끝난다 */
  subtitle?: string | null
  /** 시안 `.brand-chip` — 없으면(로딩·조회 실패) 칩 자체를 그리지 않는다 */
  showroomName?: string
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

/**
 * 쇼룸 스튜디오 탑바 — 시안 `.top`. 사이드바 **우측에만** 걸친다(높이 56px).
 * 로고는 여기가 아니라 사이드바 상단(`.side-brand`)에 있다.
 */
export default function Header(props: HeaderProps) {
  const {
    title,
    subtitle,
    showroomName,
    isSidebarOpen,
    onToggleSidebar,
    onLogout,
  } = props

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-3 border-b border-sz-n-200 bg-white px-6"
      style={{ height: `${HEADER_HEIGHT}px` }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="-ml-2 shrink-0 cursor-pointer rounded-[6px] p-1.5 text-sz-n-500 transition-colors hover:bg-sz-n-100 hover:text-sz-n-700"
          aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* 시안 `.crumb` — 16px/600 */}
        <div className="min-w-0 truncate text-[16px] font-semibold text-sz-n-900">
          {title}
          {subtitle && (
            // 시안 `.crumb-s` — 12px/400 --n-400. 굵기·크기를 낮춰야 현재 위치가
            // 메뉴가 아니라 그 아래 화면이라는 게 읽힌다
            <span className="ml-1.5 text-[12px] font-normal text-sz-n-400">
              &rsaquo; {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {showroomName && (
          <div className="flex items-center gap-[7px] text-[12px] text-sz-n-600">
            <span className="max-w-[180px] truncate">{showroomName}</span>
            {/*
              시안의 상태 배지. 지금은 세션에서 파생된 값이다 — role=CREATOR가
              아니면 이 셸에 들어올 수 없으므로(router.ts) 여기 서 있다는 것
              자체가 활성 계정이라는 뜻이다. 서버가 계정 상태를 따로 내려주기
              시작하면 그 값으로 바꿔야 한다(정지·휴면을 구분할 수 없다).
            */}
            <span className="rounded-[10px] bg-sz-success-bg px-2.5 py-0.5 text-[11px] font-medium text-sz-success-text">
              활성
            </span>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-8 shrink-0 px-2.5 text-sz-n-700 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          <LogOut className="size-4" aria-hidden />
          로그아웃
        </Button>
      </div>
    </header>
  )
}

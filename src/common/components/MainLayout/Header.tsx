import { HEADER_HEIGHT } from "@/common/components/MainLayout/config"
import NotificationBell from "@/features/home/components/NotificationBell/NotificationBell"

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
  /** 계정 이용 정지(ui-studio-13) — 계정 배지가 「정지」(위험 톤)로 바뀐다 */
  isSuspended?: boolean
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
    isSuspended = false,
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

      {/* 시안 `.sz-tr` — 알림 종 · 브랜드 칩 간격 14px */}
      <div className="flex shrink-0 items-center gap-3.5">
        {/* 시안 14 H1a — 모든 페이지 공통 알림 종 */}
        <NotificationBell />
        <div className="flex items-center gap-[7px] text-[12px] text-sz-n-600">
          {showroomName && (
            <>
              <span className="max-w-[180px] truncate">{showroomName}</span>
              {/* 시안 상태 배지 — 계정 상태 API(`/creator/account-status`) 기준 활성 · 정지(ui-studio-13) */}
              {isSuspended ? (
                <span className="rounded-[10px] bg-sz-danger-bg px-2.5 py-0.5 text-[11px] font-medium text-sz-danger-text">
                  정지
                </span>
              ) : (
                <span className="rounded-[10px] bg-sz-success-bg px-2.5 py-0.5 text-[11px] font-medium text-sz-success-text">
                  활성
                </span>
              )}
              {/* 시안 `.sz-sep` */}
              <span aria-hidden className="mx-1.5 h-3.5 w-px bg-sz-n-200" />
            </>
          )}
          {/* 시안 `.sz-logout` — 11px · n-500 · 테두리 n-200 · 패딩 4/9 */}
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 cursor-pointer rounded-[6px] border border-sz-n-200 bg-white px-[9px] py-1 text-[11px] text-sz-n-500 transition-colors hover:bg-sz-n-100 hover:text-sz-n-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}

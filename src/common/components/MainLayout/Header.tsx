import { HEADER_HEIGHT } from "@/common/components/MainLayout/config"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface HeaderProps {
  /** 현재 화면명 (시안 `.crumb`) */
  title?: string
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

/**
 * 쇼룸 스튜디오 탑바 — 시안 `.top`. 사이드바 **우측에만** 걸친다(높이 56px).
 * 로고는 여기가 아니라 사이드바 상단(`.side-brand`)에 있다.
 *
 * 시안의 우측 브랜드 칩(쇼룸명 + "활성")은 아직 비워 둔다 —
 * 로그인한 크리에이터의 쇼룸명을 내려주는 API가 없다.
 */
export default function Header(props: HeaderProps) {
  const { title, isSidebarOpen, onToggleSidebar, onLogout } = props

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
        </div>
      </div>

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
    </header>
  )
}

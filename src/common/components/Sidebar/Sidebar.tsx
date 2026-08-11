import { Wordmark } from "@/common/components/Auth/Wordmark"
import {
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
} from "@/common/components/MainLayout/config"
import type { MenuConfig, MenuItem } from "@/common/types/menu"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"

interface SidebarProps {
  menu: MenuConfig
  isOpen: boolean
  /**
   * 메뉴 id → 배지 숫자. 0이거나 없으면 배지를 그리지 않는다.
   * 메뉴 정의(`menu.ts`)는 정적 상수라 실시간 카운트를 담을 수 없어 밖에서 주입받는다.
   */
  badgeCounts?: Record<string, number>
}

/**
 * 쇼룸 스튜디오 셸 사이드바 (시안 `.side`).
 *
 * 배경 --n-100 · 우측 --n-200 보더 · 현재 화면인 항목만 --accent-500으로 채운다.
 * 하위 메뉴가 없는 9개 평면 항목이라 아코디언 없이 번호 목록으로만 그린다.
 */
export default function Sidebar(props: SidebarProps) {
  const { menu, isOpen, badgeCounts } = props
  const location = useLocation()
  const navigate = useNavigate()

  const isItemActive = (item: MenuItem) =>
    (item.matchPaths ?? (item.path ? [item.path] : [])).some(
      path =>
        location.pathname === path || location.pathname.startsWith(`${path}/`)
    )

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-sz-n-200 bg-sz-n-100 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* 시안 `.side-brand` — 탑바와 같은 높이(56px)라야 구분선이 한 줄로 이어진다 */}
      <div
        className="flex shrink-0 items-center gap-2 border-b border-sz-n-200 px-4"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="홈으로"
          className="flex cursor-pointer items-center"
        >
          <Wordmark width={112} height={12} />
        </button>
        <span className="ml-0.5 border-l border-sz-n-300 pl-2 text-[11px] font-medium text-sz-n-500">
          쇼룸 스튜디오
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {menu.groups.map((item, index) => {
          const isActive = isItemActive(item)
          const badgeCount = badgeCounts?.[item.id] ?? 0
          // 아직 화면이 없는 항목은 눌러도 갈 곳이 없다
          const isPlaceholder = !item.path

          return (
            <button
              key={item.id}
              type="button"
              disabled={isPlaceholder}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[9px] text-left text-[12px]",
                isActive
                  ? "bg-sz-accent-500 font-medium text-white"
                  : "text-sz-n-600",
                !isActive && !isPlaceholder && "hover:bg-sz-n-200",
                isPlaceholder && "cursor-default text-sz-n-400"
              )}
            >
              <span
                className={cn(
                  "w-[15px] shrink-0 text-center text-[11px]",
                  isActive ? "text-white/80" : "text-sz-n-400"
                )}
              >
                {index + 1}
              </span>
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                // 시안 `.gcnt` — 활성 항목(파란 배경) 위에서도 빨간색을 유지한다
                <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[9px] bg-sz-danger-text px-[5px] text-[10px] font-semibold text-white">
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

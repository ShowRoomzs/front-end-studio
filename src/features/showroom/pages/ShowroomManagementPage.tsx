import ConnectionCodeCard from "@/features/showroom/components/ConnectionCodeCard/ConnectionCodeCard"
import ProfileForm from "@/features/showroom/components/ProfileForm/ProfileForm"
import ShowroomTabs, {
  type ShowroomTab,
} from "@/features/showroom/components/ShowroomTabs/ShowroomTabs"
import StatsPanel from "@/features/showroom/components/stats/StatsPanel"
import {
  DEFAULT_STATS_PERIOD,
  DEFAULT_TOP_CONTENT_SORT,
} from "@/features/showroom/constants/params"
import {
  useGetShowroomProfile,
  useGetShowroomStats,
} from "@/features/showroom/hooks/useShowroomQueries"
import type { StatsPeriod, TopContentSort } from "@/features/showroom/types"
import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * GNB #8 쇼룸 관리 — 쇼룸 프로필 / 쇼룸 현황 2탭.
 *
 * 이 화면에는 **소비자에게 공개되는 정보만** 담긴다. 계정·사업자 정보·정산 계좌·
 * 활동 채널은 비공개라 기본정보 관리(#9)가 맡는다 — "소비자가 보느냐"가 두 메뉴를
 * 가르는 유일한 기준이다.
 *
 * 탭·기간·정렬을 쿼리스트링에 둔다. 지표를 보다가 새로고침하거나 링크를 공유해도
 * 같은 화면이 열려야 한다 — 로컬 state로 두면 매번 30일 프로필 탭으로 되돌아간다.
 */
export default function ShowroomManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (
    searchParams.get("tab") === "stats" ? "stats" : "profile"
  ) as ShowroomTab
  const period = (searchParams.get("period") ??
    DEFAULT_STATS_PERIOD) as StatsPeriod
  const topContentSort = (searchParams.get("sort") ??
    DEFAULT_TOP_CONTENT_SORT) as TopContentSort

  const updateParam = useCallback(
    (patch: Record<string, string>) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([key, value]) => next.set(key, value))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const { data: profile, isLoading: isProfileLoading } = useGetShowroomProfile()
  // 현황은 그 탭을 열었을 때만 부른다(무거운 집계 조회다)
  const { data: stats, isLoading: isStatsLoading } = useGetShowroomStats(
    { period, topContentSort },
    tab === "stats"
  )

  return (
    <>
      <ShowroomTabs
        tab={tab}
        onTabChange={nextTab => updateParam({ tab: nextTab })}
        period={period}
        onPeriodChange={nextPeriod => updateParam({ period: nextPeriod })}
      />

      {tab === "profile" ? (
        isProfileLoading || !profile ? (
          <LoadingBlock isLoading={isProfileLoading} />
        ) : (
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <ProfileForm profile={profile} />
            </div>
            <div className="w-[400px] shrink-0">
              <ConnectionCodeCard connectionCode={profile.connectionCode} />
            </div>
          </div>
        )
      ) : isStatsLoading || !stats ? (
        <LoadingBlock isLoading={isStatsLoading} />
      ) : (
        <StatsPanel
          stats={stats}
          onSortChange={sort => updateParam({ sort })}
        />
      )}
    </>
  )
}

function LoadingBlock(props: { isLoading: boolean }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
      {props.isLoading ? "불러오는 중…" : "정보를 불러오지 못했습니다."}
    </div>
  )
}

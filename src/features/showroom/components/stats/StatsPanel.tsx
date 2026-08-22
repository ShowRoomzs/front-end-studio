import {
  CardSection,
  NoteBox,
  ShowroomCard,
} from "@/features/showroom/components/ShowroomCard/ShowroomCard"
import DistributionBars, {
  DistributionGroup,
  StatsEmpty,
} from "@/features/showroom/components/stats/DistributionBars"
import StatGroup from "@/features/showroom/components/stats/StatGroup"
import TopContentList from "@/features/showroom/components/stats/TopContentList"
import {
  SELECT_CHEVRON_STYLE,
  TOP_CONTENT_SORT_OPTIONS,
} from "@/features/showroom/constants/params"
import type { ShowroomStats, TopContentSort } from "@/features/showroom/types"
import {
  formatChangeRate,
  formatCount,
  formatDelta,
  formatRatio,
  formatVisitCount,
  toComparisonLabel,
} from "@/features/showroom/utils/formatStats"

interface StatsPanelProps {
  stats: ShowroomStats
  onSortChange: (sort: TopContentSort) => void
}

/**
 * S6·S7 — 쇼룸 현황 7카드.
 *
 * 쇼룸이라는 **공개 채널의 반응 지표**만 담는다. 개별 팔로워 목록·언팔로우 수·
 * 판매/정산 수치는 어떤 카드에도 없다 — 앞의 둘은 표시하지 않기로 못 박은 값이고,
 * 뒤는 판매 현황(#6)·정산 관리(#7) 소관이다.
 *
 * 데이터가 없어도 **카드를 숨기지 않는다.** 수치는 `0`·`—`, 분포는 카드별 문구로
 * 자리를 지킨다.
 */
export default function StatsPanel(props: StatsPanelProps) {
  const { stats, onSortChange } = props
  const { follower, reach, composition, region, behavior } = stats

  const hasComposition =
    composition.ageGroups.length > 0 || composition.genders.length > 0

  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <ShowroomCard title="팔로워">
          <CardSection>
            <StatGroup
              items={[
                { value: formatCount(follower.total), label: "총 팔로워" },
                {
                  value: formatDelta(follower.newFollowers),
                  label: "기간 내 신규",
                  emphasized: true,
                },
                {
                  value: formatChangeRate(follower.changeRate),
                  label: toComparisonLabel(stats.periodLabel),
                },
              ]}
            />
          </CardSection>
        </ShowroomCard>

        <ShowroomCard title="쇼룸 도달">
          <CardSection>
            <StatGroup
              items={[
                { value: formatCount(reach.visits), label: "쇼룸 순방문" },
                { value: formatCount(reach.visitors), label: "방문자 수" },
                {
                  value: formatRatio(reach.followConversionRate),
                  label: "팔로우 전환율",
                  emphasized: true,
                },
              ]}
            />
            <NoteBox className="mt-3">
              <b className="text-sz-n-900">순방문</b>은 방문 횟수(같은 소비자의
              재방문은 30분 세션 기준 1회) ·{" "}
              <b className="text-sz-n-900">방문자 수</b>는 같은 소비자를 중복
              없이 센 사람 수 · <b className="text-sz-n-900">팔로우 전환율</b>은
              기간 내 신규 팔로워 ÷ 방문자 수입니다.
            </NoteBox>
          </CardSection>
        </ShowroomCard>

        <ShowroomCard title="팔로워 구성" note="집계값만 · 개인 식별 정보 없음">
          <CardSection>
            {hasComposition ? (
              <>
                <DistributionGroup label="연령대">
                  <DistributionBars rows={composition.ageGroups} />
                </DistributionGroup>
                <DistributionGroup label="성별" divided>
                  <DistributionBars rows={composition.genders} />
                </DistributionGroup>
                <NoteBox className="mt-3">
                  소셜 로그인 시{" "}
                  <b className="text-sz-n-900">
                    연령대 · 성별 제공에 동의한 팔로워
                  </b>
                  만 집계됩니다. 동의하지 않은 팔로워는 미확인으로 분류됩니다.
                </NoteBox>
              </>
            ) : (
              <StatsEmpty>
                팔로워가 모이면 연령 · 성별 구성이 표시됩니다
              </StatsEmpty>
            )}
          </CardSection>
        </ShowroomCard>

        <ShowroomCard title="지역 분포">
          <CardSection>
            {region.items.length > 0 ? (
              <>
                <DistributionBars rows={region.items} />
                <NoteBox className="mt-3">
                  공구 구매 시 입력한{" "}
                  <b className="text-sz-n-900">배송지 시 · 도</b> 기준입니다.
                  구매 이력이 없는 팔로워는 집계에서 빠집니다.
                </NoteBox>
              </>
            ) : (
              <StatsEmpty>표시할 데이터가 없습니다</StatsEmpty>
            )}
          </CardSection>
        </ShowroomCard>
      </div>

      <div className="flex w-[400px] shrink-0 flex-col gap-4">
        <ShowroomCard title="팔로워 행동">
          <CardSection>
            <StatGroup
              direction="column"
              items={[
                {
                  value: formatVisitCount(behavior.averageVisitsPerFollower),
                  label: "팔로워 평균 방문 횟수",
                },
                {
                  value: formatRatio(behavior.followerRevisitRate),
                  label: "팔로워 재방문율",
                },
                {
                  value: formatRatio(behavior.followerShareOfVisitors),
                  label: "방문자 중 팔로워 비중",
                },
              ]}
            />
          </CardSection>
        </ShowroomCard>

        <ShowroomCard
          title="인기 콘텐츠 TOP 5"
          note={
            <select
              aria-label="인기 콘텐츠 정렬"
              value={stats.topContentSort}
              onChange={event =>
                onSortChange(event.target.value as TopContentSort)
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 shrink-0 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[28px] text-[11px] text-sz-n-700 outline-none focus:border-sz-accent-500"
            >
              {TOP_CONTENT_SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        >
          <CardSection>
            {stats.topContents.length > 0 ? (
              <TopContentList items={stats.topContents} />
            ) : (
              <StatsEmpty>아직 게시물이 없습니다</StatsEmpty>
            )}
          </CardSection>
        </ShowroomCard>

        <ShowroomCard title="유입 경로">
          <CardSection>
            {stats.sources.length > 0 ? (
              <>
                <DistributionBars
                  rows={stats.sources.map(source => ({
                    label: source.label,
                    ratio: source.ratio,
                    suffix: ` · ${formatCount(source.visits)}`,
                  }))}
                />
                <NoteBox className="mt-3">
                  쇼룸 링크에 붙은 소스 값으로 구분합니다. 소스가 없는 방문은{" "}
                  <b className="text-sz-n-900">직접 유입</b>으로 집계됩니다.
                </NoteBox>
              </>
            ) : (
              <StatsEmpty>아직 방문 기록이 없습니다</StatsEmpty>
            )}
          </CardSection>
        </ShowroomCard>
      </div>
    </div>
  )
}

import { INSIGHT_PERIODS } from "@/features/posts/constants/params"
import { useGetPostInsights } from "@/features/posts/hooks/useGetPostInsights"
import type {
  DistributionItem,
  StatsPeriod,
} from "@/features/posts/services/postInsightService"
import {
  formatCount,
  formatDateTime,
  formatRate,
} from "@/features/posts/utils/format"
import { cn } from "@/lib/utils"

function Stat(props: { value: string; label: string; isKey?: boolean }) {
  const { value, label, isKey } = props

  return (
    <div
      className={cn(
        "flex-1 rounded-[6px] border px-3.5 py-3",
        isKey
          ? "border-sz-accent-100 bg-sz-accent-50"
          : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div
        className={cn(
          "text-[19px] leading-[1.25] font-semibold tabular-nums",
          isKey ? "text-sz-accent-600" : "text-sz-n-900"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-sz-n-500">{label}</div>
    </div>
  )
}

function DistBar(props: { title: string; items: Array<DistributionItem> }) {
  const { title, items } = props

  return (
    <div>
      <div className="mb-[9px] text-[11px] font-semibold text-sz-n-600">
        {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map(item => (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-sz-n-600">
              <span>{item.label}</span>
              <span className="font-semibold text-sz-n-900 tabular-nums">
                {item.ratio.toFixed(0)}%
              </span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-[3px] bg-sz-n-100">
              <i
                className="block h-full rounded-[3px] bg-sz-accent-500"
                style={{ width: `${item.ratio}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Note(props: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
      {props.children}
    </p>
  )
}

function Section(props: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-sz-n-200 p-[18px] last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-sz-n-900">
        {props.title}
        {props.hint && (
          <span className="text-[11px] font-normal text-sz-n-500">
            {props.hint}
          </span>
        )}
      </div>
      {props.children}
    </div>
  )
}

/**
 * 게시물 인사이트 3단 (§24-7) — 반응 / 이 게시물을 보고 한 행동 / 본 사람.
 *
 * 용어는 쇼룸 관리(#8)와 맞춘다 — 와이어의 "조회수"는 **노출**이고 좋아요율은 좋아요 ÷ 노출이다.
 * 매출·구매는 판매 현황(#6) 소관이라 여기 없다.
 */
export default function InsightPanel(props: {
  postId: number
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
}) {
  const { postId, period, onPeriodChange } = props
  const { data, isLoading } = useGetPostInsights(postId, period)

  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px]">
        <span className="text-[13px] font-semibold text-sz-n-900">
          인사이트
        </span>
        <select
          value={period}
          onChange={event => onPeriodChange(event.target.value as StatsPeriod)}
          className="h-7 cursor-pointer rounded-[6px] border border-sz-n-300 bg-white px-2 text-[11px] text-sz-n-700"
        >
          {INSIGHT_PERIODS.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading || !data ? (
        <div className="p-[18px]">
          <div className="h-20 animate-pulse rounded-[6px] bg-sz-n-100" />
        </div>
      ) : (
        <>
          {/*
            노출 중지된 게시물은 집계가 중지 시각에서 멈춘다. 화면에 적지 않으면
            "왜 어제부터 수치가 늘지 않느냐"는 오해가 그대로 남는다.
          */}
          {data.truncatedBySuspension && (
            <div className="border-b border-sz-n-200 bg-sz-n-50 px-[18px] py-2.5 text-[11px] text-sz-n-600">
              노출이 중지된 게시물이라{" "}
              <b className="text-sz-n-900">{formatDateTime(data.to)}</b>까지만
              집계됩니다.
            </div>
          )}

          <Section title="반응">
            <div className="flex gap-2.5">
              <Stat
                value={formatCount(data.reaction.impressions)}
                label="노출"
              />
              <Stat
                value={formatCount(data.reaction.likes)}
                label="좋아요"
                isKey
              />
              <Stat
                value={formatRate(data.reaction.likeRate)}
                label="좋아요율"
              />
            </div>
            {data.reaction.likeRate === null && (
              <Note>
                아직 노출이 없어 좋아요율을 계산할 수 없습니다 — 0%가 아니라
                <b className="text-sz-n-900"> 아직 값이 없는 상태</b>입니다.
              </Note>
            )}
          </Section>

          <Section
            title="이 게시물을 보고 한 행동"
            hint={`노출 ${formatCount(data.reaction.impressions)} 기준`}
          >
            <div className="flex gap-2.5">
              <Stat
                value={formatCount(data.behavior.showroomVisits)}
                label={`쇼룸 방문 · ${formatRate(data.behavior.visitRate)}`}
              />
              <Stat
                value={formatCount(data.behavior.follows)}
                label={`팔로우 · ${formatRate(data.behavior.followRate)}`}
                isKey
              />
            </div>
            <Note>
              게시물을 본 뒤 <b className="text-sz-n-900">24시간 이내</b>에
              일어난 행동만 이 게시물의 몫으로 셉니다. 여러 게시물을 보고
              팔로우한 경우 <b className="text-sz-n-900">마지막에 본 게시물</b>
              에 귀속됩니다.
            </Note>
            {data.behavior.followCountMayDecrease && (
              <Note>
                팔로우를 취소하면 귀속 기록도 함께 빠지므로 지난 기간의 수치가
                줄어들 수 있습니다.
              </Note>
            )}
          </Section>

          <Section title="본 사람" hint="집계값만 · 개인 식별 정보 없음">
            {data.viewers.ratioSuppressed ? (
              <div className="rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3.5 py-3 text-[11px] leading-[1.7] text-sz-n-600">
                본 사람이 아직 적어 구성 비율을 표시하지 않습니다
                {data.viewers.minimumSampleSize !== null && (
                  <>
                    {" "}
                    —{" "}
                    <b className="text-sz-n-900">
                      {formatCount(data.viewers.minimumSampleSize)}명
                    </b>{" "}
                    이상부터 보입니다
                  </>
                )}
                . 비율이 곧 개인을 가리킬 수 있기 때문입니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-7">
                <DistBar title="연령대" items={data.viewers.ageGroups} />
                <DistBar title="성별" items={data.viewers.genders} />
              </div>
            )}
            <Note>
              소셜 로그인 시{" "}
              <b className="text-sz-n-900">
                연령대 · 성별 제공에 동의한 소비자
              </b>
              만 집계됩니다. 동의하지 않았거나 비로그인 상태로 본 경우
              미확인으로 분류됩니다.
            </Note>
            <Note>
              일반 게시물은{" "}
              <b className="text-sz-n-900">노출 · 반응 · 조회 후 행동</b>까지만
              봅니다 — 판매로 이어지지 않는 콘텐츠라 구매 · 매출은 집계하지
              않습니다. 공구 게시물의 성과는 판매 현황(#6)에서 봅니다.
            </Note>
          </Section>
        </>
      )}
    </div>
  )
}

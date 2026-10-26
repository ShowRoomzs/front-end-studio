import { Button } from "@/components/ui/button"
import HomeCalendar from "@/features/home/components/HomeCalendar"
import LiveStrip from "@/features/home/components/LiveStrip"
import { RewardCard, ShowroomCard } from "@/features/home/components/SideCards"
import StartGuide from "@/features/home/components/StartGuide"
import { TodoList, UpcomingList } from "@/features/home/components/TodoList"
import {
  useGetCreatorHome,
  useGetHomeLive,
} from "@/features/home/hooks/useHomeQueries"
import { useNow } from "@/features/home/hooks/useNow"
import type { CreatorHome } from "@/features/home/types"
import { formatTodayLine, kstDateKey } from "@/features/home/utils/date"
import { useState } from "react"

/** 시안 `.fx-h` — 22px 제목 + 한 줄 */
function Heading(props: { title: string; description: string }) {
  return (
    <div>
      <div className="text-[22px] font-semibold text-sz-n-900">
        {props.title}
      </div>
      <div className="mt-1 text-[12px] text-sz-n-500">{props.description}</div>
    </div>
  )
}

/** 왼쪽 2/3 위 — H3 시작 가이드 · H1/H4/H5 할 일 · H2 다가오는 일정 */
function MainColumn(props: { home: CreatorHome; todayKey: string }) {
  const { home, todayKey } = props
  const today = formatTodayLine(todayKey)

  if (home.guide.visible) {
    return (
      <>
        <Heading
          title="쇼룸 스튜디오에 오신 걸 환영해요"
          description="브랜드와 공구를 진행하고 리워드를 받는 곳이에요 · 처음이라면 아래 순서만 알아두세요"
        />
        <StartGuide guide={home.guide} />
      </>
    )
  }

  if (home.todos.length === 0) {
    const hasUpcoming = home.upcoming.length > 0
    return (
      <>
        <Heading
          title="지금 처리할 일이 없어요"
          description={`새로 처리할 일이 생기면 여기에 기한 순으로 나타나요${hasUpcoming ? " · 아래는 다가오는 일정이에요" : ""} · ${today}`}
        />
        {hasUpcoming && (
          <UpcomingList items={home.upcoming} todayKey={todayKey} />
        )}
      </>
    )
  }

  return (
    <>
      <Heading
        title={`오늘 처리할 일 ${home.todos.length}건`}
        description={
          home.account.sanction
            ? "정지 중에도 진행 중인 공구와 관련된 일은 처리할 수 있어요"
            : `기한이 가까운 순이에요 · ${today}`
        }
      />
      <TodoList todos={home.todos} todayKey={todayKey} />
    </>
  )
}

function HomeSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
      <div className="flex flex-col gap-2.5">
        <div className="h-7 w-56 rounded bg-sz-n-200" />
        <div className="mt-2 h-[72px] rounded-[8px] bg-sz-n-100" />
        <div className="h-[72px] rounded-[8px] bg-sz-n-100" />
        <div className="h-[72px] rounded-[8px] bg-sz-n-100" />
      </div>
      <div className="flex flex-col gap-3 pt-[74px]">
        <div className="h-[110px] rounded-[8px] bg-sz-n-100" />
        <div className="h-[140px] rounded-[8px] bg-sz-n-100" />
      </div>
    </div>
  )
}

/**
 * 쇼룸 스튜디오 홈 — ui-studio-14-home rev.4(H1 · H2 · H3 · H4 · H5 · 알림 종 H1a는 탑바).
 * 홈이 답하는 질문은 "지금 내가 뭘 해야 하나" 하나다 — 화면 2/3 할 일(카드 한 장 · 버튼 하나) · 아래 월 달력 ·
 * 오른쪽 1/3 리워드 · 쇼룸 숫자. 할 일 정렬 · 문구 · 정지 중 막힘은 서버가 정한다(1017 설계서 5-0).
 */
export default function HomePage() {
  const now = useNow()
  const todayKey = kstDateKey(now)
  const [month, setMonth] = useState(() => todayKey.slice(0, 7))

  const { data: home, isPending, isError, refetch } = useGetCreatorHome()
  const { data: liveData } = useGetHomeLive(home != null)

  if (isPending) {
    return <HomeSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white p-10 text-center">
        <p className="text-[13px] text-sz-n-600">
          홈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="rounded-[6px] px-3.5 text-[12px] shadow-none"
        >
          다시 시도
        </Button>
      </div>
    )
  }

  const live = liveData !== undefined ? liveData : home.live

  return (
    <div>
      {live && <LiveStrip live={live} now={now} />}
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
        <div className="min-w-0">
          <MainColumn home={home} todayKey={todayKey} />
          <HomeCalendar
            month={month}
            onChangeMonth={setMonth}
            todayKey={todayKey}
            isNewMember={home.guide.visible}
          />
        </div>
        {/* 시안 `.side-c` padding-top 74px — 제목 줄 아래 첫 카드와 높이를 맞춘다 */}
        <div className="flex flex-col gap-3 pt-[74px]">
          <RewardCard reward={home.reward} />
          <ShowroomCard showroom={home.showroom7d} />
        </div>
      </div>
    </div>
  )
}

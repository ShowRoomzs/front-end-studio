import Btn from "@/features/contracts/components/shared/Btn"
import {
  ConsumersSection,
  DetailHeader,
  DetailKpis,
  FollowersSection,
  FunnelCard,
  RewardBar,
  RewardSection,
  SalesSection,
  TopNotice,
  TrafficSection,
} from "@/features/performance/components/detail/PerformanceSections"
import {
  EmptyBox,
  Grp,
  PERFORMANCE_PAGE_CLASS,
} from "@/features/performance/components/shared/PerformanceParts"
import {
  CONNECTIONS_PATH,
  CONTRACT_LIST_PATH,
  GROUP_BUY_LIST_PATH,
  PERFORMANCE_LIST_PATH,
  SETTLEMENT_LIST_PATH,
  SHOWROOM_STATS_PATH,
} from "@/features/performance/constants/params"
import { useGetPerformanceDetail } from "@/features/performance/hooks/usePerformanceQueries"
import { performanceErrorInfo } from "@/features/performance/services/performanceService"
import { Loader2 } from "lucide-react"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

/**
 * 성과 관리 상세(ui-studio-10 D1 ~ D4) — `/performance/:groupBuyId`(경로 키는 공구 ID).
 *
 * 공구 1개 리포트다(전체 대시보드가 아니다). 조회 전용 — 발신 액션은 [이 브랜드와 재협업 제안](연결·소통) 하나뿐이고
 * 금액 수정 · 정산 조작 · 조정 협의 응답 버튼이 없다. 블록은 서버가 상태에 따라 값 · estimated · null로 내린다.
 */
export default function PerformanceDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { groupBuyId } = useRouteParams<{ groupBuyId: string }>()
  const id = Number(groupBuyId)
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPerformanceDetail(id)

  // 목록에서 들고 온 조건(기간 · 상태 · 검색어 · 정렬 · 쪽)으로 돌아간다
  const goList = () =>
    navigate({ pathname: PERFORMANCE_LIST_PATH, search: location.search })
  const openThread = (threadId: number | null) =>
    navigate(
      threadId !== null
        ? `${CONNECTIONS_PATH}?threadId=${threadId}`
        : CONNECTIONS_PATH
    )

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    const { status, code, message } = performanceErrorInfo(error)
    // 남의 공구 · 없음 · 판매 0건은 404(존재를 알리지 않는다) · 진행 중 · 중단은 409
    const notFound = !isError || status === 404 || !Number.isFinite(id)
    const notReady = code === "PERFORMANCE_NOT_READY" || status === 409
    return (
      <div className={PERFORMANCE_PAGE_CLASS}>
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          {notReady ? (
            <EmptyBox
              title="아직 성과를 볼 수 없는 공구입니다"
              action={
                <>
                  <Btn
                    variant="primary"
                    onClick={() => navigate(GROUP_BUY_LIST_PATH)}
                  >
                    공구 관리로 이동
                  </Btn>
                  <Btn variant="secondary" onClick={goList}>
                    목록으로
                  </Btn>
                </>
              }
            >
              {message ?? "공구가 종료되면 성과를 열람할 수 있습니다."}
            </EmptyBox>
          ) : notFound ? (
            <EmptyBox
              title="성과를 찾을 수 없습니다"
              action={
                <Btn variant="secondary" onClick={goList}>
                  목록으로
                </Btn>
              }
            >
              내 공구가 아니거나 판매 기록이 없는 공구입니다.
            </EmptyBox>
          ) : (
            <EmptyBox
              title="성과를 불러오지 못했습니다"
              action={
                <>
                  <Btn variant="primary" onClick={() => refetch()}>
                    다시 시도
                  </Btn>
                  <Btn variant="secondary" onClick={goList}>
                    목록으로
                  </Btn>
                </>
              }
            >
              잠시 후 다시 시도해 주세요.
            </EmptyBox>
          )}
        </div>
      </div>
    )
  }

  const { groupBuy } = detail

  return (
    <div className={PERFORMANCE_PAGE_CLASS}>
      <DetailHeader
        groupBuy={groupBuy}
        onList={goList}
        onRecollaborate={() => openThread(detail.recollaboration.threadId)}
      />

      {detail.notice && (
        <TopNotice notice={detail.notice} onOpenThread={openThread} />
      )}

      <RewardBar
        bar={detail.rewardBar}
        onContract={() =>
          navigate(`${CONTRACT_LIST_PATH}/${groupBuy.contractId}`)
        }
      />

      <DetailKpis detail={detail} />

      <Grp title="유입" sub="방문이 어디서 왔고 무엇을 보고 눌렀나" />
      <TrafficSection traffic={detail.traffic} />
      <FunnelCard funnel={detail.funnel} />

      <Grp title="판매" sub="무엇이 얼마나 팔렸나" />
      <SalesSection
        sales={detail.sales}
        reward={detail.reward}
        adjusting={detail.reward.stage === "AFTER_AGREEMENT"}
      />

      <Grp title="소비자" sub="누가 샀나" />
      <ConsumersSection
        consumers={detail.consumers}
        confirmedOrderCount={detail.funnel.confirmedOrderCount}
      />

      <Grp title="팔로워" sub="내 쇼룸이 얼마나 커졌나" />
      <FollowersSection
        followers={detail.followers}
        groupBuy={groupBuy}
        visitorCount={detail.traffic.visitorCount}
        onShowroomStats={() => navigate(SHOWROOM_STATS_PATH)}
      />

      <Grp title="리워드" sub="내가 얼마 받나" />
      <RewardSection
        detail={detail}
        onSettlement={settlementId =>
          navigate(`${SETTLEMENT_LIST_PATH}/${settlementId}`)
        }
      />
    </div>
  )
}

import {
  InfoCard,
  KvList,
  KvRow,
  NoteBox,
  PolicyTbdTag,
} from "@/features/basicInfo/components/parts"
import type { CreatorBusinessType } from "@/features/basicInfo/types"

/**
 * 오른쪽 「정산은 이렇게 진행됩니다」 — 절차 설명만, 금액은 없다(정산 관리가 단일 소스 · 50 설계서 5-1).
 * 세금 줄만 사업자 구분으로 갈린다. 지급 시점은 기-10 「자동 확정일 + N영업일」 [정책값 미정](이 API는 숫자를 내리지 않는다).
 */
export default function SettlementGuideCard(props: {
  businessType: CreatorBusinessType
}) {
  return (
    <InfoCard title="정산은 이렇게 진행됩니다">
      <KvList>
        <KvRow
          label="확정 시점"
          sub="확인 기간에 금액이 맞지 않으면 정산 조정을 요청할 수 있습니다."
        >
          주문 종결 후 3영업일 확인 → 자동 확정
        </KvRow>
        <KvRow
          label="지급"
          sub={
            <>
              리워드는 <b>SHOWROOMZ가 지급</b>합니다 — 브랜드가 지급하지
              않습니다.
            </>
          }
        >
          자동 확정일 + N영업일 <PolicyTbdTag />
        </KvRow>
        {props.businessType === "BUSINESS" ? (
          <KvRow
            label="세금"
            sub="발행이 확인되면 지급됩니다 — 발행 전에는 지급이 시작되지 않습니다."
          >
            사업자 <b>세금계산서 발행</b>
          </KvRow>
        ) : (
          <KvRow
            label="세금"
            sub="신고 · 납부도 SHOWROOMZ가 하며 원천징수영수증은 정산 관리에서 받습니다."
          >
            비사업자 · <b>SHOWROOMZ가 3.3% 원천징수</b>
          </KvRow>
        )}
        <KvRow
          label="고정 지급비"
          sub={
            <>
              계약서 기준이며 <b>정산에 포함되지 않습니다</b>.
            </>
          }
        >
          브랜드가 직접 지급
        </KvRow>
      </KvList>
      <NoteBox>
        확정 금액 · 지급일 · 명세는 <b>정산 관리(#7)</b>에서 확인합니다. 이
        화면은 <b>지급받을 정보</b>만 관리합니다.
      </NoteBox>
    </InfoCard>
  )
}

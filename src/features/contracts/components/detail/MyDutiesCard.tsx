import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import type { CreatorContractContent } from "@/features/contracts/types"
import dayjs from "dayjs"

interface MyDutiesCardProps {
  content: CreatorContractContent
  isConcluded: boolean
}

/**
 * 「내가 해야 할 일」 — 콘텐츠 의무. 서명하면 이 내용에 동의하게 된다.
 * 종결 3종에서도 카드는 남기되 「계약이 성립하지 않아 효력 없음」으로 표기한다(§27-7).
 */
export default function MyDutiesCard(props: MyDutiesCardProps) {
  const { content, isConcluded } = props
  const alive = content.obligationAlive
  const formats = `피드 ${content.feedCount ?? 0} · 릴스 ${content.reelsCount ?? 0} · 스토리 ${content.storyCount ?? 0}`

  return (
    <DetailCard
      title={alive ? "내가 해야 할 일" : "콘텐츠 의무"}
      note={
        !alive
          ? "계약이 성립하지 않아 효력 없음"
          : isConcluded
            ? "콘텐츠 의무 · 체결로 확정된 약속"
            : "콘텐츠 의무 · 서명하면 이 내용에 동의하게 됩니다"
      }
    >
      <FieldRow label="게시 포맷·수량">{formats}</FieldRow>
      <FieldRow label="게시 완료 기한">
        <span className="tabular-nums">
          {content.dueDate ? dayjs(content.dueDate).format("YYYY.MM.DD") : "—"}
        </span>
        {alive && (
          <div className={FSUB_CLASS}>{formats} 전부를 이 날짜까지 게시</div>
        )}
      </FieldRow>
      <FieldRow label="2차 활용권">
        {content.secondaryUseAllowed === null
          ? "—"
          : content.secondaryUseAllowed
            ? alive
              ? "허용"
              : `허용${content.secondaryUsePeriodType === "FIXED" ? ` · 기간 지정 ${content.secondaryUseMonths ?? "—"}개월` : content.secondaryUsePeriodType === "UNLIMITED" ? " · 무기한" : ""}`
            : "불허"}
        {alive && content.secondaryUseAllowed && (
          <div className={FSUB_CLASS}>
            브랜드가 내 콘텐츠를 자사 채널·광고에 사용할 수 있습니다 · 범위는
            비고 참조
          </div>
        )}
      </FieldRow>
      {alive && content.secondaryUseAllowed && (
        <FieldRow label="2차 활용 기간">
          {content.secondaryUsePeriodType === "FIXED"
            ? `기간 지정 · ${content.secondaryUseMonths ?? "—"}개월`
            : content.secondaryUsePeriodType === "UNLIMITED"
              ? "무기한"
              : "—"}
        </FieldRow>
      )}
      <FieldRow label="사전 검수">
        {content.preReview === null ? "—" : content.preReview ? "있음" : "없음"}
        {alive && content.preReview && (
          <div className={FSUB_CLASS}>
            게시 전 초안을 스레드로 보내야 하며,{" "}
            <b className="font-semibold text-sz-n-700">
              브랜드 확인 없이 올린 콘텐츠는 이행으로 보지 않습니다
            </b>
          </div>
        )}
      </FieldRow>
      {alive && content.note && (
        <FieldRow label="비고">
          <span className="whitespace-pre-line">{content.note}</span>
        </FieldRow>
      )}
    </DetailCard>
  )
}

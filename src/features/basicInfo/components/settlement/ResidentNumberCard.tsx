import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  InfoCard,
  KvList,
  KvRow,
  NoteBox,
} from "@/features/basicInfo/components/parts"
import type { ResidentNumberInfo } from "@/features/basicInfo/types"
import { formatEventDate } from "@/features/basicInfo/utils/format"

/**
 * 「주민등록번호」 카드 — 비사업자만(T1 · T2 · T3 · T6 · T7 · T10). 리워드 지급자가 SHOWROOMZ라 원천징수 신고에 쓴다.
 * 온보딩 필수 입력이라 미등록 상태는 없다(시안 rule 10.07 ②).
 */
export default function ResidentNumberCard(props: {
  residentNumber: ResidentNumberInfo
}) {
  const { masked, registeredAt } = props.residentNumber
  const registered = formatEventDate(registeredAt)

  return (
    <InfoCard
      title="주민등록번호"
      badge={<StatusBadge variant="success">등록 완료</StatusBadge>}
    >
      <KvList>
        <KvRow
          label="주민등록번호"
          tabular
          sub={registered ? `암호화 보관 · ${registered} 등록` : "암호화 보관"}
        >
          {masked}
        </KvRow>
      </KvList>
      <NoteBox>
        원천징수 신고(지급명세서 제출)를 위해 소득세법에 따라 수집하며 암호화해
        보관합니다.
      </NoteBox>
    </InfoCard>
  )
}

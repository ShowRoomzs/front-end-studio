import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  Field,
  InfoCard,
  NoteBox,
  ReadonlyInput,
} from "@/features/basicInfo/components/parts"
import type { CreatorIdentity } from "@/features/basicInfo/types"
import { formatPlainDate } from "@/features/basicInfo/utils/format"

/**
 * 「본인 인증 정보」(S1) — 마스킹 + 셀프 수정 불가. 재인증 절차가 미확정이라 안내 문구까지만.
 * 생년월일은 서버 저장 형식(2003-07-19)을 시안 표기(2003.07.19)로만 바꾼다.
 */
export default function IdentityCard(props: { identity: CreatorIdentity }) {
  const { identity } = props

  return (
    <InfoCard
      title="본인 인증 정보"
      badge={
        <StatusBadge variant="neutral" hideDot>
          🔒 수정 불가
        </StatusBadge>
      }
    >
      <Field label="이름(본명)">
        <ReadonlyInput value={identity.realName} lock="🔒 인증값" />
      </Field>
      <Field label="생년월일">
        <ReadonlyInput
          value={formatPlainDate(identity.birthday) ?? "—"}
          lock="🔒 인증값"
        />
      </Field>
      <Field label="휴대폰 번호">
        <ReadonlyInput value={identity.phoneNumber} lock="🔒 인증값" />
      </Field>
      <NoteBox>
        가입 시 본인 인증한 값입니다. 정산 대상자 실명 기준이라 직접 수정할 수
        없고, 변경이 필요하면 <b>운영팀 확인 후 재인증</b>이 필요합니다.
      </NoteBox>
    </InfoCard>
  )
}

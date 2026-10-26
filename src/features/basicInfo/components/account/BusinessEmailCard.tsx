import axios from "axios"
import { useState } from "react"
import toast from "react-hot-toast"

import { Field, InfoCard } from "@/features/basicInfo/components/parts"
import { buttonClass, inputClass } from "@/features/basicInfo/components/styles"
import {
  BUSINESS_EMAIL_MAX_LENGTH,
  BUSINESS_EMAIL_PATTERN,
} from "@/features/basicInfo/constants/params"
import { useUpdateBusinessEmail } from "@/features/basicInfo/hooks/useBasicInfoQueries"

const FORMAT_ERROR = "이메일 형식이 올바르지 않습니다."
const SAVE_FAILED = "저장하지 못했습니다. 잠시 후 다시 시도해 주세요."

/**
 * 「활동 채널」 — 업무 이메일 하나(S1 · S2 · S3). 이 탭에서 셀프 수정하는 유일한 값이다.
 *
 * - 비어 있으면 문구 없이 [저장] 비활성만(S2).
 * - 형식 오류는 테두리 위험색 + 문구 한 줄 · [저장] 비활성(S3). 서버와 같은 규칙(도메인에 점)이라
 *   서버 400은 거의 없지만, 오면 같은 자리에 서버 문구를 붙인다.
 * 서버 값이 바뀌면(저장 성공) 부모가 `key`로 새로 그려 입력이 서버 값으로 돌아간다.
 */
export default function BusinessEmailCard(props: {
  businessEmail: string | null
}) {
  const [email, setEmail] = useState(props.businessEmail ?? "")
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { mutate, isPending } = useUpdateBusinessEmail()

  const trimmed = email.trim()
  const isFormatInvalid =
    trimmed.length > 0 &&
    (!BUSINESS_EMAIL_PATTERN.test(trimmed) ||
      trimmed.length > BUSINESS_EMAIL_MAX_LENGTH)
  const error =
    serverError ?? (touched && isFormatInvalid ? FORMAT_ERROR : null)
  const canSave = trimmed.length > 0 && !isFormatInvalid && !serverError

  const save = () => {
    if (!canSave || isPending) return
    mutate(trimmed, {
      onSuccess: () => toast.success("업무 이메일을 저장했습니다."),
      onError: failure => {
        const message = axios.isAxiosError<{ message?: string }>(failure)
          ? failure.response?.data?.message
          : failure instanceof Error
            ? failure.message
            : undefined
        setServerError(message || SAVE_FAILED)
      },
    })
  }

  return (
    <InfoCard title="활동 채널">
      <Field
        label="업무 이메일"
        required
        htmlFor="basic-info-business-email"
        hint="승인 · 계약 · 정산 알림을 받는 주소입니다."
        error={error}
      >
        <input
          id="basic-info-business-email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          maxLength={BUSINESS_EMAIL_MAX_LENGTH}
          value={email}
          onChange={event => {
            setEmail(event.target.value)
            setServerError(null)
          }}
          onBlur={() => setTouched(true)}
          onKeyDown={event => {
            if (event.key === "Enter") save()
          }}
          className={inputClass(!!error)}
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSave || isPending}
          onClick={save}
          className={buttonClass("primary", "sm")}
        >
          저장
        </button>
      </div>
    </InfoCard>
  )
}

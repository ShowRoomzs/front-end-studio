import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { Stepper } from "@/common/components/Auth/Stepper"
import { FormField, RequiredMark } from "@/common/components/Auth/FormField"
import {
  authButtonClass,
  authInputClass,
  authReadonlyBoxClass,
} from "@/common/components/Auth/authStyles"
import { TermsAgreement } from "@/common/components/Auth/TermsAgreement"
import { AlertModal, ModalButton } from "@/features/auth/components/AlertModal"
import { ConfirmCheckRow } from "@/features/auth/components/ConfirmCheckRow"
import { InfoRows } from "@/features/auth/components/InfoRows"
import { NoticeBox } from "@/features/auth/components/NoticeBox"
import { NumberField } from "@/features/auth/components/NumberField"
import {
  REQUIRED_TERM_KEYS,
  SIGNUP_TERMS,
  SIGNUP_TERM_NOTICES,
} from "@/features/auth/constants/terms"
import { authService } from "@/features/auth/services/authService"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import {
  MIN_AGE,
  verifyIdentity,
  type VerifiedIdentity,
} from "@/features/auth/utils/mockIdentity"
import {
  ACCOUNT_ID_MAX_LENGTH,
  extractInstagramHandle,
  normalizeAccountId,
  validateAccountId,
  validateBusinessEmail,
  validateChannelUrl,
} from "@/features/auth/utils/studioValidation"

const STEPS = ["본인 인증", "활동 채널", "약관 동의"]

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

const SUBMIT_ERROR_BY_CODE: Record<string, string> = {
  DUPLICATE_APPLICATION: "이미 검수 대기 중인 신청이 있습니다.",
  APPLICATION_REAPPLY_COOLDOWN:
    "반려일로부터 14일이 지나야 다시 신청할 수 있습니다.",
  ALREADY_REGISTERED: "이미 크리에이터 권한이 있는 계정입니다.",
}

type ChannelForm = {
  channelUrl: string
  accountId: string
  followerCount: string
  businessEmail: string
}

/**
 * ui-studio-02-signup 상태 8종 — Step1(A·B·C) · Step2(D·E) · Step3(F·G) · 완료(H).
 *
 * 이 8종은 **별도 라우팅이 아니라 같은 화면의 유효성 검사 결과 차이**다(§2 상태 관리 메모).
 * 필수값이 모두 유효할 때만 각 단계의 주 버튼이 켜지고,
 * 미충족 시 에러 문구 없이 **버튼 비활성만으로** 표현한다(§8-1/§8-3 확정 원칙).
 *
 * Step1의 본인인증 값은 서버로 보내지 않는다 — 백엔드 DTO에 해당 필드가 없다.
 */
export default function SignupPage() {
  const navigate = useNavigate()
  const [accessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)

  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)

  // Step1
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null)
  const [identityConfirmed, setIdentityConfirmed] = useState(false)
  const [ageBlocked, setAgeBlocked] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Step3
  const [agreements, setAgreements] = useState<Record<string, boolean>>({})

  // 완료(H) — 제출 시점에 고정해 둔다
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)

  const {
    control,
    getValues,
    setValue,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
  } = useForm<ChannelForm>({
    mode: "onChange",
    defaultValues: {
      channelUrl: "",
      accountId: "",
      followerCount: "",
      businessEmail: "",
    },
  })

  // 계정 아이디를 사용자가 직접 건드렸는지. 건드린 뒤에는 채널 주소가 바뀌어도 덮어쓰지 않는다.
  const accountIdEditedRef = useRef(false)

  // 신청 API는 로그인 상태를 요구한다(백엔드 @AuthenticationPrincipal).
  // 로그인 없이 URL로 직접 들어온 경우 제출이 불가능하므로 되돌려 보낸다.
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true })
    }
  }, [accessToken, navigate])

  if (!accessToken) {
    return null
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const result = await verifyIdentity()
      if (result.age < MIN_AGE) {
        setAgeBlocked(true)
        return
      }
      setIdentity(result)
    } finally {
      setVerifying(false)
    }
  }

  const resetStep1 = () => {
    setAgeBlocked(false)
    setIdentity(null)
    setIdentityConfirmed(false)
  }

  const handleChannelUrlChange = (
    value: string,
    onChange: (v: string) => void
  ) => {
    onChange(value)
    if (accountIdEditedRef.current) return
    const handle = extractInstagramHandle(value)
    if (handle) {
      setValue("accountId", handle, { shouldValidate: true })
    }
  }

  const allRequiredTermsChecked = REQUIRED_TERM_KEYS.every(k => agreements[k])

  const onSubmit = async (values: ChannelForm) => {
    setServerError(null)
    try {
      await authService.apply({
        snsType: "INSTAGRAM",
        channelUrl: values.channelUrl.trim(),
        accountId: values.accountId.trim(),
        followerCount: Number(values.followerCount),
        businessEmail: values.businessEmail.trim(),
        agreeTermsOfService: !!agreements.agreeTermsOfService,
        agreeOperationalPolicy: !!agreements.agreeOperationalPolicy,
        agreePrivacyPolicy: !!agreements.agreePrivacyPolicy,
        agreeMarketingPolicy: !!agreements.agreeMarketingPolicy,
      })
      setSubmittedAt(new Date())
      setStep(3)
    } catch (err) {
      if (!isAxiosError(err) || !err.response) {
        setServerError(SERVER_ERROR_MESSAGE)
        return
      }
      const code = err.response.data?.code as string | undefined
      const message = err.response.data?.message as string | undefined
      setServerError(
        (code && SUBMIT_ERROR_BY_CODE[code]) ?? message ?? SERVER_ERROR_MESSAGE
      )
    }
  }

  return (
    <AuthShell variant="form" subtitle="쇼룸 스튜디오 신청">
      <Stepper steps={STEPS} current={step === 3 ? STEPS.length : step} />

      {serverError && (
        <div
          role="alert"
          className="mb-5 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[12px] text-sz-n-700"
        >
          {serverError}
        </div>
      )}

      {step === 0 && (
        <>
          <section className="mb-5">
            <h2 className="mb-1.5 text-[16px] font-semibold text-sz-n-900">
              본인 인증
            </h2>
            {identity ? (
              <p className="mb-4 text-[12px] leading-[1.7] font-medium text-sz-success-text">
                ✓ 본인 인증이 완료되었습니다.
              </p>
            ) : (
              <p className="mb-4 text-[12px] leading-[1.7] text-sz-n-600">
                정산 처리를 위해 본인 인증이 필요합니다.
                <br />
                아래 항목이 인증을 통해 확인됩니다.
              </p>
            )}

            <InfoRows
              className="mb-4"
              rows={[
                {
                  label: "이름",
                  value: identity?.maskedName ?? "인증 후 표시",
                  placeholder: !identity,
                },
                {
                  label: "생년월일",
                  value: identity?.birthDate ?? "인증 후 표시",
                  placeholder: !identity,
                },
                {
                  label: "휴대폰 번호",
                  value: identity?.maskedPhone ?? "인증 후 표시",
                  placeholder: !identity,
                },
              ]}
            />

            {!identity && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className={authButtonClass("primary", "w-full")}
              >
                {verifying && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                )}
                본인 인증하기
              </button>
            )}
          </section>

          {identity && (
            <ConfirmCheckRow
              checked={identityConfirmed}
              onChange={setIdentityConfirmed}
              label="[필수] 본인의 인증 정보가 맞습니다."
            />
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={authButtonClass("line", "flex-none basis-[120px]")}
            >
              이전
            </button>
            <button
              type="button"
              disabled={!identity || !identityConfirmed}
              onClick={() => setStep(1)}
              className={authButtonClass("primary", "flex-1")}
            >
              다음
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <section className="mb-5">
            <h2 className="mb-4 text-[16px] font-semibold text-sz-n-900">
              활동 채널
            </h2>

            <FormField
              label={
                <>
                  플랫폼
                  <RequiredMark />
                </>
              }
            >
              {/* §8-2: 원본 4종 선택은 폐기되고 Instagram 고정(읽기전용)으로 확정 */}
              <div className={authReadonlyBoxClass}>
                Instagram
                <span className="flex items-center gap-1 text-[11px] text-sz-n-500">
                  <LockIcon />
                  고정
                </span>
              </div>
            </FormField>

            <Controller
              control={control}
              name="channelUrl"
              rules={{
                required: "채널 주소를 입력해 주세요.",
                validate: validateChannelUrl,
              }}
              render={({ field }) => (
                <FormField
                  label={
                    <>
                      채널 주소
                      <RequiredMark />
                    </>
                  }
                  htmlFor="channelUrl"
                  error={errors.channelUrl?.message}
                  help="https://로 시작하는 올바른 URL을 입력해 주세요."
                >
                  <input
                    id="channelUrl"
                    type="text"
                    placeholder="https://www.instagram.com/"
                    disabled={isSubmitting}
                    className={authInputClass(!!errors.channelUrl)}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={e =>
                      handleChannelUrlChange(e.target.value, field.onChange)
                    }
                  />
                </FormField>
              )}
            />

            <Controller
              control={control}
              name="accountId"
              rules={{
                required: "계정 아이디를 입력해 주세요.",
                validate: validateAccountId,
              }}
              render={({ field }) => (
                <FormField
                  label={
                    <>
                      계정 아이디
                      <RequiredMark />
                    </>
                  }
                  htmlFor="accountId"
                  error={errors.accountId?.message}
                  help="채널 주소에서 자동 추출 · 수정 가능 · 영문 소문자·숫자·마침표(.)·밑줄(_)만 가능, 최대 30자"
                >
                  <input
                    id="accountId"
                    type="text"
                    maxLength={ACCOUNT_ID_MAX_LENGTH}
                    placeholder="@ 아이디를 입력해 주세요"
                    disabled={isSubmitting}
                    className={authInputClass(!!errors.accountId)}
                    value={field.value}
                    onBlur={field.onBlur}
                    // §7-2: 브라우저 기본 검증이 아니라 입력 즉시 허용 문자 외 전부 제거 + 소문자 변환.
                    // 한글 IME가 개입할 수 없는 문자 집합이라 조합 처리는 필요 없다.
                    onChange={e => {
                      accountIdEditedRef.current = true
                      field.onChange(normalizeAccountId(e.target.value))
                    }}
                  />
                </FormField>
              )}
            />

            <Controller
              control={control}
              name="followerCount"
              rules={{
                required: "팔로워 수를 입력해 주세요.",
                validate: v =>
                  Number(v) >= 0 || "팔로워 수는 0 이상이어야 합니다.",
              }}
              render={({ field }) => (
                <FormField
                  label={
                    <>
                      팔로워 수
                      <RequiredMark />
                    </>
                  }
                  htmlFor="followerCount"
                  error={errors.followerCount?.message}
                  help="자기 신고 값 — 운영자가 채널 주소로 실제 확인 후 심사"
                >
                  <NumberField
                    id="followerCount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.followerCount}
                    placeholder="현재 팔로워 수를 직접 입력해 주세요"
                    disabled={isSubmitting}
                  />
                </FormField>
              )}
            />
          </section>

          <section className="mb-5">
            <h2 className="mb-4 text-[16px] font-semibold text-sz-n-900">
              업무 이메일
            </h2>
            <Controller
              control={control}
              name="businessEmail"
              rules={{
                required: "업무 이메일을 입력해 주세요.",
                validate: validateBusinessEmail,
              }}
              render={({ field }) => (
                <FormField
                  label={
                    <>
                      이메일 (승인 여부 전달)
                      <RequiredMark />
                    </>
                  }
                  htmlFor="businessEmail"
                  error={errors.businessEmail?.message}
                >
                  <input
                    id="businessEmail"
                    type="email"
                    placeholder="example@email.com"
                    disabled={isSubmitting}
                    className={authInputClass(!!errors.businessEmail)}
                    {...field}
                  />
                </FormField>
              )}
            />
          </section>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setStep(0)}
              className={authButtonClass("line", "flex-none basis-[120px]")}
            >
              이전
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => setStep(2)}
              className={authButtonClass("primary", "flex-1")}
            >
              다음
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <section className="mb-5">
            <h2 className="mb-4 text-[16px] font-semibold text-sz-n-900">
              약관 동의
            </h2>
            <TermsAgreement
              terms={SIGNUP_TERMS}
              notices={SIGNUP_TERM_NOTICES}
              checked={agreements}
              onChange={setAgreements}
            />
          </section>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={authButtonClass("line", "flex-none basis-[120px]")}
            >
              이전
            </button>
            <button
              type="submit"
              disabled={!allRequiredTermsChecked || !isValid || isSubmitting}
              className={authButtonClass("primary", "flex-1")}
            >
              {isSubmitting && (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              )}
              신청하기
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="text-center">
          <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full bg-sz-success-bg text-[26px] text-sz-success-text">
            ✓
          </div>
          <div className="mb-2.5 text-[16px] font-semibold text-sz-n-900">
            스튜디오 신청이 접수되었습니다
          </div>
          <p className="mb-5 text-[12px] leading-[1.7] text-sz-n-600">
            신청서가 정상적으로 접수되었습니다.
            <br />
            검토 후 영업일 기준 3~7일 이내에 등록하신 업무 이메일로 결과를
            안내해 드립니다.
          </p>

          <InfoRows
            density="compact"
            className="mb-5"
            rows={[
              { label: "계정 아이디", value: `@${getValues("accountId")}` },
              {
                label: "신청 일시",
                value: submittedAt ? formatSubmittedAt(submittedAt) : "-",
              },
              { label: "결과 안내", value: getValues("businessEmail") },
              { label: "처리 예정", value: "영업일 기준 3~7일 이내" },
            ]}
          />

          {/* §8-4: 완료 화면은 접수 완료라는 긍정적 상태만 전달한다.
              반려·재신청 안내는 로그인 화면의 반려 모달에서만 다룬다. */}
          <NoticeBox className="mb-5">
            심사 결과는 <b className="text-sz-n-900">업무 이메일</b>로
            안내합니다. 승인 완료 후{" "}
            <b className="text-sz-n-900">쇼룸 스튜디오</b>에서 필수 정보 입력 후
            쇼룸을 만들고 활동을 시작할 수 있습니다.
          </NoticeBox>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className={authButtonClass("primary", "w-full")}
          >
            홈으로 이동
          </button>
        </div>
      )}

      {ageBlocked && (
        <AlertModal
          tone="danger"
          icon="!"
          title="신청 자격 조건 미충족"
          actions={
            <>
              <ModalButton variant="line" onClick={resetStep1}>
                다시 인증하기
              </ModalButton>
              <ModalButton variant="primary" onClick={() => navigate("/login")}>
                확인
              </ModalButton>
            </>
          }
        >
          쇼룸 스튜디오는 <b className="text-sz-n-900">만 19세 이상만</b>
          <br />
          신청할 수 있습니다.
        </AlertModal>
      )}
    </AuthShell>
  )
}

function formatSubmittedAt(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" aria-hidden>
    <rect
      x="5"
      y="10.5"
      width="14"
      height="9"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8.5 10.5V7.8a3.5 3.5 0 1 1 7 0v2.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

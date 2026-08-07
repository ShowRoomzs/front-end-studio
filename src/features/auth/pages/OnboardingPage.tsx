import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import { AuthShell } from "@/common/components/Auth/AuthShell"
import { FormField, RequiredMark } from "@/common/components/Auth/FormField"
import {
  authButtonClass,
  authInputClass,
  authReadonlyBoxClass,
} from "@/common/components/Auth/authStyles"
import { useCookie } from "@/common/hooks/useCookie"
import { useGetBanks } from "@/common/hooks/useGetBanks"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { AcctNumberField } from "@/features/auth/components/AcctNumberField"
import { NoticeBox } from "@/features/auth/components/NoticeBox"
import { RadioToggle } from "@/features/auth/components/RadioToggle"
import { ShowroomNameField } from "@/features/auth/components/ShowroomNameField"
import { UploadField } from "@/features/auth/components/UploadField"
import {
  authService,
  type CreatorBusinessType,
} from "@/features/auth/services/authService"
import {
  validateAccountNumber,
  validateBusinessRegistrationNumber,
  validateShowroomName,
} from "@/features/auth/utils/studioValidation"

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

const BANK_PLACEHOLDER = ""

// 서버는 "이미 사용 중인 쇼룸명입니다."까지만 준다. 시안 state C는 다음 행동까지 안내하므로
// 중복일 때만 시안 문구를 쓰고, 그 외 사유는 서버 메시지를 그대로 보여준다.
const SHOWROOM_NAME_DUPLICATED_MESSAGE =
  "이미 사용 중인 쇼룸명입니다. 다른 이름을 입력해 주세요."

type OnboardingForm = {
  showroomName: string
  businessType: CreatorBusinessType
  businessRegistrationNumber: string
  businessLicenseImageUrl: string
  bankCode: string
  accountNumber: string
  bankBookImageUrl: string
}

/**
 * ui-studio-03-onboarding (rev.2) — 승인 후 첫 로그인 시 강제 진입하는 활성화 게이트.
 *
 * 상태 4종은 별도 라우팅이 아니라 같은 화면의 유효성 결과 차이다:
 *   A 초기(개인·비사업자 기본값) · B 사업자 선택(필드 2개 조건부 노출)
 *   C 유효성 에러 · D 활성화(필수 전체 유효)
 *
 * ⚠️ rev.1(카드 520px·컨트롤 44px·자체 파일 컴포넌트)은 폐기됐다.
 * rev.2는 파트너센터와 같은 480px·40px이며 컨트롤도 size="sm"을 쓴다.
 *
 * 필수 미입력은 에러 문구 없이 **버튼 비활성만으로** 표현한다(시안 §4-1).
 * 실제로 뜨는 에러는 파일 형식·용량, 쇼룸명 중복/형식, 사업자등록번호 형식뿐이다.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)
  const [, setRole] = useCookie<string>(COOKIE_NAME.ROLE)

  const registerToken = (location.state as { registerToken?: string } | null)
    ?.registerToken

  const [serverError, setServerError] = useState<string | null>(null)
  // 쇼룸명 중복 검사 결과 — RHF 밖에서 관리한다(서버 응답이라 동기 validate로 못 넣는다)
  const [nameCheck, setNameCheck] = useState<{
    checked: string
    available: boolean
    message: string
  } | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OnboardingForm>({
    mode: "onChange",
    defaultValues: {
      showroomName: "",
      businessType: "INDIVIDUAL",
      businessRegistrationNumber: "",
      businessLicenseImageUrl: "",
      bankCode: BANK_PLACEHOLDER,
      accountNumber: "",
      bankBookImageUrl: "",
    },
  })

  const businessType = useWatch({ control, name: "businessType" })
  const showroomName = useWatch({ control, name: "showroomName" })
  const isBusiness = businessType === "BUSINESS"

  const { data: banks, isLoading: banksLoading } = useGetBanks()

  // 쇼룸 주소·예금주는 서버가 가진 값이라 조회해서 읽기전용으로 채운다.
  const {
    data: registrationInfo,
    isError: registrationInfoError,
    error: registrationInfoErrorObj,
  } = useQuery({
    queryKey: [QUERY_KEYS.CREATOR_REGISTRATION_INFO],
    queryFn: () => authService.getRegistrationInfo(registerToken!),
    enabled: !!registerToken,
    staleTime: Infinity,
    retry: false,
  })

  // registerToken 없이 들어온 경우(직접 URL 접근·새로고침) — 되살릴 방법이 없다.
  useEffect(() => {
    if (!registerToken) {
      navigate("/login", { replace: true })
    }
  }, [registerToken, navigate])

  // 진입 조회가 실패하면 예금주·쇼룸 주소를 채울 수 없어 제출 자체가 불가능하다.
  // 버튼만 비활성인 채로 두면 이유를 알 수 없으므로, 만료면 로그인으로 되돌리고
  // 그 외에는 배너로 사유를 밝힌다.
  useEffect(() => {
    if (!registrationInfoError) return

    const err = registrationInfoErrorObj
    const code =
      isAxiosError(err) && err.response
        ? (err.response.data?.code as string | undefined)
        : undefined

    if (code === "REGISTER_EXPIRED") {
      navigate("/login", {
        replace: true,
        state: {
          info: "정보 입력 유효 시간이 만료되었습니다. 다시 로그인해주세요.",
        },
      })
      return
    }
    setServerError(SERVER_ERROR_MESSAGE)
  }, [registrationInfoError, registrationInfoErrorObj, navigate])

  // 쇼룸명 중복 확인 — 형식이 통과한 값만, 입력이 멎은 뒤에 물어본다.
  useEffect(() => {
    const name = showroomName?.trim() ?? ""
    if (validateShowroomName(name) !== true) {
      setNameCheck(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkShowroomName(name)
        if (cancelled) return
        setNameCheck({
          checked: name,
          available: res.isAvailable,
          message:
            res.code === "DUPLICATE"
              ? SHOWROOM_NAME_DUPLICATED_MESSAGE
              : res.message,
        })
      } catch {
        // 조회 실패는 조용히 넘긴다 — 제출 시 서버가 다시 판정한다
        if (!cancelled) setNameCheck(null)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [showroomName])

  if (!registerToken) {
    return null
  }

  const nameDuplicated =
    !!nameCheck &&
    nameCheck.checked === showroomName?.trim() &&
    !nameCheck.available

  // 사업자 필드는 Controller에 shouldUnregister를 걸어, 개인으로 되돌리면
  // 등록 자체가 해제되도록 했다(안 그러면 required가 남아 isValid가 영영 false).
  const canSubmit =
    isValid && !nameDuplicated && !isSubmitting && !!registrationInfo

  const onSubmit = async (values: OnboardingForm) => {
    setServerError(null)
    try {
      const res = await authService.completeRegistration(registerToken, {
        showroomName: values.showroomName.trim(),
        businessType: values.businessType,
        ...(values.businessType === "BUSINESS"
          ? {
              businessRegistrationNumber: values.businessRegistrationNumber,
              businessLicenseImageUrl: values.businessLicenseImageUrl,
            }
          : {}),
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        bankBookImageUrl: values.bankBookImageUrl,
      })

      // 제출 성공 = 온보딩 완료 + 정식 로그인
      if (res.accessToken && res.refreshToken) {
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setRole("CREATOR")
        navigate("/")
        return
      }
      setServerError(SERVER_ERROR_MESSAGE)
    } catch (err) {
      if (!isAxiosError(err) || !err.response) {
        setServerError(SERVER_ERROR_MESSAGE)
        return
      }
      const code = err.response.data?.code as string | undefined
      const message = err.response.data?.message as string | undefined

      // registerToken 만료(5분) — 다시 로그인해야 새 토큰을 받는다
      if (code === "REGISTER_EXPIRED") {
        navigate("/login", {
          replace: true,
          state: {
            info: "정보 입력 유효 시간이 만료되었습니다. 다시 로그인해주세요.",
          },
        })
        return
      }
      setServerError(message ?? SERVER_ERROR_MESSAGE)
    }
  }

  return (
    <AuthShell variant="onboarding" subtitle="쇼룸 스튜디오 · 필수 정보 입력">
      <div className="mb-6 text-center">
        <h1 className="mb-1.5 text-[16px] font-semibold text-sz-n-900">
          승인이 완료되었습니다
        </h1>
        <p className="text-[12px] text-sz-n-600">
          활동 시작 전 아래 정보를 입력해 주세요. 입력을 완료해야 스튜디오를
          이용할 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[12px] text-sz-n-700"
          >
            {serverError}
          </div>
        )}

        <SectionTitle>쇼룸 정보</SectionTitle>

        <Controller
          control={control}
          name="showroomName"
          // minLength를 따로 두지 않는다 — 메시지 없는 규칙이 걸리면 빈 에러가 떠서
          // 문구가 사라진다. 길이 검사는 validateShowroomName이 문구까지 담당한다.
          rules={{ required: true, validate: validateShowroomName }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  쇼룸명
                  <RequiredMark />
                </>
              }
              htmlFor="showroomName"
              // 형식 에러 + 중복 에러를 함께 노출. 미입력은 문구 없이 버튼 비활성만.
              error={
                errors.showroomName?.message ||
                (nameDuplicated ? nameCheck?.message : undefined)
              }
              help="중복 불가 · 소비자에게 노출되는 이름 · 쇼룸 관리에서 변경 가능"
            >
              <ShowroomNameField
                id="showroomName"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!errors.showroomName || nameDuplicated}
                placeholder="한글·영문·숫자·공백 2~20자"
                disabled={isSubmitting}
              />
            </FormField>
          )}
        />

        <FormField
          label="쇼룸 주소"
          help="계정 아이디(인스타그램 핸들) 기준 자동 생성 · MVP는 수정 불가"
        >
          <div className={authReadonlyBoxClass("sm")}>
            <span className="truncate">
              showroomz.com/@
              {registrationInfo?.accountId ?? (
                <span className="text-sz-n-400">자동 생성</span>
              )}
            </span>
            <LockBadge>자동</LockBadge>
          </div>
        </FormField>

        <Divider />
        <SectionTitle>사업자 여부</SectionTitle>

        <Controller
          control={control}
          name="businessType"
          render={({ field }) => (
            <div className="mb-4">
              <RadioToggle
                name="businessType"
                options={[
                  { value: "INDIVIDUAL", label: "개인 (비사업자)" },
                  { value: "BUSINESS", label: "개인사업자 · 법인" },
                ]}
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
              {!isBusiness && (
                <p className="text-[11px] text-sz-n-500">
                  비사업자 선택 시 리워드 지급 때 원천징수 3.3%가 공제됩니다.
                </p>
              )}
            </div>
          )}
        />

        {/* state B — 사업자 선택 시에만 노출 */}
        {isBusiness && (
          <>
            <Controller
              control={control}
              name="businessRegistrationNumber"
              // 개인으로 되돌리면 이 필드는 등록 해제된다 — 남아 있으면 required가
              // 계속 걸려 제출 버튼이 켜지지 않는다.
              shouldUnregister
              rules={{
                required: true,
                validate: validateBusinessRegistrationNumber,
              }}
              render={({ field }) => (
                <FormField
                  label={
                    <>
                      사업자등록번호
                      <RequiredMark />
                      <OptionalNote>(사업자 선택 시)</OptionalNote>
                    </>
                  }
                  htmlFor="businessRegistrationNumber"
                  error={errors.businessRegistrationNumber?.message}
                >
                  <input
                    id="businessRegistrationNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="000-00-00000"
                    disabled={isSubmitting}
                    className={authInputClass(
                      !!errors.businessRegistrationNumber,
                      undefined,
                      "sm"
                    )}
                    {...field}
                  />
                </FormField>
              )}
            />

            <label className="mb-1.5 block text-[12px] font-medium text-sz-n-600">
              사업자등록증
              <RequiredMark />
              <OptionalNote>(사업자 선택 시)</OptionalNote>
            </label>
            <Controller
              control={control}
              name="businessLicenseImageUrl"
              shouldUnregister
              rules={{ required: true }}
              render={({ field }) => (
                <UploadField
                  label="사업자등록증 사본"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </>
        )}

        <Divider />
        <SectionTitle>정산 계좌</SectionTitle>

        <Controller
          control={control}
          name="bankCode"
          rules={{ required: true }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  은행
                  <RequiredMark />
                </>
              }
              htmlFor="bankCode"
            >
              <select
                id="bankCode"
                disabled={isSubmitting || banksLoading}
                className={authInputClass(false, "pr-8", "sm")}
                {...field}
              >
                <option value={BANK_PLACEHOLDER} disabled>
                  {banksLoading ? "은행 목록 불러오는 중…" : "은행 선택"}
                </option>
                {banks?.map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="accountNumber"
          // 미입력은 문구 없이 버튼 비활성만(시안 §4-1)이라 required엔 메시지를 두지 않는다.
          // 자릿수 미달·초과일 때만 실제 문구가 뜬다.
          rules={{ required: true, validate: validateAccountNumber }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  계좌번호
                  <RequiredMark />
                </>
              }
              htmlFor="accountNumber"
              error={errors.accountNumber?.message}
              help="10~16자리 숫자로 입력해 주세요. (붙여넣기 시 하이픈은 자동으로 제거됩니다)"
            >
              <AcctNumberField
                id="accountNumber"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!errors.accountNumber}
                placeholder="- 없이 숫자만 입력"
                disabled={isSubmitting}
              />
            </FormField>
          )}
        />

        <FormField
          label={
            <>
              예금주
              <RequiredMark />
            </>
          }
          help={
            isBusiness
              ? "사업자는 대표자명 또는 상호로 등록된 예금주여야 합니다."
              : "본인 인증한 실명과 일치해야 합니다. 사업자는 대표자명 또는 상호."
          }
        >
          <div className={authReadonlyBoxClass("sm")}>
            <span className="truncate">
              {registrationInfo?.realName ?? (
                <span className="text-sz-n-400">본인 인증값</span>
              )}
            </span>
            <LockBadge>본인 인증값</LockBadge>
          </div>
        </FormField>

        <label className="mb-1.5 block text-[12px] font-medium text-sz-n-600">
          통장 사본
          <RequiredMark />
        </label>
        <Controller
          control={control}
          name="bankBookImageUrl"
          rules={{ required: true }}
          render={({ field }) => (
            <UploadField
              label="통장 사본"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />

        <NoticeBox className="mb-5">
          사업자 여부·정산 계좌는 입력 완료 후 <b>쇼룸 관리</b>에서 계속 수정할
          수 있어요.
        </NoticeBox>

        <button
          type="submit"
          disabled={!canSubmit}
          className={authButtonClass("primary", "w-full", "sm")}
        >
          {isSubmitting && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          )}
          입력 완료하고 시작하기
        </button>
      </form>
    </AuthShell>
  )
}

/* ── 시안의 반복 마크업을 화면 안에서만 쓰는 작은 조각으로 정리 ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-sz-n-200 pb-2 text-[13px] font-semibold text-sz-n-900">
      {children}
    </h2>
  )
}

function Divider() {
  return <div className="my-5 h-px bg-sz-n-200" />
}

function OptionalNote({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 font-normal text-sz-n-400">{children}</span>
}

function LockBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[11px] whitespace-nowrap text-sz-n-500">
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
      {children}
    </span>
  )
}

import AvatarUploader from "@/features/showroom/components/ProfileForm/AvatarUploader"
import { Field } from "@/features/showroom/components/ProfileForm/FormField"
import { inputClass } from "@/features/showroom/components/ProfileForm/formStyles"
import ShowroomNameInput from "@/features/showroom/components/ProfileForm/ShowroomNameInput"
import {
  CardActions,
  CardSection,
  NoteBox,
  ShowroomCard,
} from "@/features/showroom/components/ShowroomCard/ShowroomCard"
import {
  ERROR_MESSAGE,
  INTRODUCTION_MAX_LENGTH,
} from "@/features/showroom/constants/params"
import { useCheckShowroomName } from "@/features/showroom/hooks/useCheckShowroomName"
import { useUpdateShowroomProfile } from "@/features/showroom/hooks/useShowroomQueries"
import type { ShowroomProfile } from "@/features/showroom/types"
import { validateInstagramUrl } from "@/features/showroom/utils/validateInstagramUrl"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

interface FormValues {
  showroomName: string
  profileImageUrl: string
  introduction: string
  instagramUrl: string
}

function toFormValues(profile: ShowroomProfile): FormValues {
  return {
    showroomName: profile.showroomName,
    profileImageUrl: profile.profileImageUrl ?? "",
    introduction: profile.introduction ?? "",
    instagramUrl: profile.instagramUrl ?? "",
  }
}

/**
 * S1~S4 — 쇼룸 프로필 폼.
 *
 * **저장 버튼은 `dirty && !errors`일 때만 활성이다.** 유효해도 바꾼 게 없으면 비활성 —
 * 누를 이유가 없는 버튼을 살려 두면 눌러 보게 되고, 그때마다 서버가 같은 값을 다시 쓴다.
 *
 * 에러 문구를 띄우는 건 **중복 · 형식 · 파일** 셋뿐이다(§22-2). 쇼룸명이 비었을 때는
 * 문구 없이 버튼만 비활성으로 둔다. 중복과 형식 오류는 **동시에** 뜰 수 있다.
 */
export default function ProfileForm(props: { profile: ShowroomProfile }) {
  const { profile } = props

  const [values, setValues] = useState<FormValues>(() => toFormValues(profile))
  const [nameError, setNameError] = useState<string | null>(null)

  const { mutateAsync: checkName } = useCheckShowroomName()
  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateShowroomProfile()

  /*
    저장이 끝나면 서버가 돌려준 값이 새 기준선이 된다 — 그래야 저장 직후 버튼이
    다시 비활성으로 돌아간다. 재발급으로 프로필이 갱신될 때도 같은 경로를 탄다.
  */
  useEffect(() => {
    setValues(toFormValues(profile))
    setNameError(null)
  }, [profile])

  const instagramError = validateInstagramUrl(values.instagramUrl)
  const trimmedName = values.showroomName.trim()

  const isDirty =
    trimmedName !== profile.showroomName ||
    values.profileImageUrl !== (profile.profileImageUrl ?? "") ||
    values.introduction.trim() !== (profile.introduction ?? "") ||
    values.instagramUrl.trim() !== (profile.instagramUrl ?? "")

  const canSave =
    isDirty && !nameError && !instagramError && trimmedName.length >= 2

  const handleNameBlur = useCallback(async () => {
    const name = values.showroomName.trim()

    // 안 바꿨으면 물어볼 것이 없다 — 자기 이름이 중복으로 잡힌다
    if (!name || name === profile.showroomName) {
      setNameError(null)
      return
    }

    try {
      const result = await checkName(name)
      setNameError(result.isAvailable ? null : ERROR_MESSAGE.NAME_DUPLICATE)
    } catch {
      // 확인에 실패하면 막지 않는다 — 최종 판정은 저장 시 서버가 한다
      setNameError(null)
    }
  }, [checkName, profile.showroomName, values.showroomName])

  const handleSave = async () => {
    if (!canSave || isSaving) {
      return
    }

    try {
      await updateProfile({
        showroomName: trimmedName,
        // 삭제는 빈 문자열이다 — null을 보내면 서버가 "안 바꿈"으로 읽는다
        profileImageUrl: values.profileImageUrl,
        introduction: values.introduction.trim(),
        instagramUrl: values.instagramUrl.trim(),
      })
      toast.success("쇼룸 프로필을 저장했습니다.")
    } catch {
      // 전역 인터셉터가 사유를 토스트로 띄운다. 입력은 그대로 둔다
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profile.showroomUrl)
      toast.success("쇼룸 주소를 복사했습니다.")
    } catch {
      toast.error("복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.")
    }
  }

  return (
    <ShowroomCard title="쇼룸 프로필" note="소비자에게 공개되는 정보">
      <CardSection>
        <AvatarUploader
          imageUrl={values.profileImageUrl}
          onChange={imageUrl =>
            setValues(prev => ({ ...prev, profileImageUrl: imageUrl }))
          }
        />
        <NoteBox className="mt-3">
          쇼룸 프로필은 <b className="text-sz-n-900">소비자 앱 계정과 별개</b>
          입니다 — 여기서 바꿔도 앱 계정의 닉네임 · 프로필 이미지에는 영향이
          없습니다.
        </NoteBox>
      </CardSection>

      <CardSection>
        <Field
          label="쇼룸명"
          htmlFor="showroom-name"
          required
          error={nameError}
          hint="특수문자 없이 2~20자 · 중복 불가 · 소비자에게 보이는 이름"
        >
          <ShowroomNameInput
            value={values.showroomName}
            onChange={showroomName =>
              setValues(prev => ({ ...prev, showroomName }))
            }
            onBlur={() => void handleNameBlur()}
            hasError={!!nameError}
          />
        </Field>

        {/*
          쇼룸 주소는 수정 경로가 없다 — 수정 요청 DTO에 필드 자체가 없다.
          링크가 바뀌면 인플루언서가 이미 뿌려 둔 링크가 전부 죽기 때문이다.
        */}
        <Field
          label="쇼룸 주소"
          hint="가입 시 쇼룸명 기준으로 자동 생성됩니다. 인스타그램 프로필·스토리에 이 링크를 걸어두세요."
        >
          <div className="flex items-center gap-1.5">
            <div className="flex h-9 min-w-0 flex-1 items-center rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 text-[12px] text-sz-n-600">
              <span className="truncate">{profile.showroomUrl}</span>
              <span className="ml-auto shrink-0 pl-2.5 text-[11px] text-sz-n-400">
                자동 생성
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              className="inline-flex h-9 shrink-0 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
            >
              복사
            </button>
          </div>
        </Field>

        <Field label="쇼룸 소개글" htmlFor="showroom-introduction">
          <textarea
            id="showroom-introduction"
            value={values.introduction}
            maxLength={INTRODUCTION_MAX_LENGTH}
            placeholder="쇼룸을 소개하는 문장을 적어주세요"
            onChange={event =>
              setValues(prev => ({ ...prev, introduction: event.target.value }))
            }
            className={inputClass(
              false,
              "h-[70px] resize-none py-[9px] leading-[1.6]"
            )}
          />
          {/* 상한에서 입력이 막히므로 초과 상태가 없다 — 에러 문구도 없다 */}
          <div
            className={cn(
              "mt-1 text-right text-[11px] tabular-nums",
              values.introduction.length >= INTRODUCTION_MAX_LENGTH
                ? "text-sz-n-700"
                : "text-sz-n-400"
            )}
          >
            {values.introduction.length} / {INTRODUCTION_MAX_LENGTH}
          </div>
        </Field>

        <Field
          label="인스타그램 URL"
          htmlFor="showroom-instagram"
          error={instagramError}
          hint="쇼룸 화면에 공개됩니다. 가입 시 입력한 채널 주소가 기본값이며 여기서 직접 수정할 수 있습니다."
        >
          <input
            id="showroom-instagram"
            type="text"
            value={values.instagramUrl}
            placeholder="인스타그램 주소"
            onChange={event =>
              setValues(prev => ({ ...prev, instagramUrl: event.target.value }))
            }
            className={inputClass(!!instagramError)}
          />
        </Field>
      </CardSection>

      <CardActions>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canSave || isSaving}
          className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:enabled:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
        >
          {isSaving ? "저장 중" : "저장"}
        </button>
      </CardActions>
    </ShowroomCard>
  )
}

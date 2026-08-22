import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_HINT,
} from "@/features/showroom/constants/params"
import { useUploadProfileImage } from "@/features/showroom/hooks/useShowroomQueries"
import { validateProfileImage } from "@/features/showroom/utils/validateProfileImage"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

const ACTION_BUTTON_CLASS =
  "inline-flex h-7 items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-900 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"

interface AvatarUploaderProps {
  /** 현재 값 — 빈 문자열이면 이미지 없음(삭제 상태) */
  imageUrl: string
  onChange: (imageUrl: string) => void
}

/**
 * 프로필 이미지 — 아바타 + 변경·삭제 + 제약 힌트(시안 S1·S2·S4).
 *
 * **업로드에 실패해도 기존 이미지를 지우지 않는다.** 아바타를 비우면 사용자는 원래
 * 이미지를 잃었다고 오해한다 — 자리를 그대로 두고 안내 문구만 에러로 바꾼다.
 *
 * 이미지가 없을 때는 버튼을 감추고 **원 자체를 클릭 영역**으로 쓴다(S2). 빈 원과
 * `[이미지 변경]` 버튼이 함께 있으면 어느 쪽을 눌러야 하는지가 두 갈래가 된다.
 *
 * 삭제하면 되돌아갈 기본 이미지가 아직 정해지지 않아(§22-6 미결 7) 빈 원으로
 * 되돌린다 — 사양이 생기면 그 이미지를 여기서 그리면 된다.
 */
export default function AvatarUploader(props: AvatarUploaderProps) {
  const { imageUrl, onChange } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: upload, isPending } = useUploadProfileImage()

  const handlePick = async (file: File | undefined) => {
    if (!file) {
      return
    }

    const message = await validateProfileImage(file)
    if (message) {
      setError(message)
      return
    }

    try {
      const { imageUrl: uploaded } = await upload(file)
      setError(null)
      onChange(uploaded)
    } catch {
      // 전역 인터셉터가 토스트를 띄운다. 여기서는 이미지를 건드리지 않는다
      setError("이미지를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.")
    }
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <div className="flex items-center gap-[18px]">
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        className="hidden"
        onChange={event => {
          void handlePick(event.target.files?.[0])
          // 같은 파일을 다시 골랐을 때도 change가 뜨도록 비운다
          event.target.value = ""
        }}
      />

      {imageUrl ? (
        <img
          src={imageUrl}
          alt="쇼룸 프로필 이미지"
          className="size-[84px] shrink-0 rounded-full border border-sz-n-300 object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={openPicker}
          aria-label="프로필 이미지 선택"
          className="flex size-[84px] shrink-0 items-center justify-center rounded-full border border-dashed border-sz-n-300 bg-sz-n-50 text-sz-n-400 hover:border-sz-accent-500 hover:bg-sz-accent-50 hover:text-sz-accent-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="size-[26px]"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      <div className="min-w-0 flex-1">
        {imageUrl && (
          <div className="mb-[5px] flex gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={isPending}
              className={ACTION_BUTTON_CLASS}
            >
              {isPending ? "올리는 중" : "이미지 변경"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                onChange("")
              }}
              disabled={isPending}
              className={ACTION_BUTTON_CLASS}
            >
              삭제
            </button>
          </div>
        )}

        <p
          className={cn(
            "text-[11px] leading-[1.7]",
            error ? "font-medium text-sz-danger-text" : "text-sz-n-500"
          )}
        >
          {error ??
            (imageUrl
              ? PROFILE_IMAGE_HINT
              : `원을 눌러 이미지를 선택하세요 · ${PROFILE_IMAGE_HINT}`)}
        </p>
      </div>
    </div>
  )
}

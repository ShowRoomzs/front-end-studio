/**
 * 첨부 제한 — 개수·용량은 **서로 독립적인 두 축**이고 둘 다 통과해야 전송된다(§13-7).
 * 개수는 통과했는데 용량이 초과인 경우(대용량 영상 2개 등)도 전송 불가다.
 * 서버가 전송 시 다시 검증하므로 여기 값은 즉시 피드백용이다.
 */
export const ATTACHMENT_COUNT_MAX = 20
export const ATTACHMENT_TOTAL_SIZE_MAX = 500 * 1024 * 1024

/** 서버 AllowedAttachmentExtensions와 같은 목록 — 목록에 없으면 거부(default-deny) */
export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
]
export const ALLOWED_VIDEO_EXTENSIONS = [
  "mp4",
  "mov",
  "avi",
  "wmv",
  "mkv",
  "webm",
  "m4v",
]
/** 압축 파일도 문서로 취급한다 — file-chip UI가 같다(§13-8) */
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "hwp",
  "hwpx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "rtf",
  "zip",
  "rar",
  "7z",
]

export const ALLOWED_EXTENSIONS = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_VIDEO_EXTENSIONS,
  ...ALLOWED_DOCUMENT_EXTENSIONS,
]

export const THREAD_PAGE_SIZE = 50
export const MESSAGE_PAGE_SIZE = 30
export const REQUEST_PAGE_SIZE = 50

/**
 * 폴링 간격(ms) — 이 화면은 게시판형이고 실시간이 아니다(§13-1).
 * SSE·WebSocket을 붙이지 않고 재조회로만 갱신한다.
 */
export const SUMMARY_POLL_INTERVAL = 30_000
export const THREAD_LIST_POLL_INTERVAL = 15_000
export const MESSAGE_POLL_INTERVAL = 8_000

export const OPERATOR_CHANNEL_STATUS_TEXT = "공지·문의 채널"
export const CONNECTED_THREAD_STATUS_TEXT = "연결됨 · 스레드 열림"

export const OPERATOR_NOTICE_TEXT =
  "이 대화는 분쟁 발생 시 확인을 위해 운영자가 열람할 수 있습니다"

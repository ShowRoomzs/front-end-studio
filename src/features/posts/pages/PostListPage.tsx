import { Button } from "@/components/ui/button"
import FilterTabs from "@/features/posts/components/FilterTabs"
import PostCard from "@/features/posts/components/PostCard"
import { useGetPostList } from "@/features/posts/hooks/useGetPostList"
import type { PostStatus } from "@/features/posts/services/postService"
import { Image as ImageIcon, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

const TAB_PARAM_TO_STATUS: Record<string, PostStatus> = {
  published: "PUBLISHED",
  suspended: "SUSPENDED",
  draft: "DRAFT",
}
const STATUS_TO_TAB_PARAM: Record<string, string> = {
  PUBLISHED: "published",
  SUSPENDED: "suspended",
  DRAFT: "draft",
}

/**
 * 게시물 목록 (§24 · 시안 S1·S2).
 *
 * 여기에는 **일반 게시물만** 온다. 공구 게시물은 공구 1건당 1개로 묶여 있어 공구 관리(#4)가
 * 다루며, 작성 규칙·상태 전이·수정 가능 시점이 전부 달라 한 목록에 섞지 않는다.
 */
export default function PostListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = searchParams.get("tab") ?? ""
  const status = TAB_PARAM_TO_STATUS[tab]

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPostList(status)

  const pages = data?.pages ?? []
  const posts = pages.flatMap(page => page.content)
  // 탭 건수는 매 페이지에 실려 오지만 가장 최근에 받은 값이 제일 덜 낡았다
  const counts = pages.at(-1)?.statusCounts ?? []
  const totalCount = counts.find(item => item.status === null)?.count ?? 0

  /** 게시물이 하나도 없는 신규 인플루언서 — 탭 건수는 0으로 그대로 두고 목록 자리만 비운다 */
  const isEmptyAccount = !isLoading && totalCount === 0

  const changeTab = (next?: PostStatus) => {
    const params = new URLSearchParams()
    if (next) {
      params.set("tab", STATUS_TO_TAB_PARAM[next])
    }
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-sz-n-200">
        <FilterTabs active={status} counts={counts} onChange={changeTab} />
        {/*
          빈 상태에서는 주 CTA가 목록 자리의 [+ 첫 게시물 작성] 하나뿐이라
          툴바 버튼을 보조 버튼으로 강등한다 — 파란 버튼이 두 개면 어디를 눌러야 할지 갈린다
        */}
        <Button
          type="button"
          size="sm"
          variant={isEmptyAccount ? "outline" : "default"}
          className="mb-[9px]"
          onClick={() => navigate("/posts/new")}
        >
          <Plus className="size-3.5" aria-hidden />
          게시물 작성
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-4/5 animate-pulse rounded-[8px] bg-sz-n-100"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          isEmptyAccount={isEmptyAccount}
          onCreate={() => navigate("/posts/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {posts.map(post => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                isLoading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                더 보기
              </Button>
            </div>
          )}
        </>
      )}

      <p className="mt-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
        여기에는 <b className="text-sz-n-900">일반 게시물</b>만 표시됩니다. 공구
        게시물은 공구별로 1개씩 묶여 있어{" "}
        <b className="text-sz-n-900">공구 관리</b>에서 작성 · 확인합니다.
      </p>
    </div>
  )
}

function EmptyState(props: { isEmptyAccount: boolean; onCreate: () => void }) {
  const { isEmptyAccount, onCreate } = props

  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex flex-col items-center px-5 py-[72px] text-center">
        <div className="mb-3.5 flex size-11 items-center justify-center rounded-full bg-sz-n-100">
          <ImageIcon className="size-5 text-sz-n-400" aria-hidden />
        </div>
        <div className="mb-1.5 text-[13px] font-semibold text-sz-n-900">
          {isEmptyAccount
            ? "아직 게시물이 없습니다"
            : "해당하는 게시물이 없습니다"}
        </div>
        <div className="mb-[18px] text-[12px] leading-[1.75] text-sz-n-500">
          {isEmptyAccount ? (
            <>
              사진과 글을 올리면 내 쇼룸에 바로 보이고,
              <br />
              팔로워에게 새 게시물 알림이 갑니다.
            </>
          ) : (
            "다른 상태 탭을 확인해 보세요."
          )}
        </div>
        {isEmptyAccount && (
          <Button type="button" size="sm" onClick={onCreate}>
            <Plus className="size-3.5" aria-hidden />첫 게시물 작성
          </Button>
        )}
      </div>
    </div>
  )
}

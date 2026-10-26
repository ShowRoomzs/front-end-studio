import BusinessEmailCard from "@/features/basicInfo/components/account/BusinessEmailCard"
import IdentityCard from "@/features/basicInfo/components/account/IdentityCard"
import StudioAccountCard from "@/features/basicInfo/components/account/StudioAccountCard"
import { LoadingBlock, TwoColumns } from "@/features/basicInfo/components/parts"
import { useGetBasicInfoAccount } from "@/features/basicInfo/hooks/useBasicInfoQueries"

/** 계정 탭(S1 ~ S8) — 비공개 정보만. 공개 정보(쇼룸)는 쇼룸 관리(#8)가 맡는다 */
export default function AccountTab() {
  const { data: account, isLoading } = useGetBasicInfoAccount(true)

  if (isLoading || !account) {
    return <LoadingBlock isLoading={isLoading} />
  }

  return (
    <TwoColumns
      left={
        <>
          <IdentityCard identity={account.identity} />
          {/* 저장 성공으로 서버 값이 바뀌면 입력을 서버 값으로 다시 맞춘다 */}
          <BusinessEmailCard
            key={account.businessEmail ?? ""}
            businessEmail={account.businessEmail}
          />
        </>
      }
      right={<StudioAccountCard account={account} />}
    />
  )
}

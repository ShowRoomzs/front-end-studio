import { useEffect, useState } from "react"

/** 지금(ms) — `intervalMs`마다 다시 그린다(종료까지 남은 시간 · 「n분 전」 · 오늘 날짜) */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}

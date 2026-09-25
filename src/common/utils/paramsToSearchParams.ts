export function paramsToSearchParams<P extends object>(
  params: P
): URLSearchParams {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      // null이나 undefined는 URL에 추가하지 않음
      return
    }
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, String(item)))
    } else if (value !== "") {
      // 빈 문자열이 아닌 경우만 추가
      searchParams.set(key, String(value))
    }
  })

  return searchParams
}

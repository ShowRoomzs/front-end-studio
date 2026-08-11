export interface PageParams {
  page: number
  size: number
}

export interface PageInfo {
  currentPage: number
  totalPages: number
  totalResults: number
  limit: number
  hasNext: boolean
}

export interface PageResponse<T> {
  content: Array<T>
  pageInfo: PageInfo
}

export type BaseParams = PageParams

import type { PageResponse } from "@/common/types/page"
import {
  HOME_QUERY_KEYS,
  NOTIFICATION_SUMMARY_POLL_INTERVAL,
} from "@/features/home/constants/params"
import { notificationService } from "@/features/home/services/notificationService"
import type {
  NotificationItem,
  NotificationSummary,
} from "@/features/home/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** 종 배지 — 안 읽은 수(60초 폴링). 실패하면 배지를 그리지 않는다 */
export function useGetNotificationSummary() {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.NOTIFICATION_SUMMARY],
    queryFn: notificationService.getSummary,
    refetchInterval: NOTIFICATION_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
    retry: false,
  })
}

/** 드롭다운 목록 — 열 때만 부르고, 열 때마다 새로 받는다 */
export function useGetNotifications(enabled: boolean) {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.NOTIFICATION_LIST],
    queryFn: notificationService.getList,
    enabled,
    staleTime: 0,
    retry: false,
  })
}

type ListData = PageResponse<NotificationItem> | undefined

/** 한 건 읽음 — 이동이 먼저라 응답을 기다리지 않고 목록 · 배지를 먼저 고친다 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markRead,
    onMutate: notificationId => {
      queryClient.setQueryData<ListData>(
        [HOME_QUERY_KEYS.NOTIFICATION_LIST],
        prev =>
          prev && {
            ...prev,
            content: prev.content.map(item =>
              item.notificationId === notificationId
                ? { ...item, read: true }
                : item
            ),
          }
      )
      queryClient.setQueryData<NotificationSummary | undefined>(
        [HOME_QUERY_KEYS.NOTIFICATION_SUMMARY],
        prev => prev && { unreadCount: Math.max(0, prev.unreadCount - 1) }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [HOME_QUERY_KEYS.NOTIFICATION_SUMMARY],
      })
    },
  })
}

/** [모두 읽음] — 배지를 지운다(목록은 남는다) */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData<ListData>(
        [HOME_QUERY_KEYS.NOTIFICATION_LIST],
        prev =>
          prev && {
            ...prev,
            content: prev.content.map(item => ({ ...item, read: true })),
          }
      )
      queryClient.setQueryData<NotificationSummary>(
        [HOME_QUERY_KEYS.NOTIFICATION_SUMMARY],
        { unreadCount: 0 }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [HOME_QUERY_KEYS.NOTIFICATION_SUMMARY],
      })
    },
  })
}

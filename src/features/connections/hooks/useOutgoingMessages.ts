import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { uploadAttachment } from "@/features/connections/services/attachmentUploader"
import {
  threadService,
  type MessageItem,
  type MessageListResponse,
} from "@/features/connections/services/threadService"
import type {
  OutgoingAttachment,
  OutgoingMessage,
} from "@/features/connections/types"
import { getLocalAttachmentType } from "@/features/connections/utils/attachmentIcon"
import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

/**
 * 아직 서버에 없는 내 메시지들을 관리한다.
 *
 * 전송 버튼을 누르면 **먼저 말풍선이 뜨고**(시안 S7) 첨부 업로드가 그 아래에서
 * 진행된다. 전송 API는 완료된 `attachmentId` 배열을 요구하므로, 업로드가 전부
 * 끝난 뒤에야 실제 요청이 나간다.
 *
 * 서버 메시지 캐시(`useGetThreadMessages`)에 낙관적으로 끼워 넣지 않고 별도
 * 목록으로 들고 있는다 — 업로드 진행률·전송 실패 같은 로컬 전용 상태가 서버
 * 응답 타입에 없어서, 캐시에 섞으면 두 타입을 억지로 합쳐야 한다.
 */
export function useOutgoingMessages(threadId: number | null) {
  const queryClient = useQueryClient()
  const [outgoing, setOutgoing] = useState<Array<OutgoingMessage>>([])
  const abortControllers = useRef(new Map<string, AbortController>())

  // 스레드를 바꾸면 이전 스레드의 전송 대기열은 화면에서 사라져야 한다
  useEffect(() => {
    const controllers = abortControllers.current
    controllers.forEach(controller => controller.abort())
    controllers.clear()
    setOutgoing([])
  }, [threadId])

  const patchMessage = useCallback(
    (clientMessageId: string, patch: Partial<OutgoingMessage>) =>
      setOutgoing(prev =>
        prev.map(message =>
          message.clientMessageId === clientMessageId
            ? { ...message, ...patch }
            : message
        )
      ),
    []
  )

  const patchAttachment = useCallback(
    (
      clientMessageId: string,
      localId: string,
      patch: Partial<OutgoingAttachment>
    ) =>
      setOutgoing(prev =>
        prev.map(message =>
          message.clientMessageId === clientMessageId
            ? {
                ...message,
                attachments: message.attachments.map(attachment =>
                  attachment.localId === localId
                    ? { ...attachment, ...patch }
                    : attachment
                ),
              }
            : message
        )
      ),
    []
  )

  /** 전송에 성공한 메시지를 조회 캐시 맨 앞(=최신)에 끼워 넣는다 */
  const insertSentMessage = useCallback(
    (targetThreadId: number, sent: MessageItem) => {
      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        [THREAD_QUERY_KEYS.THREAD_MESSAGES, targetThreadId],
        current => {
          if (!current) {
            return current
          }
          const [firstPage, ...restPages] = current.pages
          const alreadyExists = firstPage.content.some(
            message => message.messageId === sent.messageId
          )
          if (alreadyExists) {
            return current
          }
          return {
            ...current,
            pages: [
              { ...firstPage, content: [sent, ...firstPage.content] },
              ...restPages,
            ],
          }
        }
      )
      queryClient.invalidateQueries({
        queryKey: [THREAD_QUERY_KEYS.THREAD_LIST],
      })
    },
    [queryClient]
  )

  /**
   * 첨부 업로드 → 메시지 전송. 재전송도 같은 경로를 탄다.
   * 이미 올라간 첨부(`summary` 있음)는 다시 올리지 않는다 — 재전송이
   * 처음부터 다시 시작되면 대용량 파일에서 사용자가 두 번 기다린다.
   */
  const runSend = useCallback(
    async (targetThreadId: number, message: OutgoingMessage) => {
      const { clientMessageId } = message
      const controller = new AbortController()
      abortControllers.current.set(clientMessageId, controller)

      try {
        const summaries = await Promise.all(
          message.attachments.map(async attachment => {
            if (attachment.summary) {
              return attachment.summary
            }
            const summary = await uploadAttachment({
              threadId: targetThreadId,
              file: attachment.file,
              signal: controller.signal,
              onProgress: progress =>
                patchAttachment(clientMessageId, attachment.localId, {
                  progress,
                }),
            })
            patchAttachment(clientMessageId, attachment.localId, {
              summary,
              progress: 100,
            })
            return summary
          })
        )

        const sent = await threadService.sendMessage(targetThreadId, {
          clientMessageId,
          content: message.content ?? undefined,
          attachmentIds: summaries.map(summary => summary.attachmentId),
        })

        insertSentMessage(targetThreadId, sent)
        setOutgoing(prev =>
          prev.filter(item => item.clientMessageId !== clientMessageId)
        )
      } catch (error) {
        // 취소는 실패가 아니다 — 이미 목록에서 지워졌으므로 상태를 되돌릴 것도 없다
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        patchMessage(clientMessageId, { status: "failed" })
      } finally {
        abortControllers.current.delete(clientMessageId)
      }
    },
    [insertSentMessage, patchAttachment, patchMessage]
  )

  const send = useCallback(
    (content: string, files: Array<File>) => {
      if (threadId === null) {
        return
      }

      const message: OutgoingMessage = {
        clientMessageId: crypto.randomUUID(),
        content: content.trim() || null,
        attachments: files.map(file => ({
          localId: crypto.randomUUID(),
          file,
          attachmentType: getLocalAttachmentType(file.name),
          progress: 0,
        })),
        status: "sending",
        createdAt: new Date().toISOString(),
      }

      setOutgoing(prev => [...prev, message])
      void runSend(threadId, message)
    },
    [runSend, threadId]
  )

  const retry = useCallback(
    (clientMessageId: string) => {
      if (threadId === null) {
        return
      }
      const target = outgoing.find(
        message => message.clientMessageId === clientMessageId
      )
      if (!target) {
        return
      }
      patchMessage(clientMessageId, { status: "sending" })
      void runSend(threadId, { ...target, status: "sending" })
    },
    [outgoing, patchMessage, runSend, threadId]
  )

  const cancel = useCallback((clientMessageId: string) => {
    abortControllers.current.get(clientMessageId)?.abort()
    abortControllers.current.delete(clientMessageId)
    setOutgoing(prev =>
      prev.filter(message => message.clientMessageId !== clientMessageId)
    )
  }, [])

  return { outgoing, send, retry, cancel }
}

"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, CheckCheck, X } from "lucide-react";
import { EmptyState } from "./WorkspaceUI";
import { useAuth } from "@/context/AuthContext";
import { backendError, useNotifications } from "@/hooks/useWorkspaceData";
import { apiClient } from "@/lib/client";

export type WorkspaceNotification = {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  read: boolean;
};
export default function NotificationWidget({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const query = useNotifications(page);
  const { token } = useAuth();
  const connected = query.isSuccess;
  const items: WorkspaceNotification[] = (query.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      title: item.title,
      body: item.message,
      category: item.type,
      createdAt: item.created_at,
      read: Boolean(item.read_at),
    }),
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unread = items.filter((item) => !item.read);
  const visible = filter === "unread" ? unread : items;
  async function markRead(ids: string[]) {
    if (!token || !connected || busy) return;
    setBusy(true);
    setError("");
    try {
      await Promise.all(
        ids.map((id) =>
          apiClient.post(
            `/api/v1/notifications/${encodeURIComponent(id)}/read`,
            undefined,
            { timeout: 15000, headers: { Authorization: `Bearer ${token}` } },
          ),
        ),
      );
      await query.refetch();
    } catch {
      setError("Couldn’t update read status. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          className="cc-dialog cc-notifications"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("cc-notifications-trigger")?.focus();
          }}
        >
          <div className="cc-panel-heading">
            <div>
              <span className="cc-eyebrow">Your inbox</span>
              <Dialog.Title>Notifications</Dialog.Title>
            </div>
            <Dialog.Close
              className="cc-icon-button"
              aria-label="Close notifications"
            >
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="cc-sr-only">
            Account updates, price alerts, and community replies.
          </Dialog.Description>
          <div className="cc-notification-tools">
            <div
              className="cc-segmented"
              role="group"
              aria-label="Filter notifications"
            >
              <button
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={filter === "unread"}
                onClick={() => setFilter("unread")}
              >
                Unread
                {connected && unread.length > 0 ? ` (${unread.length})` : ""}
              </button>
            </div>
            <button
              type="button"
              className="cc-icon-button"
              aria-label="Mark displayed notifications as read"
              disabled={!connected || !unread.length || busy}
              onClick={() => void markRead(unread.map((item) => item.id))}
            >
              <CheckCheck size={18} />
            </button>
          </div>
          {error && (
            <p className="cc-error" role="alert">
              {error}
            </p>
          )}
          {query.isPending ? (
            <p className="cc-section-message">Loading your notifications…</p>
          ) : query.isError ? (
            <EmptyState
              icon={<Bell size={24} />}
              title="Notifications unavailable"
            >
              <p>{backendError(query.error)}</p>
              <button
                type="button"
                className="cc-button"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<CheckCheck size={24} />}
              title={
                filter === "unread"
                  ? "No unread notifications on this page"
                  : "No notifications yet"
              }
            >
              <p>New updates will appear here.</p>
            </EmptyState>
          ) : (
            <ul className="cc-notification-list">
              {visible.map((item) => (
                <li key={item.id} data-unread={!item.read}>
                  <span className="cc-eyebrow">{item.category}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                  {!item.read && (
                    <button
                      type="button"
                      className="cc-text-button"
                      disabled={busy}
                      onClick={() => void markRead([item.id])}
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="cc-panel-footer">
            <button
              type="button"
              className="cc-text-button"
              disabled={page === 1 || query.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              className="cc-text-button"
              disabled={
                !query.data || page * 20 >= query.data.total || query.isFetching
              }
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

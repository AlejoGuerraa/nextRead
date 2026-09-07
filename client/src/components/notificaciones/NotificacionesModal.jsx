import React, { useEffect, useState } from "react";
import { Bell, Heart, UserPlus, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../acceso/modal";
import { deleteAllNotifications, deleteNotification, getPublicUserById } from "../../services/notificationsService";
import { getUserFollowed, followUser } from "../../services/usersService";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../ToastProvider";
import "../../pagescss/notificaciones.css";

const PAGE_SIZE = 10;

const getAvatarSrc = (rawIcon) => {
  if (typeof rawIcon !== "string" || !rawIcon.trim()) return "/iconos/LogoDefault1.jpg";
  if (rawIcon.startsWith("/") || rawIcon.startsWith("http")) return rawIcon;
  return `/iconos/${rawIcon}`;
};

const getRelativeTime = (value) => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
};

export default function NotificacionesModal({ open, close, data, onRefresh, userData }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const notifications = userData?.notificaciones || data?.notificaciones || [];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [userMap, setUserMap] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followingId, setFollowingId] = useState(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [open, notifications.length]);

  useEffect(() => {
    const ids = [...new Set(notifications.map((notification) => notification.meta?.fromUser).filter(Boolean))];
    const missingIds = ids.filter((id) => !userMap[id]);
    if (!missingIds.length) return;

    let active = true;
    Promise.all(missingIds.map(async (id) => {
      try {
        return [id, await getPublicUserById(id)];
      } catch {
        return [id, null];
      }
    })).then((entries) => {
      if (!active) return;
      setUserMap((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter(([, user]) => user)),
      }));
    });

    return () => {
      active = false;
    };
  }, [notifications, userMap]);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    getUserFollowed(currentUser.id)
      .then((data) => {
        const ids = (data.seguidos || []).map((item) => item.usuario?.id).filter(Boolean);
        setFollowedIds(new Set(ids.map(Number)));
      })
      .catch(() => setFollowedIds(new Set()));
  }, [open, currentUser?.id]);

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
      toast?.push("Notificación eliminada", "success");
      await onRefresh?.();
    } catch (error) {
      toast?.push(error.response?.data?.error || "No se pudo eliminar la notificación", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      toast?.push("Notificaciones eliminadas", "success");
      await onRefresh?.();
    } catch (error) {
      toast?.push(error.response?.data?.error || "No se pudieron eliminar las notificaciones", "error");
    }
  };

  const handleFollow = async (event, user) => {
    event.stopPropagation();
    if (!user?.id || followedIds.has(Number(user.id))) return;
    setFollowingId(user.id);
    try {
      await followUser(user.id);
      setFollowedIds((current) => new Set([...current, Number(user.id)]));
      toast?.push(`Ahora seguís a ${user.usuario}`, "success");
    } catch (error) {
      toast?.push(error.response?.data?.error || "No se pudo seguir al usuario", "error");
    } finally {
      setFollowingId(null);
    }
  };

  const handleNotificationClick = (notification, user) => {
    const meta = notification.meta || {};
    if (meta.type === "new_like" && meta.bookId) {
      close();
      navigate(`/libro/${meta.bookId}`);
      return;
    }
    if (meta.type === "follow" && user?.usuario) {
      close();
      navigate(`/user/${user.usuario}`);
    }
  };

  const visibleNotifications = notifications.slice(0, visibleCount);

  return (
    <Modal openModal={open} closeModal={close} extraClass="notif-modal">
      <div className="notif-container">
        <div className="notif-toolbar">
          <span className="notif-count">{notifications.length} {notifications.length === 1 ? "aviso" : "avisos"}</span>
          {notifications.length > 0 && (
            <button className="notif-clear-button" type="button" onClick={handleDeleteAll}>
              <Trash2 size={15} aria-hidden="true" />
              Vaciar
            </button>
          )}
        </div>

        {visibleNotifications.length === 0 ? (
          <p className="notif-empty">No tenés notificaciones por ahora.</p>
        ) : (
          <div className="notif-list">
            {visibleNotifications.map((notification) => {
              const meta = notification.meta || {};
              const user = userMap[meta.fromUser];
              const username = user?.usuario || notification.nombre || "Usuario";
              const isLike = meta.type === "new_like";
              const isFollow = meta.type === "follow";
              const isUnread = !notification.leido;
              const Icon = isLike ? Heart : isFollow ? UserPlus : Bell;
              const message = isLike
                ? "indicó que le gusta tu comentario"
                : isFollow
                  ? "comenzó a seguirte"
                  : notification.mensaje || "realizó una acción";

              return (
                <article
                  key={notification.id}
                  className={`notif-item ${isUnread ? "notif-item--unread" : "notif-item--read"}`}
                  onClick={() => handleNotificationClick(notification, user)}
                  role={meta.type === "follow" || isLike ? "button" : undefined}
                  tabIndex={meta.type === "follow" || isLike ? 0 : undefined}
                >
                  <div className="notif-avatar">
                    <img
                      src={getAvatarSrc(user?.iconoData?.simbolo || user?.idIcono)}
                      alt={`Avatar de ${username}`}
                      onError={(event) => { event.currentTarget.src = "/iconos/LogoDefault1.jpg"; }}
                    />
                  </div>
                  <div className="notif-text">
                    <p><strong>{username}</strong> {message}</p>
                    {isLike && meta.commentPreview && <blockquote>“{meta.commentPreview}”</blockquote>}
                    <span className="notif-date">{getRelativeTime(notification.fecha)}</span>
                  </div>
                  <Icon className={`notif-type-icon ${isLike ? "notif-type-icon--like" : "notif-type-icon--follow"}`} size={18} aria-hidden="true" />
                  {isFollow && user && !followedIds.has(Number(user.id)) && (
                    <button className="notif-follow-button" type="button" onClick={(event) => handleFollow(event, user)} disabled={followingId === user.id}>
                      {followingId === user.id ? "Siguiendo..." : "Seguir"}
                    </button>
                  )}
                  <button className="notif-delete-button" type="button" onClick={(event) => handleDelete(event, notification.id)} disabled={deletingId === notification.id} aria-label="Eliminar notificación">
                    <X size={17} aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {visibleCount < notifications.length && (
          <button className="notif-more-button" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Mostrar más
          </button>
        )}
      </div>
    </Modal>
  );
}

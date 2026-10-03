"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Notification, NotificationType, UserRole } from "@/types/database";
import { initialMockNotifications, MockNotification } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";

// Server memory store for demo mode fallback
let demoNotifications: MockNotification[] = [...initialMockNotifications];

export async function getNotifications(params?: {
  userId?: string;
  role?: UserRole | "all";
}): Promise<Notification[]> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    // Strictly filter demo notifications based on role
    return demoNotifications
      .filter((n) => {
        if (!params?.role || params.role === "all") return true;
        return n.recipientRole === params.role;
      })
      .map((n) => ({
        id: n.id,
        user_id: n.userId || null,
        recipient_role: n.recipientRole,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        link_url: n.linkUrl || null,
        is_read: n.isRead,
        created_at: n.createdAt,
      }));
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (params?.role && params.role !== "all") {
    query = query.eq("recipient_role", params.role);
  } else if (params?.userId) {
    query = query.eq("user_id", params.userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getNotifications error:", error);
    return [];
  }

  return (data || []) as Notification[];
}

export async function createNotification(payload: {
  userId?: string;
  recipientRole?: UserRole | "all";
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; id?: string }> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    const newNotif: MockNotification = {
      id: "notif-" + Date.now(),
      userId: payload.userId,
      recipientRole: payload.recipientRole || "all",
      type: payload.type,
      title: payload.title,
      message: payload.message,
      linkUrl: payload.linkUrl,
      isRead: false,
      createdAt: "Just now",
    };
    demoNotifications = [newNotif, ...demoNotifications];
    return { success: true, id: newNotif.id };
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: payload.userId || null,
      recipient_role: payload.recipientRole || "all",
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link_url: payload.linkUrl || null,
      metadata: payload.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("createNotification error:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true, id: data.id };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    demoNotifications = demoNotifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    return { success: true };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) return { success: false };
  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsAsRead(userId?: string): Promise<{ success: boolean }> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    demoNotifications = demoNotifications.map((n) => ({ ...n, isRead: true }));
    return { success: true };
  }

  let query = supabase.from("notifications").update({ is_read: true });
  if (userId) {
    query = query.or(`user_id.eq.${userId},recipient_role.eq.all`);
  }

  await query;
  revalidatePath("/");
  return { success: true };
}

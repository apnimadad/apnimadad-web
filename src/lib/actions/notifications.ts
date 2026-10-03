"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Notification, NotificationType, UserRole } from "@/types/database";
import { revalidatePath } from "next/cache";

// Server memory store for session notifications when DB connection is not initialized
let sessionNotifications: Notification[] = [];

export async function getNotifications(params?: {
  userId?: string;
  role?: UserRole | "all";
}): Promise<Notification[]> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return sessionNotifications.filter((n) => {
      if (!params?.role || params.role === "all") return true;
      return n.recipient_role === params.role;
    });
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
    const newNotif: Notification = {
      id: "notif-" + Date.now(),
      user_id: payload.userId || null,
      recipient_role: payload.recipientRole || "all",
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link_url: payload.linkUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    sessionNotifications = [newNotif, ...sessionNotifications];
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
    sessionNotifications = sessionNotifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
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
    sessionNotifications = sessionNotifications.map((n) => ({ ...n, is_read: true }));
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

export async function clearAllNotifications(
  userId?: string,
  role?: UserRole | "all"
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    sessionNotifications = [];
    return { success: true };
  }

  let query = supabase.from("notifications").delete();
  if (role && role !== "all") {
    query = query.eq("recipient_role", role);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.neq("id", "00000000-0000-0000-0000-000000000000");
  }

  await query;
  revalidatePath("/");
  return { success: true };
}


import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "@/lib/actions/notifications";
import { NotificationType, UserRole } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const role = (searchParams.get("role") as UserRole) || "all";

    const notifications = await getNotifications({ userId, role });
    return NextResponse.json({ success: true, notifications });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipientRole, type, title, message, linkUrl, metadata } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { success: false, error: "Title, message, and type are required" },
        { status: 400 }
      );
    }

    const res = await createNotification({
      userId,
      recipientRole: recipientRole || "all",
      type: type as NotificationType,
      title,
      message,
      linkUrl,
      metadata,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create notification";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAll, userId, role, notificationIds } = body;

    if (markAll) {
      const res = await markAllNotificationsAsRead(userId, role, notificationIds);
      return NextResponse.json(res);
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const res = await markNotificationAsRead(id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const role = (searchParams.get("role") as UserRole) || "all";
    const res = await clearAllNotifications(userId, role);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete notifications";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

import { PaymentStatus } from "@prisma/client";
import { getAdminAccess } from "@/lib/admin-auth";
import { getDatabaseErrorDetails } from "@/lib/database-error";
import { prisma } from "@/lib/db";
import {
  canTransitionOrderStatus,
  isOrderFulfillmentStatus,
} from "@/lib/order-status";
import { isSameOriginRequest } from "@/lib/request-origin";

type AdminOrderRouteContext = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

async function getRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getRequestedStatus(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return "status" in value ? value.status : undefined;
}

export async function PATCH(
  request: Request,
  { params }: AdminOrderRouteContext
): Promise<Response> {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json(
        { error: "Cross-site requests are not allowed." },
        { status: 403 }
      );
    }

    const access = await getAdminAccess();

    if (access.status === "unauthenticated") {
      return Response.json(
        { error: "You must be logged in to manage orders." },
        { status: 401 }
      );
    }

    if (access.status === "forbidden") {
      return Response.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }

    const orderId = (await params).id.trim();

    if (!orderId) {
      return Response.json({ error: "Order ID is required." }, { status: 400 });
    }

    const requestedStatus = getRequestedStatus(await getRequestBody(request));

    if (!isOrderFulfillmentStatus(requestedStatus)) {
      return Response.json(
        { error: "Choose a valid fulfillment status." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status === requestedStatus) {
      return Response.json({ order });
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      return Response.json(
        { error: "Only paid orders can advance through fulfillment." },
        { status: 409 }
      );
    }

    if (!canTransitionOrderStatus(order.status, requestedStatus)) {
      return Response.json(
        {
          error: `An order cannot move from ${order.status} to ${requestedStatus}.`,
        },
        { status: 409 }
      );
    }

    const updateResult = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: order.status,
        paymentStatus: PaymentStatus.PAID,
      },
      data: {
        status: requestedStatus,
      },
    });

    if (updateResult.count !== 1) {
      return Response.json(
        {
          error:
            "The order changed while it was being updated. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    return Response.json({
      order: {
        ...order,
        status: requestedStatus,
      },
    });
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return Response.json(
        { error: databaseError.message },
        {
          status: databaseError.status,
          headers: databaseError.retryAfterSeconds
            ? { "Retry-After": String(databaseError.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    console.error(error);

    return Response.json(
      { error: "Failed to update order status." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { allRoutes } from "@/lib/server/handlers";
import { dispatch, type Method } from "@/lib/server/handlers/common";

export const dynamic = "force-dynamic";

async function handle(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  try {
    const { path } = await ctx.params;
    const rawPath = "/" + (path ?? []).join("/");
    const method = req.method.toUpperCase() as Method;
    return await dispatch(allRoutes, req, rawPath, method);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ không xác định.";
    return NextResponse.json(
      { statusCode: 500, message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}

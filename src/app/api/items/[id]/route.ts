import { handleGetItemDetail } from "./route-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetItemDetail(request, context);
}

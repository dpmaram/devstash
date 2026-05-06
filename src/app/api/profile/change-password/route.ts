import { handleChangePasswordPost } from "./route-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleChangePasswordPost(request);
}

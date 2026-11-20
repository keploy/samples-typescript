import { handleApi } from "../../../shop-api.mjs";

// The shop's API: every request under /api is answered by shop-api.mjs,
// in this server's memory.
async function answer(request: Request): Promise<Response> {
  const result = handleApi(request.method, new URL(request.url), await request.text());
  return Response.json(result.body, { status: result.status });
}

export const GET = answer;
export const POST = answer;

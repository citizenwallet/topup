"use server";

let config;
async function loadConfig() {
  if (config) return Promise.resolve(config);
  const res = await fetch(
    "https://config.internal.citizenwallet.xyz/v3/communities.json"
  );
  config = await res.json();
  return config;
}

export async function GET(request, { params }) {
  const searchParams = request.nextUrl.searchParams;
  const communitySlug = searchParams.get("communitySlug");

  const communities = await loadConfig();

  let res;
  if (!communitySlug) {
    res = communities;
  } else {
    res = communities.find((c) => c.community.alias === communitySlug);
  }

  if (!res)
    return Response.json({ error: "Community not found" }, { status: 404 });

  return Response.json(res);
}

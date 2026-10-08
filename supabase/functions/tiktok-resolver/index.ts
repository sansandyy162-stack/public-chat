const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isTikTokHost(hostname: string) {
  const host = hostname.toLowerCase();

  return (
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com")
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await request.json();
    const sourceUrl = new URL(String(url || ""));

    if (!isTikTokHost(sourceUrl.hostname)) {
      return Response.json(
        { error: "URL harus berasal dari TikTok." },
        { status: 400, headers: corsHeaders },
      );
    }

    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrivateChatResolver/1.0)",
      },
    });

    const finalUrl = response.url || sourceUrl.toString();
    const videoId = finalUrl.match(/\/video\/(\d+)/i)?.[1];

    if (!videoId) {
      return Response.json(
        { error: "Video TikTok tidak ditemukan dari tautan ini." },
        { status: 422, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        url: finalUrl,
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: "Tautan TikTok tidak dapat diproses." },
      { status: 400, headers: corsHeaders },
    );
  }
});

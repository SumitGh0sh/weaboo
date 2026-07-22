export default async function handler(req, res) {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  const { client_id, client_secret, code, code_verifier, redirect_uri } = body || {};
  const secretToUse = client_secret || process.env.VITE_MAL_CLIENT_SECRET || process.env.MAL_CLIENT_SECRET || "";

  if (!client_id || !code || !code_verifier || !redirect_uri) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const response = await fetch("https://myanimelist.net/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret: secretToUse,
        grant_type: "authorization_code",
        code,
        code_verifier,
        redirect_uri,
      }).toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

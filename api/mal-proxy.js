export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { endpoint } = req.query;
  const authHeader = req.headers.authorization;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing endpoint parameter" });
  }

  try {
    const malUrl = `https://api.myanimelist.net/v2${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    const response = await fetch(malUrl, {
      method: req.method || "GET",
      headers: {
        Authorization: authHeader || ""
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

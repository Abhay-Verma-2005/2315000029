const AUTH_URL = "http://4.224.186.213/evaluation-service/auth";

const CREDENTIALS = {
  email: "abhay.verma_cs23@gla.ac.in",
  name: "abhay verma",
  rollNo: "2315000029",
  accessCode: "RPsgYt",
  clientID: "f612d6dd-1ee4-4175-8aba-3c79ef6a7b0a",
  clientSecret: "NJmUDFdgtYXnVxdg"
};

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry - 60) return cachedToken;

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS)
  });

  if (!res.ok && res.status !== 201) throw new Error("Auth failed: " + res.status);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_in;
  return cachedToken;
}

export { getAccessToken };

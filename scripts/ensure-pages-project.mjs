const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const projectName = "sunsup";
const productionBranch = "main";

if (!accountId || !token) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
  process.exit(1);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`;

async function call(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { errors: [{ message: text.slice(0, 500) }] };
    }
  }
  return { status: response.status, payload };
}

const lookup = await call("GET", `${base}/${projectName}`);
if (lookup.status === 200 && lookup.payload.success === true) {
  console.log(`Pages project ${projectName} already exists.`);
  process.exit(0);
}

const errors = Array.isArray(lookup.payload.errors) ? lookup.payload.errors : [];
const missing =
  lookup.status === 404 || errors.some((error) => error.code === 8000007);

if (!missing) {
  console.error(
    `Could not read Pages project ${projectName} (HTTP ${lookup.status}).`,
  );
  console.error(JSON.stringify(errors));
  process.exit(1);
}

const created = await call("POST", base, {
  name: projectName,
  production_branch: productionBranch,
});

if (
  (created.status === 200 || created.status === 201) &&
  created.payload.success === true
) {
  const subdomain = created.payload.result?.subdomain;
  console.log(
    `Created Pages project ${projectName} with production branch ${productionBranch}.`,
  );
  if (typeof subdomain === "string" && subdomain.length > 0) {
    console.log(`Pages hostname: ${subdomain}`);
  }
  process.exit(0);
}

console.error(
  `Could not create Pages project ${projectName} (HTTP ${created.status}).`,
);
console.error(JSON.stringify(created.payload.errors ?? created.payload));
process.exit(1);

const PLAUSIBLE_URL = 'https://plausible.io/js/pa-qu38XzloqDhefv3GNak5F.js';

export default async function handler(req, res) {
  const upstream = await fetch(PLAUSIBLE_URL);
  const body = await upstream.text();

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
  res.status(200).send(body);
}

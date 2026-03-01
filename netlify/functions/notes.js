const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID  = process.env.JSONBIN_BIN_ID;
const BASE_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // URL preview fetch
  if (event.httpMethod === 'POST' && event.path.includes('preview')) {
    try {
      const { url } = JSON.parse(event.body || '{}');
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||url;
      const desc  = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)||[])[1]||'';
      const img   = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)||[])[1]||'';
      return { statusCode: 200, headers, body: JSON.stringify({ title: title.trim(), desc: desc.trim(), img, url }) };
    } catch(e) {
      return { statusCode: 200, headers, body: JSON.stringify({ title: event.body ? JSON.parse(event.body).url : '', desc:'', img:'', url: event.body ? JSON.parse(event.body).url : '' }) };
    }
  }

  if (event.httpMethod === 'GET') {
    const res = await fetch(BASE_URL + '/latest', { headers: { 'X-Master-Key': JSONBIN_API_KEY } });
    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify({ notes: data.record?.notes || [] }) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'X-Master-Key': JSONBIN_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: body.notes || [] })
    });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: 'Method not allowed' };
};

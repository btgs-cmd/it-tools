const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID  = process.env.JSONBIN_BIN_ID;

const BASE_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'GET') {
    // Load notes
    const res = await fetch(BASE_URL + '/latest', {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: data.record?.text || '' })
    };
  }

  if (event.httpMethod === 'POST') {
    // Save notes
    const body = JSON.parse(event.body || '{}');
    const text = body.text || '';
    await fetch(BASE_URL, {
      method: 'PUT',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: 'Method not allowed' };
};

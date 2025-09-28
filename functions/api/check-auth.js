const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
function getKV(env){
  return (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
}
function sanitizeName(n){ return String(n||'').trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200); }

export async function onRequest(context){
  const { request } = context;
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  const cookie = request.headers.get('cookie') || '';
  const auth = cookie.split(';').map(s=>s.trim()).includes('auth=1');
  return new Response(JSON.stringify({ auth }), { status:200, headers: JSON_HEADERS });
}

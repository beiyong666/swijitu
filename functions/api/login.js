const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
function getKV(env){ return (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null); }
function sanitize(n){ return String(n||'').trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200); }

export async function onRequest(context){
  const { request } = context;
  const wj = getKV(context.env);
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  try{
    let pwd = null;
    if(request.method === 'GET'){ const u = new URL(request.url); pwd = u.searchParams.get('password'); }
    else { const b = await request.json().catch(()=>null); pwd = b && b.password; }
    if(!pwd) return new Response(JSON.stringify({ ok:false, error:'missing password' }), { status:400, headers: JSON_HEADERS });
    const adminPwd = 'Dd112211';
    if(pwd === adminPwd){ const headers = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Set-Cookie': 'auth=1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax' }; return new Response(JSON.stringify({ ok:true }), { status:200, headers }); }
    return new Response(JSON.stringify({ ok:false, error:'bad password' }), { status:401, headers: JSON_HEADERS });
  }catch(e){ return new Response(JSON.stringify({ ok:false, error: String(e) }), { status:500, headers: JSON_HEADERS }); }
}

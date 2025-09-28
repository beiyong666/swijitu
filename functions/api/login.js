export async function onRequest(context) {
  const { request, env } = context;
  const kv = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  function jsonHeaders(){ return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' }; }
  if(!kv) return new Response(JSON.stringify({ error: 'KV binding "wj" not found.' }), { status:500, headers: jsonHeaders() });

  try{
    if(request.method !== 'POST') return new Response(JSON.stringify({ error:'Method not allowed' }), { status:405, headers: jsonHeaders() });
    const body = await request.json();
    if(!body.password) return new Response(JSON.stringify({ error:'missing password' }), { status:400, headers: jsonHeaders() });
    const adminPwd = (env && (env.ADMIN_PASSWORD || env.ADMIN_PASS)) || null;
    if(!adminPwd) return new Response(JSON.stringify({ error:'Admin password not configured. Set ADMIN_PASSWORD in environment.' }), { status:500, headers: jsonHeaders() });
    if(body.password === adminPwd){
      // set HttpOnly cookie valid for 1 hour (EdgeOne may set Secure; SameSite as needed)
      const headers = {
        'Content-Type':'application/json; charset=utf-8',
        'Set-Cookie': 'auth=1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax'
      };
      return new Response(JSON.stringify({ ok:true }), { status:200, headers });
    } else {
      return new Response(JSON.stringify({ error:'bad password' }), { status:401, headers: jsonHeaders() });
    }
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status:500, headers: jsonHeaders() });
  }
}
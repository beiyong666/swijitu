export async function onRequest(context) {
  const { request } = context;
  function jsonHeaders(){ return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' }; }
  try{
    if(request.method !== 'POST') return new Response(JSON.stringify({ error:'Method not allowed' }), { status:405, headers: jsonHeaders() });
    const body = await request.json();
    if(!body.password) return new Response(JSON.stringify({ error:'missing password' }), { status:400, headers: jsonHeaders() });
    const adminPwd = 'Dd112211';
    if(body.password === adminPwd){
      const headers = { 'Content-Type':'application/json; charset=utf-8', 'Set-Cookie': 'auth=1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax' };
      return new Response(JSON.stringify({ ok:true }), { status:200, headers });
    } else {
      return new Response(JSON.stringify({ error:'bad password' }), { status:401, headers: jsonHeaders() });
    }
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status:500, headers: jsonHeaders() });
  }
}
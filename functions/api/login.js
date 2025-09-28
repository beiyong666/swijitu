export async function onRequest(context) {
  const { request } = context;
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  try{
    if(request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status:405, headers: JSON_HEADERS });
    const body = await request.json().catch(()=>{ return null; });
    if(!body || !body.password) return new Response(JSON.stringify({ error:'missing password' }), { status:400, headers: JSON_HEADERS });
    const adminPwd = 'Dd112211';
    if(body.password === adminPwd){
      const headers = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' , 'Set-Cookie': 'auth=1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax' };
      return new Response(JSON.stringify({ ok:true }), { status:200, headers });
    } else {
      return new Response(JSON.stringify({ error:'bad password' }), { status:401, headers: JSON_HEADERS });
    }
  }catch(err){
    return new Response(JSON.stringify({ error: String(err) }), { status:500, headers: JSON_HEADERS });
  }
}
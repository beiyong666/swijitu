export async function onRequest(context) {
  const { request, env } = context;
  const wj = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  if(!wj) return new Response(JSON.stringify({ ok:false, error:'KV binding "wj" not found.' }), { status:500, headers: JSON_HEADERS });
  try {
    if (request.method !== 'POST') return new Response(JSON.stringify({ ok:false, error:'Method not allowed' }), { status:405, headers: JSON_HEADERS });
    const body = await request.json().catch(()=>null);
    if(!body || !body.dir) return new Response(JSON.stringify({ ok:false, error:'missing dir' }), { status:400, headers: JSON_HEADERS });
    const dir = String(body.dir).trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200);
    const key = 'dir:' + dir;
    const raw = await wj.get(key);
    let list = [];
    if(raw){ try{ list = JSON.parse(raw); }catch(e){ list = []; } }
    if(body.url && body.url.length){ list.push(body.url); await wj.put(key, JSON.stringify(list)); }
    else { await wj.put(key, JSON.stringify(list)); }
    // update dirs
    const rawDirs = await wj.get('dirs'); let dirs = [];
    if(rawDirs){ try{ dirs = JSON.parse(rawDirs); }catch(e){ dirs = []; } }
    if(!dirs.includes(dir)){ dirs.push(dir); await wj.put('dirs', JSON.stringify(dirs)); }
    return new Response(JSON.stringify({ ok:true, name:dir, images:list }), { headers: JSON_HEADERS });
  } catch(e) {
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status:500, headers: JSON_HEADERS });
  }
}
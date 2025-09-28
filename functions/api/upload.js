const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
function getKV(env){ return (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null); }
function sanitize(n){ return String(n||'').trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200); }

export async function onRequest(context){
  const { request, env } = context;
  const wj = getKV(env);
  if(!wj) return new Response(JSON.stringify({ ok:false, error:'KV binding wj not found' }), { status:500, headers: JSON_HEADERS });
  try{
    let dir, url;
    if(request.method === 'GET'){
      const u = new URL(request.url);
      dir = u.searchParams.get('dir');
      url = u.searchParams.get('url') || '';
    } else {
      const b = await request.json().catch(()=>null);
      dir = b && b.dir; url = b && b.url;
    }
    if(!dir) return new Response(JSON.stringify({ ok:false, error:'missing dir' }), { status:400, headers: JSON_HEADERS });
    const name = sanitize(dir);
    const key = 'dir:' + name;
    const raw = await wj.get(key);
    let list = [];
    if(raw){ try{ list = JSON.parse(raw); }catch(e){ list = []; } }
    if(url && url.length){ list.push(url); await wj.put(key, JSON.stringify(list)); }
    else { await wj.put(key, JSON.stringify(list)); }
    const rawDirs = await wj.get('dirs'); let dirs = [];
    if(rawDirs){ try{ dirs = JSON.parse(rawDirs); }catch(e){ dirs = []; } }
    if(!dirs.includes(name)){ dirs.push(name); await wj.put('dirs', JSON.stringify(dirs)); }
    return new Response(JSON.stringify({ ok:true, name, images:list }), { headers: JSON_HEADERS });
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status:500, headers: JSON_HEADERS });
  }
}

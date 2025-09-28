const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
function getKV(env){ return (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null); }
function sanitize(n){ return String(n||'').trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200); }

export async function onRequest(context){
  const { request, env } = context;
  const wj = getKV(env);
  if(!wj) return new Response(JSON.stringify({ ok:false, error:'KV binding wj not found' }), { status:500, headers: JSON_HEADERS });
  try{
    let body = null; if(request.method !== 'GET') body = await request.json().catch(()=>null);
    const u = new URL(request.url);
    const dir = (request.method === 'GET') ? u.searchParams.get('dir') : (body && body.dir);
    const urlParam = (request.method === 'GET') ? u.searchParams.get('url') : (body && body.url);
    const delFlag = (request.method === 'GET') ? (u.searchParams.get('deleteDir') === '1') : (body && body.deleteDir);
    if(!dir) return new Response(JSON.stringify({ ok:false, error:'missing dir' }), { status:400, headers: JSON_HEADERS });
    const name = sanitize(dir); const key = 'dir:' + name;
    if(delFlag){
      await wj.delete(key);
      const rawDirs = await wj.get('dirs'); let dirs = []; if(rawDirs){ try{ dirs = JSON.parse(rawDirs); }catch(e){ dirs = []; } }
      const idx = dirs.indexOf(name); if(idx !== -1) dirs.splice(idx,1); await wj.put('dirs', JSON.stringify(dirs));
      return new Response(JSON.stringify({ ok:true, deleted:name }), { headers: JSON_HEADERS });
    } else if(urlParam){
      const raw = await wj.get(key); let list = []; if(raw){ try{ list = JSON.parse(raw); }catch(e){ list = []; } }
      list = list.filter(u => u !== urlParam); await wj.put(key, JSON.stringify(list));
      return new Response(JSON.stringify({ ok:true, name, images:list }), { headers: JSON_HEADERS });
    } else { return new Response(JSON.stringify({ ok:false, error:'missing url or deleteDir flag' }), { status:400, headers: JSON_HEADERS }); }
  }catch(e){ return new Response(JSON.stringify({ ok:false, error: String(e) }), { status:500, headers: JSON_HEADERS }); }
}

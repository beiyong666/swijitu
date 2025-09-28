export async function onRequest(context) {
  const { request, env } = context;
  const wj = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  if(!wj) return new Response(JSON.stringify({ error: 'KV binding "wj" not found.' }), { status:500, headers: JSON_HEADERS });

  try{
    if(request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status:405, headers: JSON_HEADERS });

    const body = await request.json().catch(()=>{ return null; });
    if(!body || !body.dir) return new Response(JSON.stringify({ error: 'missing dir' }), { status:400, headers: JSON_HEADERS });

    const dir = String(body.dir).trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200);
    const key = 'dir:' + dir;

    // read existing list using wj.get as you provided
    const raw = await wj.get(key);
    let list = [];
    if(raw){
      try{ list = JSON.parse(raw); }catch(e){ list = []; }
    } else {
      list = [];
    }

    // if url provided, add it
    if(body.url && body.url.length){
      list.push(body.url);
      await wj.put(key, JSON.stringify(list));
    } // if body.url empty, just ensure dir exists by writing current list (no-op if existed)
    
    // ensure dirs index has this dir
    const rawDirs = await wj.get('dirs');
    let dirs = [];
    if(rawDirs){
      try{ dirs = JSON.parse(rawDirs); }catch(e){ dirs = []; }
    }
    if(!dirs.includes(dir)){ dirs.push(dir); await wj.put('dirs', JSON.stringify(dirs)); }

    return new Response(JSON.stringify({ ok:true, name: dir, images: list }), { headers: JSON_HEADERS });
  }catch(err){
    return new Response(JSON.stringify({ error: String(err) }), { status:500, headers: JSON_HEADERS });
  }
}
export async function onRequest(context) {
  const { request, env } = context;
  const kv = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  function jsonHeaders(){ return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' }; }
  if(!kv) return new Response(JSON.stringify({ error: 'KV binding "wj" not found.' }), { status:500, headers: jsonHeaders() });
  try{
    if(request.method !== 'POST') return new Response(JSON.stringify({ error:'Method not allowed' }), { status:405, headers: jsonHeaders() });
    const body = await request.json();
    if(!body.dir || !body.url) {
      // allow creating empty dir by passing url: ''
      if(!body.dir) return new Response(JSON.stringify({ error:'missing dir or url' }), { status:400, headers: jsonHeaders() });
    }
    const name = String(body.dir).trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200);
    const raw = await kv.get('dir:'+name);
    let imgs = [];
    if(raw){
      try{ imgs = JSON.parse(raw); }catch(e){ imgs = []; }
    }
    if(body.url){
      imgs.push(body.url);
      await kv.put('dir:'+name, JSON.stringify(imgs));
    } else {
      // ensure dir exists
      await kv.put('dir:'+name, JSON.stringify(imgs));
    }
    // ensure dirs list contains this dir
    const dirsRaw = await kv.get('dirs');
    let dirs = [];
    if(dirsRaw){
      try{ dirs = JSON.parse(dirsRaw); }catch(e){ dirs = []; }
    }
    if(!dirs.includes(name)){
      dirs.push(name);
      await kv.put('dirs', JSON.stringify(dirs));
    }
    return new Response(JSON.stringify({ ok:true, name, images: imgs }), { status:200, headers: jsonHeaders() });
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status:500, headers: jsonHeaders() });
  }
}
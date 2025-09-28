export async function onRequest(context) {
  const { request, env } = context;
  const wj = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  if(!wj) return new Response(JSON.stringify({ ok:false, error:'KV binding "wj" not found.' }), { status:500, headers: JSON_HEADERS });
  try{
    const url = new URL(request.url);
    const dir = url.searchParams.get('dir');
    if(dir){
      const key = 'dir:' + String(dir).trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200);
      const raw = await wj.get(key);
      let list = []; let parseError = null;
      if(raw){ try{ list = JSON.parse(raw); }catch(e){ parseError = String(e); list = []; } }
      return new Response(JSON.stringify({ ok:true, name: dir, images:list, raw: raw || null, parseError }), { headers: JSON_HEADERS });
    } else {
      const rawDirs = await wj.get('dirs');
      let dirs = []; let parseError = null;
      if(rawDirs){ try{ dirs = JSON.parse(rawDirs); }catch(e){ parseError = String(e); dirs = []; } }
      return new Response(JSON.stringify({ ok:true, dirs, rawDirs: rawDirs || null, parseError }), { headers: JSON_HEADERS });
    }
  }catch(err){
    return new Response(JSON.stringify({ ok:false, error: String(err) }), { status:500, headers: JSON_HEADERS });
  }
}
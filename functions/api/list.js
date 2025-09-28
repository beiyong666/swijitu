const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
function getKV(env){ return (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null); }
function sanitize(n){ return String(n||'').trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200); }

export async function onRequest(context){
  const { request, env } = context;
  const wj = getKV(env);
  if(!wj) return new Response(JSON.stringify({ ok:false, error:'KV binding wj not found' }), { status:500, headers: JSON_HEADERS });
  try{
    const u = new URL(request.url);
    const dir = u.searchParams.get('dir');
    if(dir){
      const key = 'dir:' + sanitize(dir);
      const raw = await wj.get(key);
      let images = [];
      if(raw){ try{ images = JSON.parse(raw); }catch(e){ images = []; } }
      return new Response(JSON.stringify({ ok:true, name: dir, images }), { headers: JSON_HEADERS });
    } else {
      const rawDirs = await wj.get('dirs');
      let dirs = [];
      if(rawDirs){ try{ dirs = JSON.parse(rawDirs); }catch(e){ dirs = []; } }
      return new Response(JSON.stringify({ ok:true, dirs }), { headers: JSON_HEADERS });
    }
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status:500, headers: JSON_HEADERS });
  }
}

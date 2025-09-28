export async function onRequest(context) {
  const { request, env } = context;
  const kv = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  function jsonHeaders(){ return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' }; }
  if(!kv) return new Response(JSON.stringify({ error: 'KV binding "wj" not found.' }), { status:500, headers: jsonHeaders() });
  try{
    const url = new URL(request.url);
    const dir = url.searchParams.get('dir');
    if(dir){
      const name = String(dir).trim().replace(/[^a-zA-Z0-9_\-]/g,'_').slice(0,200);
      const raw = await kv.get('dir:'+name);
      let imgs = [];
      if(raw){
        try{ imgs = JSON.parse(raw); }catch(e){ imgs = []; }
      }
      return new Response(JSON.stringify({ ok:true, name, images: imgs }), { status:200, headers: jsonHeaders() });
    } else {
      const raw = await kv.get('dirs');
      let dirs = [];
      if(raw){
        try{ dirs = JSON.parse(raw); }catch(e){ dirs = []; }
      }
      return new Response(JSON.stringify({ ok:true, dirs }), { status:200, headers: jsonHeaders() });
    }
  }catch(e){
    return new Response(JSON.stringify({ error: String(e) }), { status:500, headers: jsonHeaders() });
  }
}
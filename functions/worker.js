export async function onRequestGet({ request, env, params }) {
  const wj = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  const url = new URL(request.url);
  const pathname = url.pathname || '/';
  if(pathname === '/' || pathname === '/index.html' || pathname === '/admin.html') {
    return fetch(request);
  }
  const maybe = pathname.replace(/^\//,'').replace(/\/$/,'');
  if(maybe){
    if(!wj) return new Response(JSON.stringify({ error:'KV binding wj not found' }), { status:500, headers: JSON_HEADERS });
    const key = 'dir:' + maybe;
    const raw = await wj.get(key);
    if(!raw) return new Response('目录不存在或没有图片', { status:404 });
    let list = [];
    try{ list = JSON.parse(raw); }catch(e){ list = []; }
    if(!list || list.length === 0) return new Response('目录不存在或没有图片', { status:404 });
    const idx = Math.floor(Math.random() * list.length);
    return Response.redirect(list[idx], 302);
  }
  return fetch(request);
}
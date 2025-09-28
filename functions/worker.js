export async function onRequest(context) {
  const { request, env } = context;
  const kv = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  const url = new URL(request.url);
  const pathname = url.pathname || '/';
  if(pathname.startsWith('/api/')) return new Response(null, { status: 404 });
  if(pathname === '/' || pathname === '/index.html' || pathname === '/admin.html') return fetch(request);
  const maybeDir = pathname.replace(/^\//,'').replace(/\/$/,'');
  if(maybeDir){
    if(!kv) return new Response('not found', { status:404 });
    const raw = await kv.get('dir:'+maybeDir);
    if(!raw) return new Response('not found', { status:404 });
    let imgs = [];
    try{ imgs = JSON.parse(raw); }catch(e){ imgs = []; }
    if(!imgs || imgs.length===0) return new Response('not found', { status:404 });
    const idx = Math.floor(Math.random()*imgs.length);
    return Response.redirect(imgs[idx], 302);
  }
  return fetch(request);
}
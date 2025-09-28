
/**
 * worker.js - EdgeOne Pages / Cloudflare Pages Functions style single file.
 *
 * Bind a KV namespace to the Pages function with the variable name "WJ" (or "wj").
 * Set the ADMIN_PASSWORD environment variable to protect the admin UI.
 *
 * KV schema:
 * - key "dirs" -> JSON array of directory names
 * - key "dir:<name>" -> JSON array of image URL strings
 *
 * Endpoints:
 * - GET  /api/dirs                  -> list directories
 * - POST /api/dirs                  -> create directory { name }
 * - DELETE /api/dirs/:name          -> delete directory
 * - GET  /api/dirs/:name            -> list images in directory
 * - POST /api/dirs/:name/images     -> add image { url }
 * - DELETE /api/dirs/:name/images   -> remove image { url }
 * - POST /api/login                 -> { password } => sets cookie if ok
 * - GET  /admin, /admin/*           -> serve admin static page (handled by Pages static files)
 * - GET  /{dir}                     -> redirect to a random image in that dir (302)
 */

const TEXT_JSON = { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

function jsonResponse(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: TEXT_JSON });
}

function htmlResponse(text, status=200) {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=UTF-8' }});
}

function badRequest(msg) { return jsonResponse({ ok: false, error: msg }, 400); }
function unauthorized(msg='unauthorized') { return jsonResponse({ ok: false, error: msg }, 401); }

function getKV(env){
  return env.WJ || env.wj || env.WJ_KV || env.wj_kv || env.KV || null;
}

async function getDirs(kv){
  const raw = await kv.get('dirs');
  if(!raw) return [];
  try{
    return JSON.parse(raw);
  }catch(e){
    return [];
  }
}

async function setDirs(kv, arr){
  await kv.put('dirs', JSON.stringify(arr || []));
}

function sanitizeName(name){
  return String(name || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 200);
}

async function getDirImages(kv, name){
  const raw = await kv.get('dir:'+name);
  if(!raw) return [];
  try{
    return JSON.parse(raw);
  }catch(e){
    return [];
  }
}

async function setDirImages(kv, name, arr){
  await kv.put('dir:'+name, JSON.stringify(arr || []));
}

function parseCookies(req){
  const cookie = req.headers.get('cookie') || '';
  const parts = {};
  cookie.split(';').map(s=>s.trim()).filter(Boolean).forEach(p=>{
    const [k,v] = p.split('=');
    parts[k]=v;
  });
  return parts;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const kv = getKV(env);
  if(!kv){
    return new Response('KV namespace not bound. Bind your KV to variable name WJ (or wj).', { status: 500 });
  }

  const pathname = url.pathname || '/';

  // API routing
  if(pathname.startsWith('/api/')){
    if(request.method === 'OPTIONS'){
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' }});
    }

    const parts = pathname.replace(/^\/api\//,'').split('/').filter(Boolean);
    // /api/dirs
    if(parts.length === 1 && parts[0] === 'dirs'){
      if(request.method === 'GET'){
        const dirs = await getDirs(kv);
        return jsonResponse({ ok:true, dirs });
      }
      if(request.method === 'POST'){
        // create dir
        try{
          const body = await request.json();
          if(!body.name) return badRequest('missing name');
          const name = sanitizeName(body.name);
          if(!name) return badRequest('invalid name after sanitize');
          const dirs = await getDirs(kv);
          if(dirs.includes(name)) return badRequest('dir exists');
          dirs.push(name);
          await setDirs(kv, dirs);
          await setDirImages(kv,name,[]);
          return jsonResponse({ ok:true, name });
        }catch(e){
          return badRequest('invalid json body');
        }
      }
      if(request.method === 'DELETE'){
        return badRequest('use /api/dirs/:name to delete');
      }
    }

    // /api/dirs/:name or /api/dirs/:name/images
    if(parts[0] === 'dirs' && parts[1]){
      const name = sanitizeName(parts[1]);
      if(parts.length === 2){
        // operations on dir
        if(request.method === 'GET'){
          const imgs = await getDirImages(kv,name);
          return jsonResponse({ ok:true, name, images: imgs });
        }
        if(request.method === 'DELETE'){
          // require admin
          const cookie = parseCookies(request);
          if(!cookie.adm || cookie.adm !== '1') return unauthorized();
          const dirs = await getDirs(kv);
          const idx = dirs.indexOf(name);
          if(idx !== -1) dirs.splice(idx,1);
          await setDirs(kv, dirs);
          await kv.delete('dir:'+name);
          return jsonResponse({ ok:true, deleted: name });
        }
      }
      if(parts.length === 3 && parts[2] === 'images'){
        if(request.method === 'POST'){
          // require admin
          const cookie = parseCookies(request);
          if(!cookie.adm || cookie.adm !== '1') return unauthorized();
          try{
            const body = await request.json();
            if(!body.url) return badRequest('missing url');
            const imgs = await getDirImages(kv,name);
            imgs.push(body.url);
            await setDirImages(kv, name, imgs);
            return jsonResponse({ ok:true, name, added: body.url, images: imgs });
          }catch(e){
            return badRequest('invalid json body');
          }
        }
        if(request.method === 'DELETE'){
          // require admin
          const cookie = parseCookies(request);
          if(!cookie.adm || cookie.adm !== '1') return unauthorized();
          try{
            const body = await request.json();
            if(!body.url) return badRequest('missing url');
            let imgs = await getDirImages(kv,name);
            imgs = imgs.filter(u=>u !== body.url);
            await setDirImages(kv,name,imgs);
            return jsonResponse({ ok:true, name, removed: body.url, images: imgs});
          }catch(e){
            return badRequest('invalid json body');
          }
        }
      }
    }

    // login
    if(parts.length === 1 && parts[0] === 'login' && request.method === 'POST'){
      try{
        const body = await request.json();
        if(!body.password) return badRequest('missing password');
        const adminPwd = env.ADMIN_PASSWORD || env.ADMIN_PASS || '';
        if(!adminPwd){
          return new Response('Admin password not configured. Set ADMIN_PASSWORD in your environment.', { status: 500 });
        }
        if(body.password === adminPwd){
          // set cookie
          const headers = { 'Set-Cookie': 'adm=1; Path=/; HttpOnly', ...TEXT_JSON };
          return new Response(JSON.stringify({ ok:true }), { status:200, headers });
        }else{
          return unauthorized('bad password');
        }
      }catch(e){
        return badRequest('invalid json body');
      }
    }

    return new Response('API not found', { status: 404 });
  }

  // If path is /
  if(pathname === '/' || pathname === '/index.html'){
    // let Pages static files handle it (this function could return static content)
    // But we will serve a tiny index explaining usage
    const html = `
<html>
<head><meta charset="utf-8"><title>Random Image Pages</title></head>
<body>
  <h2>Random Image Pages</h2>
  <p>Use <code>/admin</code> to manage directories and image URLs (requires ADMIN_PASSWORD).</p>
  <p>Visit <code>/{directory}</code> to get redirected to a random image in that directory.</p>
</body>
</html>
`;
    return htmlResponse(html);
  }

  // If request is for a directory root like /abc
  const maybeDir = pathname.replace(/^\//,'').replace(/\/$/,'');
  if(maybeDir){
    const name = sanitizeName(maybeDir);
    const imgs = await getDirImages(kv, name);
    if(!imgs || imgs.length === 0){
      return new Response('directory not found or empty', { status: 404 });
    }
    // choose random
    const idx = Math.floor(Math.random() * imgs.length);
    const urlTo = imgs[idx];
    // redirect
    return Response.redirect(urlTo, 302);
  }

  return new Response('not found', { status: 404 });
}

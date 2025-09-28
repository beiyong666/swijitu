export async function onRequest(context) {
  const { request, env } = context;
  return new Response(JSON.stringify({ ok:true, pong: true, envHasWj: !!(env && env.wj) }), { status:200, headers: { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' } });
}
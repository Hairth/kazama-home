export async function onRequestGet(context) {
    const { params, env } = context;

    if (!env.R2_BUCKET) {
        return new Response('R2 未配置', { status: 500 });
    }

    const key = Array.isArray(params.path)
        ? params.path.join('/')
        : params.path;

    if (!key) {
        return new Response('Not Found', { status: 404 });
    }

    const object = await env.R2_BUCKET.get(key);
    if (!object) {
        return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
}

const SETTINGS_KEY = 'settings/config.json';

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet(context) {
    const { env } = context;
    if (!env.R2_BUCKET) return json({ error: 'R2 未配置' }, 500);

    try {
        const obj = await env.R2_BUCKET.get(SETTINGS_KEY);
        if (!obj) return json(null);
        const text = await obj.text();
        return new Response(text, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return json({ error: e.message }, 500);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    if (!env.R2_BUCKET) return json({ error: 'R2 未配置' }, 500);

    let body;
    try {
        body = await request.text();
        JSON.parse(body); // 校验 JSON 格式
    } catch (e) {
        return json({ error: '无效的 JSON' }, 400);
    }

    try {
        await env.R2_BUCKET.put(SETTINGS_KEY, body, {
            httpMetadata: { contentType: 'application/json' }
        });
        return json({ ok: true });
    } catch (e) {
        return json({ error: e.message }, 500);
    }
}

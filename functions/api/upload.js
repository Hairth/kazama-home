function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// 从 /images/bg/xxx.jpg 提取 key，并校验格式防止误删
function extractKey(url) {
    if (!url || !url.startsWith('/images/bg/')) return null;
    return url.replace('/images/', '');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.R2_BUCKET) {
        return json({ error: 'R2 未配置，请在 Cloudflare Pages 绑定 R2_BUCKET' }, 500);
    }

    let formData;
    try {
        formData = await request.formData();
    } catch (e) {
        return json({ error: '请求解析失败' }, 400);
    }

    const file = formData.get('file');
    if (!file) {
        return json({ error: '未找到文件' }, 400);
    }

    // 删除旧图片（忽略失败，不影响上传）
    const oldKey = extractKey(formData.get('oldUrl'));
    if (oldKey) {
        try {
            await env.R2_BUCKET.delete(oldKey);
        } catch (e) {}
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const key = `bg/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
        await env.R2_BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type || 'image/jpeg' }
        });
    } catch (e) {
        return json({ error: 'R2 上传失败: ' + e.message }, 500);
    }

    return json({ url: `/images/${key}` });
}

// 移除背景时调用：DELETE /api/upload，body: { url: '/images/bg/xxx.jpg' }
export async function onRequestDelete(context) {
    const { request, env } = context;

    if (!env.R2_BUCKET) {
        return json({ error: 'R2 未配置' }, 500);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return json({ error: '请求解析失败' }, 400);
    }

    const key = extractKey(body.url);
    if (!key) {
        return json({ error: '无效的文件路径' }, 400);
    }

    try {
        await env.R2_BUCKET.delete(key);
    } catch (e) {
        return json({ error: '删除失败: ' + e.message }, 500);
    }

    return json({ ok: true });
}

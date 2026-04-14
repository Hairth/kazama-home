function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    let token;
    try {
        const body = await request.json();
        token = body.token;
    } catch (e) {
        return json({ success: false, error: 'invalid_request' }, 400);
    }

    if (!token) {
        return json({ success: false, error: 'missing_token' }, 400);
    }

    const secret = env.TURNSTILE_SECRET || '0x4AAAAAAC80OmLGSZzzGYC45kBYBAawnmk';

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);

    try {
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return json({ success: !!data.success });
    } catch (e) {
        return json({ success: false, error: 'verify_failed' }, 500);
    }
}

function json(data) {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet(context) {
    const password = context.env.ACCESS_PASSWORD;

    if (!password) {
        return json({ hash: null });
    }

    const buf = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    const hash = Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return json({ hash });
}

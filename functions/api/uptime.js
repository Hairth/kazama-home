let startTime = null;

export async function onRequest() {
    if (!startTime) startTime = Date.now();
    return new Response(JSON.stringify({ startTime }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

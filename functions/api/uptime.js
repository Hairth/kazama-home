const START_TIME = Date.now();

export async function onRequest() {
    return new Response(JSON.stringify({ startTime: START_TIME }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

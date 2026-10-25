const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4000';
const response = await fetch(`${baseUrl}/api/health`);
if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
console.log('Smoke check passed.');


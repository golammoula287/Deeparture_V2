export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const v2BaseUrl = `${baseUrl}/v2`;
export const internalBaseUrl = process.env.API_INTERNAL_URL || baseUrl;

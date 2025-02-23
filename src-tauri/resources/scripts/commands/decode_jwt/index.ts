import { transformActiveTexts } from "lib:@snip/helpers";

function decodeBase64Url(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decodeURIComponent(decoded.split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
}

function decodeJwt(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT token');
    }
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return { header, payload };
}

export default async function decode_jwt() {
    await transformActiveTexts((text: string) => {
        try {
            const decoded = decodeJwt(text);
            return JSON.stringify(decoded, null, 2);
        } catch (e) {
            throw new Error('Invalid JWT token');
        }
    });
}
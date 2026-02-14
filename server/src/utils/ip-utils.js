import net from 'net';

export function isIpInCidr(ip, cidr) {
    // Basic CIDR match implementation or use 'ip-range-check' package if we had it.
    // For now, simple implementation or stub for the demo if dependencies are minimal.
    // Let's implement a basic IPv4 check.

    if (cidr.includes('/')) {
        const [range, bits] = cidr.split('/');
        const mask = ~(2 ** (32 - bits) - 1);
        return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
    }
    return ip === cidr;
}

export function ipToLong(ip) {
    let parts = ip.split('.');
    if (parts.length !== 4) return 0; // Handle IPv6 separately or fail
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Re-export if needed
export const isIpBlocked = (ip, cidr) => !isIpInCidr(ip, cidr);

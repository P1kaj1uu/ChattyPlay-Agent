import crypto from "crypto";

export function generateMid(): string {
  const randomPart = Math.floor(Math.random() * 1000);
  const timestamp = Date.now();
  return `${randomPart}${timestamp} 0`;
}

export function generateUuid(): string {
  const chars = "0123456789abcdef";
  const sections = [8, 4, 4, 4, 12];
  return sections
    .map((len) =>
      Array.from(
        { length: len },
        () => chars[Math.floor(Math.random() * 16)],
      ).join(""),
    )
    .join("-");
}

export function generateDeviceId(userId: string): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const result: string[] = [];
  for (let i = 0; i < 36; i++) {
    if ([8, 13, 18, 23].includes(i)) {
      result.push("-");
    } else if (i === 14) {
      result.push("4");
    } else if (i === 19) {
      const randVal = Math.floor(Math.random() * 16);
      result.push(chars[(randVal & 0x3) | 0x8]);
    } else {
      result.push(chars[Math.floor(Math.random() * 16)]);
    }
  }
  return result.join("") + "-" + userId;
}

export function generateSign(t: string, token: string, data: string): string {
  const appKey = "34839810";
  const msg = `${token}&${t}&${appKey}&${data}`;
  return crypto.createHash("md5").update(msg).digest("hex");
}

// MessagePack 解码器
class MessagePackDecoder {
  private data: Buffer;
  private pos = 0;

  constructor(data: Buffer) {
    this.data = data;
  }

  private readByte(): number {
    return this.data[this.pos++];
  }

  private readBytes(count: number): Buffer {
    const result = this.data.subarray(this.pos, this.pos + count);
    this.pos += count;
    return result;
  }

  private readUint32(): number {
    const val = this.data.readUInt32BE(this.pos);
    this.pos += 4;
    return val;
  }

  private readString(length: number): string {
    return this.readBytes(length).toString("utf-8");
  }

  decodeValue(): any {
    const fmt = this.readByte();

    if (fmt <= 0x7f) return fmt;
    if (fmt >= 0x80 && fmt <= 0x8f) return this.decodeMap(fmt & 0x0f);
    if (fmt >= 0x90 && fmt <= 0x9f) return this.decodeArray(fmt & 0x0f);
    if (fmt >= 0xa0 && fmt <= 0xbf) return this.readString(fmt & 0x1f);
    if (fmt === 0xc0) return null;
    if (fmt === 0xc2) return false;
    if (fmt === 0xc3) return true;
    if (fmt === 0xc4) return this.readBytes(this.readByte());
    if (fmt === 0xc5) {
      const len = this.data.readUInt16BE(this.pos);
      this.pos += 2;
      return this.readBytes(len);
    }
    if (fmt === 0xc6) return this.readBytes(this.readUint32());
    if (fmt === 0xcc) return this.readByte();
    if (fmt === 0xcd) {
      const val = this.data.readUInt16BE(this.pos);
      this.pos += 2;
      return val;
    }
    if (fmt === 0xce) return this.readUint32();
    if (fmt === 0xcf) {
      const val = this.data.readBigUInt64BE(this.pos);
      this.pos += 8;
      return Number(val);
    }
    if (fmt === 0xd9) return this.readString(this.readByte());
    if (fmt === 0xda) {
      const len = this.data.readUInt16BE(this.pos);
      this.pos += 2;
      return this.readString(len);
    }
    if (fmt === 0xdb) return this.readString(this.readUint32());
    if (fmt === 0xdc) {
      const len = this.data.readUInt16BE(this.pos);
      this.pos += 2;
      return this.decodeArray(len);
    }
    if (fmt === 0xdd) return this.decodeArray(this.readUint32());
    if (fmt === 0xde) {
      const len = this.data.readUInt16BE(this.pos);
      this.pos += 2;
      return this.decodeMap(len);
    }
    if (fmt === 0xdf) return this.decodeMap(this.readUint32());
    if (fmt >= 0xe0) return fmt - 0x100;

    throw new Error(`Unknown format: ${fmt.toString(16)}`);
  }

  private decodeArray(size: number): any[] {
    return Array.from({ length: size }, () => this.decodeValue());
  }

  private decodeMap(size: number): Record<string, any> {
    const result: Record<string, any> = {};
    for (let i = 0; i < size; i++) {
      const key = this.decodeValue();
      result[String(key)] = this.decodeValue();
    }
    return result;
  }

  decode(): any {
    return this.decodeValue();
  }
}

export function decryptMessagePack(data: string): any {
  let padded = data;
  const missing = data.length % 4;
  if (missing) padded += "=".repeat(4 - missing);

  const decoded = Buffer.from(padded, "base64");
  const decoder = new MessagePackDecoder(decoded);
  return decoder.decode();
}

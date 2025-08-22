import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

export function encryptFile(
  fileBuffer: Buffer,
  key: string
): {
  encryptedData: Buffer;
  iv: string;
  tag: string;
} {
  const keyBuffer = Buffer.from(key, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const encryptedChunks: Buffer[] = [];
  encryptedChunks.push(cipher.update(fileBuffer));
  encryptedChunks.push(cipher.final());

  const tag = cipher.getAuthTag();
  const encryptedData = Buffer.concat(encryptedChunks);

  return {
    encryptedData,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptFile(
  encryptedData: Buffer,
  key: string,
  iv: string,
  tag: string
): Buffer {
  const keyBuffer = Buffer.from(key, "hex");
  const ivBuffer = Buffer.from(iv, "hex");
  const tagBuffer = Buffer.from(tag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  const decryptedChunks: Buffer[] = [];
  decryptedChunks.push(decipher.update(encryptedData));
  decryptedChunks.push(decipher.final());

  return Buffer.concat(decryptedChunks);
}

export function hashDocument(fileBuffer: Buffer): string {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

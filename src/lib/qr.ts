import QRCode from "qrcode";
import JSZip from "jszip";

/** Generate a single QR code as a data URL */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/** Generate a single QR code as a PNG buffer */
export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

interface QrItem {
  filename: string;
  url: string;
}

/** Generate a ZIP file with multiple QR codes */
export async function generateQrZip(items: QrItem[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const item of items) {
    const buffer = await generateQrBuffer(item.url);
    zip.file(item.filename, buffer);
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });
  return content;
}

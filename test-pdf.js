const { PDFParse } = require('pdf-parse');

async function run() {
  try {
    const parser = new PDFParse({ verbosity: 0 });
    const buf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length 2 0 R >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Hello World) Tj\nET\nendstream\nendobj\n2 0 obj\n49\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000109 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n129\n%%EOF');
    const u8 = new Uint8Array(buf);
    try {
      await parser.load(u8);
      console.log("TEXT1:", await parser.getText());
    } catch(e) {
      console.log("Failed 1");
    }
  } catch (err) {
    console.error(err);
  }
}
run();

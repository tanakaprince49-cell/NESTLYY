import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndSharePdf(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
    UTI: 'com.adobe.pdf',
  });
}

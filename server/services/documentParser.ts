export async function parseDocument(buffer: Buffer, mimetype: string): Promise<string> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock extraction logic based on file type
  if (mimetype.includes('pdf')) {
    return 'Extracted PDF Context: This document contains process diagrams showing 4 manual touchpoints. It outlines a high exception rate of 15% due to unstructured invoices.';
  } else if (mimetype.includes('word') || mimetype.includes('docx')) {
    return 'Extracted DOCX Context: The standard operating procedure details logging into SAP, downloading reports, and running macros in Excel. Estimated time is 20 minutes per run.';
  } else if (mimetype.includes('video') || mimetype.includes('mp4')) {
    return 'Extracted Video Transcript: "Hi, I am sharing my screen to show how we process these claims... first we open the portal... then copy this ID... then paste it here."';
  } else {
    return 'Extracted Generic Context: Some text found indicating manual steps and validation requirements.';
  }
}

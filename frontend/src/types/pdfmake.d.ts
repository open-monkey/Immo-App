declare module 'pdfmake/build/pdfmake' {
  export interface TDocumentDefinitions {
    pageSize?: string;
    pageMargins?: [number, number, number, number];
    defaultStyle?: Record<string, unknown>;
    styles?: Record<string, Record<string, unknown>>;
    content: unknown[];
  }

  interface TCreatedPdf {
    download(filename?: string): void;
  }

  interface PdfMakeStatic {
    vfs: Record<string, string>;
    createPdf(documentDefinition: TDocumentDefinitions): TCreatedPdf;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}
declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: { vfs: Record<string, string> };
  export default pdfFonts;
}

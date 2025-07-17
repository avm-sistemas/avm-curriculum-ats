// src/typings/mammoth.d.ts
declare module 'mammoth' {
  interface Options {
    // Defina as opções que você usa com mammoth.extractRawText ou mammoth.convertToHtml
    buffer?: Buffer;
    path?: string;
    // Adicione outras opções conforme necessário
  }

  interface Result {
    value: string; // O texto ou HTML extraído
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  function extractRawText(options: Options): Promise<Result>;
  function convertToHtml(options: Options): Promise<Result>;

  // Se você usar outras funções de mammoth, adicione-as aqui
}
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']);

const CODE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'py',
  'json',
  'md',
  'txt',
  'csv',
  'yaml',
  'yml',
  'css',
  'sh',
  'bash',
  'toml',
  'xml',
  'sql',
  'rs',
  'go',
  'java',
  'rb',
  'php',
  'c',
  'cpp',
  'h',
  'hpp'
]);

export type PreviewType = 'image' | 'pdf' | 'pptx' | 'html' | 'code' | 'unsupported';

export function getExtension(filePath: string): string {
  return (filePath.split('.').pop() ?? '').toLowerCase();
}

export function getPreviewType(filePath: string): PreviewType {
  const ext = getExtension(filePath);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'pptx' || ext === 'pptm') return 'pptx';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  return 'unsupported';
}

export function isPreviewable(filePath: string): boolean {
  return getPreviewType(filePath) !== 'unsupported';
}

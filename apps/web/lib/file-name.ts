export function truncateFileNameMiddle(fileName: string, maxLength = 40): string {
  if (fileName.length <= maxLength) return fileName;

  const extensionIndex = fileName.lastIndexOf(".");
  const hasExtension = extensionIndex > 0 && extensionIndex < fileName.length - 1;
  const extension = hasExtension ? fileName.slice(extensionIndex) : "";
  const baseName = hasExtension ? fileName.slice(0, extensionIndex) : fileName;

  const reserved = extension.length + 3;
  const visibleBaseLength = Math.max(8, maxLength - reserved);
  const startLength = Math.ceil(visibleBaseLength * 0.7);
  const endLength = Math.max(2, visibleBaseLength - startLength);

  return `${baseName.slice(0, startLength)}...${baseName.slice(-endLength)}${extension}`;
}

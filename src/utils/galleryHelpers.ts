export const parseKeyTimestamp = (key: string): number => {
  const match = key.match(/^(\d{13})_/);
  return match ? parseInt(match[1], 10) : 0;
};

export const isVideoFile = (keyOrUrl: string): boolean => {
  const lowerKey = keyOrUrl.toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ogv|qt)(\?.*)?$/i.test(lowerKey) || lowerKey.includes('video');
};
const STORAGE_KEY = 'otg_post_images_by_id';

type PostImageMap = Record<string, string>;

const canUseStorage = () => typeof window !== 'undefined';

const readMap = (): PostImageMap => {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PostImageMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (value: PostImageMap) => {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const getPostImage = (postId: string | number): string | undefined => {
  const map = readMap();
  return map[String(postId)];
};

export const savePostImage = (postId: string | number, imageDataUrl: string) => {
  const map = readMap();
  map[String(postId)] = imageDataUrl;
  writeMap(map);
};

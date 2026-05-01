// Module-level store so the item loading skeleton can show the image immediately.
let imageUrl: string | null = null;

export const pendingNav = {
  setImage: (url: string | null) => { imageUrl = url; },
  getImage: () => imageUrl,
};

// TRONG FILE: src/utils/imageMapper.js

export const getStaticFrameImage = (frameName, sizeString) => {
  if (frameName === 'Khung Gỗ Đỏ') {
    if (sizeString?.includes('9 ảnh')) return '/images/go-do.png'
    if (sizeString?.includes('16 ảnh')) return '/images/go-do-16.png'
    return '/images/khung-go-do-default.png'
  }

  const staticMap = {
    'Khung Moebe Gỗ Sồi': '/images/moebe-go-soi.png',
  }

  return staticMap[frameName] || null
}

/** Ảnh minh hoạ khung áo đấu — thay bằng ảnh thật trong public/images sau. */
export function getJerseyImage(tier = 'basic') {
  if (tier === 'premium') return '/images/ao-dau-cao-cap.png'
  if (tier === '2_faces_premium') return '/images/ao_2_mat.png'
  return '/images/ao-dau-co-ban.png'
}

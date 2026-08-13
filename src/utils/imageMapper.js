// TRONG FILE: src/utils/imageMapper.js

export const getStaticFrameImage = (frameName, sizeString) => {
  // 1. Trường hợp đặc biệt: Khung Gỗ Đỏ
  if (frameName === 'Khung Gỗ Đỏ') {
    if (sizeString?.includes('9 ảnh')) return '/images/go-do.png';
    if (sizeString?.includes('16 ảnh')) return '/images/go-do-16.png';
    return '/images/khung-go-do-default.png'; 
  }

  // 2. Các khung bình thường khác
  const staticMap = {
    'Khung Moebe Gỗ Sồi': '/images/moebe-go-soi.png',
    // Khai báo thêm tại đây sau này thoải mái mà không sợ rác file App.jsx
  };

  return staticMap[frameName] || null;
};
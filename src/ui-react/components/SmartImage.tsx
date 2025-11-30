import React, { useState } from 'react';
import { getAssets } from '../../core/config/assets';

interface SmartImageProps {
  width: number;
  height: number;
  alt: string;
  imageKey: string;
}

// 智能图片组件，支持从配置中读取图片路径，加载失败时显示占位图
const SmartImage: React.FC<SmartImageProps> = ({ width, height, alt, imageKey }) => {
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 获取图片路径，如果配置中没有则使用默认占位图
  const getImageUrl = () => {
    const assets = getAssets();
    
    // 根据imageKey映射到assets配置中的具体路径
    switch (imageKey) {
      // 背景图片
      case 'background-cloud-courtyard':
        return assets.backgrounds.home;
      case 'background-decoration-flowers-clouds':
        return assets.decorations.flowersClouds;
      case 'background-decoration-flower':
        return assets.decorations.flower;
      
      // 角色相关
      case 'character-portrait':
        return assets.characters.portrait;
      case 'character-avatar':
        return assets.characters.avatar;
      
      // 资源图标
      case 'resource-low-grade':
        return assets.resources.lowGrade;
      case 'resource-middle-grade':
        return assets.resources.middleGrade;
      case 'resource-high-grade':
        return assets.resources.highGrade;
      
      // 功能按钮图标
      case 'button-settings':
        return assets.buttons.settings;
      case 'button-wudao':
        return assets.buttons.wudao;
      case 'button-xianshen':
        return assets.buttons.xianshen;
      case 'button-storage':
        return assets.buttons.storage;
      case 'button-tianji':
        return assets.buttons.tianji;
      case 'button-trial':
        return assets.buttons.trial;
      case 'button-encyclopedia':
        return assets.buttons.encyclopedia;
      case 'button-market':
        return assets.buttons.market;
      case 'button-achievements':
        return assets.buttons.achievements;
      
      // 装饰元素
      case 'decoration-bow':
        return assets.decorations.bow;
      case 'decoration-flame':
        return assets.decorations.flame;
      
      // 页面标题
      case 'title-courtyard':
        return assets.titles.courtyard;
      
      // 默认返回空字符串，显示占位图
      default:
        return '';
    }
  };

  const imageUrl = getImageUrl();

  // 处理图片加载错误
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // 处理图片加载成功
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width, height }}
    >
      {/* 如果图片加载成功，显示实际图片 */}
      {imageUrl && imageLoaded && !imageError && (
        <img
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className="object-contain"
        />
      )}
      
      {/* 如果图片加载失败或没有配置图片，显示占位图 */}
      {(imageError || !imageUrl) && (
        <div
          className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-300"
        >
          {alt}
        </div>
      )}
    </div>
  );
};

export default SmartImage;
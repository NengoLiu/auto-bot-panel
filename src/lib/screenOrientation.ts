// 屏幕方向控制工具
// 在Capacitor环境下使用原生API，在浏览器中使用Web API

export const lockToPortrait = async () => {
  try {
    // 尝试使用Capacitor插件
    const { ScreenOrientation } = await import('@capacitor/screen-orientation');
    await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch {
    // 回退到Web API
    try {
      await (screen.orientation as any)?.lock?.('portrait');
    } catch {
      console.log('Portrait lock not supported');
    }
  }
};

export const lockToLandscape = async () => {
  try {
    // 尝试使用Capacitor插件
    const { ScreenOrientation } = await import('@capacitor/screen-orientation');
    await ScreenOrientation.lock({ orientation: 'landscape' });
  } catch {
    // 回退到Web API
    try {
      await (screen.orientation as any)?.lock?.('landscape');
    } catch {
      console.log('Landscape lock not supported');
    }
  }
};

export const unlockOrientation = async () => {
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation');
    await ScreenOrientation.unlock();
  } catch {
    try {
      (screen.orientation as any)?.unlock?.();
    } catch {
      console.log('Orientation unlock not supported');
    }
  }
};

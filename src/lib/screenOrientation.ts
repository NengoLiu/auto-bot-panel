// 屏幕方向控制工具 + 状态栏沉浸式配置
// 在Capacitor环境下使用原生API，在浏览器中使用Web API

import { StatusBar, Style } from '@capacitor/status-bar';

// 设置沉浸式状态栏（透明背景，内容延伸到状态栏下方）
export const setImmersiveStatusBar = async () => {
  try {
    // 设置状态栏透明
    await StatusBar.setBackgroundColor({ color: '#00000000' });
    // 设置状态栏样式为浅色图标（适配深色背景）
    await StatusBar.setStyle({ style: Style.Dark });
    // 让内容延伸到状态栏下方
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    console.log('StatusBar plugin not available (web environment)');
  }
};

// 隐藏状态栏（全屏模式）
export const hideStatusBar = async () => {
  try {
    await StatusBar.hide();
  } catch {
    console.log('StatusBar hide not available');
  }
};

// 显示状态栏
export const showStatusBar = async () => {
  try {
    await StatusBar.show();
  } catch {
    console.log('StatusBar show not available');
  }
};

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

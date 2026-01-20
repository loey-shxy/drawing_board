<script setup lang="ts">
import { nextTick } from 'vue';
import { nanoid } from 'nanoid';
import { applyPureReactInVue } from 'veaury';
import { debounce } from 'lodash-es';
import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
  AppState,
  BinaryFiles,
} from '@excalidraw/excalidraw/types';
import type {
  ExcalidrawElement,
  ExcalidrawImageElement
} from '@excalidraw/excalidraw/element/types';
import ExcalidrawWrapper from './react_app/ExcalidrawWrapper';

const ExcalidrawComponent = applyPureReactInVue(ExcalidrawWrapper);

let excalidrawAPI: ExcalidrawImperativeAPI | null = null;

const STORAGE_KEYS = {
  ELEMENTS: 'excalidraw',
  STATE: 'excalidraw-state'
};

// ------------------------------------------------------------------
// 图片处理逻辑
// ------------------------------------------------------------------
const fetchImageToDataURL = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`网络请求失败: ${res.statusText}`);
    const blob = await res.blob();

    let mimeType = blob.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = url.split('.').pop()?.split('?')[0].toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else mimeType = 'image/jpeg';
    }

    return new Promise<{ dataURL: string; mimeType: any; width: number; height: number }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        let dataURL = reader.result as string;
        const base64Data = dataURL.split(',')[1];
        dataURL = `data:${mimeType};base64,${base64Data}`;

        const img = new Image();
        img.onload = () => resolve({ dataURL, mimeType, width: img.width, height: img.height });
        img.onerror = () => reject(new Error('图片数据解析失败'));
        img.src = dataURL;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('图片转换流程异常:', err);
    throw err;
  }
};

const addImageToCanvas = async (imageUrl: string) => {
  if (!excalidrawAPI) return;

  try {
    console.log("⬇️ 开始下载图片...");
    const imageData = await fetchImageToDataURL(imageUrl);
    const fileId = nanoid();

    const rawImageFile: BinaryFileData = {
      id: fileId,
      dataURL: imageData.dataURL as any,
      mimeType: imageData.mimeType,
      created: Date.now(),
      lastRetrieved: Date.now(),
    };

    const rawImageElement: any = {
      type: "image",
      id: nanoid(),
      fileId,
      status: "saved",
      x: 100, y: 100,
      width: imageData.width,
      height: imageData.height,
      angle: 0,
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 0,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      scale: [1, 1],
      customData: {
        sourceUrl: imageUrl
      }
    };

    // 数据清洗
    const cleanImageFile = JSON.parse(JSON.stringify(rawImageFile));
    const cleanImageElement = JSON.parse(JSON.stringify(rawImageElement));

    // 分步注入
    if (typeof excalidrawAPI.addFiles === 'function') {
      excalidrawAPI.addFiles([cleanImageFile]);
    } else {
      excalidrawAPI.updateScene({ files: { [cleanImageFile.id]: cleanImageFile } });
    }

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), cleanImageElement],
      commitToHistory: true,
    });

    excalidrawAPI.scrollToContent(cleanImageElement);
    console.log("✅ 图片已添加到画布");

  } catch (error) {
    console.error('❌ 添加图片失败:', error);
  }
};

const handleSimulateApiCall = () => {
  if (!excalidrawAPI) return;

  const mockUrl = 'https://tushen.oss-cn-hangzhou.aliyuncs.com/service/2024-07-26/1721956904461-0.jpg';

  // 检查画布中是否已经存在该图片
  const currentElements = excalidrawAPI.getSceneElements();

  // 查找是否有任意一个元素的 customData.sourceUrl 等于我们要加的 mockUrl
  // 同时排除已删除的元素
  const isAlreadyAdded = currentElements.some((el) =>
    !el.isDeleted &&
    el.customData &&
    el.customData.sourceUrl === mockUrl
  );

  if (isAlreadyAdded) {
    console.log("⏸️ 图片已存在于画布中，跳过添加步骤。");
    return;
  }

  // 如果不存在，才执行添加逻辑
  console.log("🆕 画布中未找到该图片，正在添加...");
  addImageToCanvas(mockUrl);
}

const onReady = async (api: ExcalidrawImperativeAPI) => {
  excalidrawAPI = api;
  await nextTick();

  const savedElements = localStorage.getItem(STORAGE_KEYS.ELEMENTS);
  const data = savedElements ? JSON.parse(savedElements) : []
  if (!data?.length) {
    handleSimulateApiCall();
  }
};

// ------------------------------------------------------------------
// 加载逻辑
// ------------------------------------------------------------------
const loadInitialData = async () => {
  const result = {
    elements: [],
    appState: { viewBackgroundColor: "#ffffff" },
    files: {},
    scrollToContent: false
  };

  try {
    // 1. 读取 Elements
    const savedElements = localStorage.getItem(STORAGE_KEYS.ELEMENTS);
    if (savedElements) {

      const allElements = JSON.parse(savedElements);

      if (Array.isArray(allElements)) {
        result.elements = allElements;

        // 图片处理
        const imageElements = allElements.filter((el: ExcalidrawElement) =>
          !el.isDeleted && el.type === "image" && el.customData?.sourceUrl
        ) as ExcalidrawImageElement[]

        if (imageElements.length) {
          const filesToInject: BinaryFileData[] = [];
          await Promise.all(imageElements.map(async (el) => {
            const url = el.customData?.sourceUrl;
            if (url) {
              const imageData = await fetchImageToDataURL(url);
              if (imageData) {
                filesToInject.push({
                  id: el.fileId,
                  dataURL: imageData.dataURL as any,
                  mimeType: imageData.mimeType,
                  created: Date.now(),
                  lastRetrieved: Date.now()
                });
              }
            }
          }));

          if (filesToInject.length > 0) {
            result.files = filesToInject
          }
        }
      }
    }

    const savedState = localStorage.getItem(STORAGE_KEYS.STATE);
    if (savedState) {
      result.appState = { ...result.appState, ...JSON.parse(savedState) };
      result.scrollToContent = false;
    } else {
      result.scrollToContent = true;
    }

    console.log('✅ 历史数据已恢复');
  } catch (e) {
    console.error('❌ 读取失败:', e);
  }

  return result;
};


const initialData = loadInitialData();

const saveToStorage = debounce((elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
  try {
    // 过滤掉所有 isDeleted 为 true 的元素
    const cleanElements = elements.filter(el => !el.isDeleted);

    // 保存清洗后的数组
    localStorage.setItem(STORAGE_KEYS.ELEMENTS, JSON.stringify(cleanElements));

    // 保存 State
    const stateToSave = {
      showWelcomeScreen: false,
      theme: appState.theme,
      viewBackgroundColor: appState.viewBackgroundColor,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom,
      gridSize: appState.gridSize,
      gridModeEnabled: appState.gridModeEnabled,
      name: appState.name,
    };
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('❌ 保存失败:', e);
  }
}, 500);

const handleChange = (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
  saveToStorage(elements, appState, files);
};

</script>

<template>
  <div style="width: 100%; height: 100vh">
    <ExcalidrawComponent :excalidrawAPI="onReady" :initialData="initialData" :onChange="handleChange"
      langCode="zh-TW" />
  </div>
</template>
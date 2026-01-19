// src/components/ExcalidrawWrapper.tsx
import React from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';

export default function (props: any) {
    console.log(props)
    return (
        <Excalidraw 
        // 1. 显式传递属性 (安全隔离)
            initialData={props.initialData}
            onChange={props.ropsonChange}
            excalidrawAPI={props.excalidrawAPI}
            langCode={props.langCode || "zh-TW"} // 如果 props 没传，默认中文
        >
            <MainMenu>
                <MainMenu.DefaultItems.LoadScene />
                <MainMenu.DefaultItems.SaveToActiveFile />
                <MainMenu.DefaultItems.Export />
                <MainMenu.DefaultItems.SaveAsImage />
                <MainMenu.DefaultItems.Help />
                <MainMenu.DefaultItems.ClearCanvas />
                <MainMenu.Separator />
                
                <MainMenu.DefaultItems.ToggleTheme />
                <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
        </Excalidraw>
    ); 
}
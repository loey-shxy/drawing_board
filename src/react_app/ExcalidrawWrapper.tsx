// src/components/ExcalidrawWrapper.tsx
import React from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';

export default function (props: any) {
    console.log(props)
    return (
        <Excalidraw 
            {...props}
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
import { useState } from 'react';
import { SliderPicker } from 'react-color'
import { downloadImage } from '../utils/downloadImage';

export const Toolkit = ({setTool, foregroundColor, setForegroundColor, borderColor, setBorderColor, showAllLayers, setShowAllLayers, setLayer, undo}) => {
    const [showColorPickerForeground, setShowColorPickerForeground] = useState(false);
    const [showColorPickerBorder, setShowColorPickerBorder] = useState(false);

    return (
        <div>
            <button onClick={undo}>Undo</button>
            <button onClick={() => setTool('select')}>Select</button>
            <button onClick={() => setTool('pencil')}>Pencil</button>
            <button onClick={() => setTool('rectangle')}>Rectangle</button>
            <button onClick={() => setTool('ellipse')}>Ellipse</button>
            <button onClick={() => setTool('line')}>Line</button>
            <button onClick={() => setShowColorPickerForeground((prev) => !prev)}>
                {showColorPickerForeground ? 'Close color picker' : 'Foreground color'}
            </button>
            <p style={{display: 'inline'}}> Foreground opacity: </p>
            <input type='number' id='foreground-opacity' min='0' max='100' defaultValue='0' style={{'width': '48px'}}/>
            <p style={{display: 'inline'}}> Foreground weight: </p>
            <input type='number' id='foreground-weight' min='1' max='6' defaultValue='1' style={{'width': '48px'}}/>
            <button onClick={() => setShowColorPickerBorder((prev) => !prev)}>
                {showColorPickerBorder ? 'Close color picker' : 'Border color'}
            </button>
            <p style={{display: 'inline'}}> Layer: </p>
            <input type='number' id='layer' min='1' max='25' defaultValue='1' style={{'width': '48px'}} onChange={(value) => setLayer(value)}/>
            <button onClick={() => {setShowAllLayers((prev) => !prev)}}>
                {showAllLayers ? 'All layers' : 'Current layer'}
            </button>
            <button onClick={downloadImage}>Download Image</button>
            {
                showColorPickerForeground &&
                <SliderPicker
                    color={foregroundColor}
                    onChange={(newColor) => setForegroundColor(newColor.hex)}
                />
            }
            {
                showColorPickerBorder &&
                <SliderPicker
                    color={borderColor}
                    onChange={(newColor) => setBorderColor(newColor.hex)}
                />
            }
        </div>
    );
}
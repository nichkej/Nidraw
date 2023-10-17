import rough from 'roughjs'
import { Toolkit } from './components/Toolkit';
import { useLayoutEffect, useState } from 'react';
import { average, mousePositionCanvasCoordinates } from './utils/mathUtils';
import { getLayer, getForegroundWeight, getForegroundTransparency} from './utils/toolProperties';
import { generateMultidimensionalArray } from './utils/arrayUtils';
import { createObject, drawObject, containsCoordinates } from './utils/objectUtils';

const generator = rough.generator();

const App = () => {
  // stores all drawn objects among all layers
  const [objects, setObjects] = useState(generateMultidimensionalArray(25));
  const [tool, setTool] = useState('none');
  // stores user action (whether mouse is pressed or not)
  const [action, setAction] = useState('none');
  const [selectedObject, setSelectedObject] = useState(null);
  const [layer, setLayer] = useState(0);
  const [showAllLayers, setShowAllLayers] = useState(false);
  const [foregroundColor, setForegroundColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#000000');
  const [mousePositionStart, setMousePositionStart] = useState({ x: 0, y: 0 });
  // stores history of peformed operations (used for undo)
  const [history, setHistory] = useState([]);

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // clears canvas at rerender to prevent redrawing same elements multiple times
    // IMPORTANT: use fillRect to sustain background (required for downloading non-transparent image)
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    if (showAllLayers) {
      for (let i = 0; i < objects.length; i++) {
        for (let j = 0; j < objects[i].length; j++) {
          drawObject(roughCanvas, context, objects[i][j]);
        }
      }
    } else {
      for (let i = 0; i < objects[getLayer()].length; i++) {
        drawObject(roughCanvas, context, objects[getLayer()][i]);
      }
    }
  }, [objects, layer, showAllLayers, selectedObject]);

  const undo = () => {
    if (history.length === 0) return;

    const actionType = history[history.length - 1].actionType;
    if (actionType === 'draw') {
      // pops the last added object
      const { layer } = history[history.length - 1];

      const objectsCopy = [...objects];
      objectsCopy[layer].pop();
      setObjects(objectsCopy);
    } else if (actionType === 'move') {
      // copies previous properties of the last modified object
      if (history[history.length - 1].type === 'pencil') {
        const { layer, index, points } = history[history.length - 1];

        const objectsCopy = structuredClone(objects);
        objectsCopy[layer][index].points = structuredClone(points);
        setObjects(objectsCopy);
      } else {
        const { layer, index, x1, x2, y1, y2 } = history[history.length - 1];

        const objectsCopy = [...objects];
        const { type, foregroundColor, foregroundTransparency, foregroundWeight } = objectsCopy[layer][index];
        objectsCopy[layer][index] = createObject(generator, x1, y1, x2, y2, type, layer, borderColor, foregroundColor, foregroundTransparency, foregroundWeight);
        setObjects(objectsCopy);
      }
    }

    const historyCopy = [...history];
    historyCopy.pop();
    setHistory(historyCopy);
  }

  const handleMouseDown = (event) => {
    const { clientX, clientY } = mousePositionCanvasCoordinates(event);
    setMousePositionStart({ x: clientX, y: clientY });

    switch (tool) {
      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'pencil':
        const objectsCopy = [...objects];
        objectsCopy[getLayer()].push(createObject(generator, clientX, clientY, clientX, clientY, tool, getLayer(), borderColor, foregroundColor, getForegroundTransparency(), getForegroundWeight()));
        setObjects(objectsCopy);
        setAction('draw');
        setHistory((prev) => [...prev, { actionType: 'draw', layer: getLayer() }]);
        break;
      case 'select':
        for (let i = 0; i < objects[getLayer()].length; i++) {
          // describes whether cursor was already found within an object
          let seen = false;

          if (containsCoordinates(objects[getLayer()][i], mousePositionCanvasCoordinates(event))) {
            setSelectedObject(i);
            setAction('move');
            event.target.style.cursor = 'move';

            if (seen) {
              const historyCopy = [...history];
              historyCopy[historyCopy.length - 1] = objects[getLayer()][i];
              historyCopy[historyCopy.length - 1].index = i;
              historyCopy[historyCopy.length - 1].actionType = 'move';
              setHistory(historyCopy);
            } else {
              // keeps track of last seen object properties to enable undo functionality
              const historyCopy = [...history];
              historyCopy.push(objects[getLayer()][i]);
              historyCopy[historyCopy.length - 1].points = structuredClone(historyCopy[historyCopy.length - 1].points);
              historyCopy[historyCopy.length - 1].layer = getLayer();
              historyCopy[historyCopy.length - 1].index = i;
              historyCopy[historyCopy.length - 1].actionType = 'move';
              setHistory(historyCopy);
            }

            seen = true;
          }
        }
        break;
      default:
        break;
    }
  }

  const handleMouseMove = (event) => {
    const { clientX, clientY } = mousePositionCanvasCoordinates(event);

    switch (action) {
      case 'draw':
        {
          const curLayer = layer;
          const curLayerLength = objects[curLayer].length;
          if (tool === 'pencil') {
            // adds new point (defined by client's mouse position) to the last added object (currently drawn one)
            const objectsCopy = structuredClone(objects);
            objectsCopy[curLayer][curLayerLength - 1].points = structuredClone(objectsCopy[curLayer][curLayerLength - 1].points);
            objectsCopy[curLayer][curLayerLength - 1].points.push({ x: clientX, y: clientY });
            setObjects(objectsCopy);
          } else {
            let { x1, y1, type, layer, borderColor, foregroundColor = null, foregroundTransparency = null, foregroundWeight = null } = objects[curLayer][curLayerLength - 1];

            // switches between 'perfect' and 'free' object creation (rectangle -> square, ellipse -> circle) and vice versa
            if (event.shiftKey) {
              if (type === 'rectangle') {
                type = 'square';
              } else if (type === 'ellipse') {
                type = 'circle';
              }
            } else {
              if (type === 'square') {
                type = 'rectangle';
              } else if (type === 'circle') {
                type = 'ellipse';
              }
            }

            const objectsCopy = [...objects];
            objectsCopy[curLayer][curLayerLength - 1] = createObject(generator, x1, y1, clientX, clientY, type, layer, borderColor, foregroundColor, foregroundTransparency, foregroundWeight);
            setObjects(objectsCopy);
          }
        }
        break;
      case 'move':
        {
          const deltaX = clientX - mousePositionStart.x;
          const deltaY = clientY - mousePositionStart.y;
          event.target.style.cursor = 'move';

          if (objects[layer][selectedObject].type === 'pencil') {
            // shifts all points by deltaX and deltaY
            const objectsCopy = structuredClone(objects);
            objectsCopy[layer][selectedObject].points = structuredClone(objectsCopy[layer][selectedObject].points);
            for (let i = 0; i < objectsCopy[layer][selectedObject].points.length; i++) {
              objectsCopy[layer][selectedObject].points[i].x += deltaX;
              objectsCopy[layer][selectedObject].points[i].y += deltaY;
            }
            setObjects(objectsCopy);
          } else {
            // shifts corner positions by deltaX and deltaY
            let { x1, x2, y1, y2, type, layer, borderColor, foregroundColor, foregroundTransparency, foregroundWeight } = objects[getLayer()][selectedObject];

            const objectsCopy = [...objects];
            objectsCopy[getLayer()][selectedObject] = createObject(generator, x1 + deltaX, y1 + deltaY, x2 + deltaX, y2 + deltaY, type, layer, borderColor, foregroundColor, foregroundTransparency, foregroundWeight);
            setObjects(objectsCopy);
          }
          // updates last mouse position to current mouse position (used in further calculations)
          setMousePositionStart({ x: clientX, y: clientY });
        }
        break;
      default:
        break;
    }
  }

  const handleMouseUp = (event) => {
    // resets tool-related states to defaul values
    setAction('none');
    setSelectedObject(null);
    event.target.style.cursor = 'default';
  }

  return (
    <div>
      <Toolkit
        setTool={setTool}
        foregroundColor={foregroundColor}
        setForegroundColor={setForegroundColor}
        borderColor={borderColor}
        setBorderColor={setBorderColor}
        showAllLayers={showAllLayers}
        setShowAllLayers={setShowAllLayers}
        setLayer={setLayer}
        undo={undo}
      />
      <canvas
        id='canvas'
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}

export default App;
import getStroke from 'perfect-freehand';
import { getSvgPathFromStroke } from './getSvgPathFromStroke';
import { average } from './mathUtils';

export const createObject = (generator, x1, y1, x2, y2, type, layer, borderColor, foregroundColor, foregroundTransparency, foregroundWeight) => {
  if (foregroundColor && foregroundColor.length < 9) {
    // combines color and transparency data into 8-digit hex value
    let hexForegroundTransparency = foregroundTransparency.toString(16);
    if (hexForegroundTransparency.length === 1) hexForegroundTransparency = '0' + hexForegroundTransparency;
    foregroundColor += hexForegroundTransparency;
  }
  let roughObject = null;
  switch (type) {
    case 'rectangle':
      console.log(borderColor);
      roughObject = generator.rectangle(x1, y1, x2 - x1, y2 - y1, { fill: foregroundColor, fillWeight: foregroundWeight, stroke: borderColor });
      break;
    case 'square':
      const length = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
      roughObject = generator.rectangle(x1, y1, Math.sign(x2 - x1) * length, Math.sign(y2 - y1) * length, { fill: foregroundColor, fillWeight: foregroundWeight, stroke: borderColor });
      break;
    case 'ellipse':
      roughObject = generator.ellipse(parseInt(average(x1, x2)), parseInt(average(y1, y2)), x2 - x1, y2 - y1, { fill: foregroundColor, fillWeight: foregroundWeight, stroke: borderColor });
      break;
    case 'circle':
      const diameter = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
      roughObject = generator.circle(parseInt(x1 + diameter * Math.sign(x2 - x1) / 2), parseInt(y1 + diameter * Math.sign(y2 - y1) / 2), diameter, { fill: foregroundColor, fillWeight: foregroundWeight, stroke: borderColor });
      break;
    case 'line':
      roughObject = generator.line(x1, y1, x2, y2, { stroke: borderColor });
      break;
    case 'pencil':
      return { type, points: [{ x: x1, y: y1 }], borderColor: borderColor};
    default:
      break;
  }
  return { x1, y1, x2, y2, type, layer, roughObject, borderColor, foregroundColor, foregroundTransparency, foregroundWeight };
}

export const drawObject = (roughCanvas, context, object) => {
  if (object.type === 'pencil') {
    const stroke = getSvgPathFromStroke(getStroke(object.points, { size: 4 }));
    context.fillStyle = object.borderColor;
    context.fill(new Path2D(stroke));
  } else {
    roughCanvas.draw(object.roughObject);
  }
}

export const containsCoordinates = (object, coordinates) => {
  const {clientX, clientY} = coordinates;
  switch (object.type) {
    case 'rectangle':
    case 'square':
      // checks whether clientX lies inside x coordinate's bounds
      // checks whether ciientY lies inside y coordinate's bounds 
      const x1 = Math.min(object.x1, object.x2);
      const x2 = Math.max(object.x1, object.x2);
      const y1 = Math.min(object.y1, object.y2);
      const y2 = Math.max(object.y1, object.y2);
      if (clientX >= x1 && clientX <= x2 && clientY >= y1 && clientY <= y2) return true;
      break;
    case 'ellipse':
    case 'circle':
      {
        // utilizes ellipse equation to check whether point (clientX, clientY) lies inside the object
        // adds 0.1 error to epsilon to handle user's cursor misalignment
        const centerX = clientX - parseInt(average(object.x1, object.x2));
        const centerY = clientY - parseInt(average(object.y1, object.y2));
        const b = (object.x2 - object.x1) / 2.0;
        const a = (object.y2 - object.y1) / 2.0;
        const epsilon = 1.1;
        if ((centerX * centerX) / (b * b) + (centerY * centerY) / (a * a) <= epsilon) return true;
      }
      break;
    case 'line':
      {
        // checks whether the sum of distances between point (clientX, clientY) and both line ends is equal to their respective distance
        // adds room for error of 0.1 to handle user's curos misalignment
        const dist1 = Math.sqrt((clientX - object.x1) * (clientX - object.x1) + (clientY - object.y1) * (clientY - object.y1));
        const dist2 = Math.sqrt((clientX - object.x2) * (clientX - object.x2) + (clientY - object.y2) * (clientY - object.y2));
        const dist = Math.sqrt((object.x1 - object.x2) * (object.x1 - object.x2) + (object.y1 - object.y2) * (object.y1 - object.y2));
        const epsilon = 0.1;
        if (Math.abs(dist1 + dist2 - dist) <= epsilon) return true;
      }
      break;
    case 'pencil':
      {
        // uses the same logic as for checking whether a points belongs to the line for each adjacent points pair
        // checks whether each points overlaps with mouse cursor as well
        const epsilon = 3;
        let dist;
        for (let i = 0; i < object.points.length; i++) {
          dist = Math.sqrt((object.points[i].x - clientX) * (object.points[i].x - clientX) + (object.points[i].y - clientY) * (object.points[i].y - clientY));
          if (dist <= epsilon) return true;
        }
        for (let i = 0; i < object.points.length - 1; i++) {
          const dist1 = Math.sqrt((clientX - object.points[i].x) * (clientX - object.points[i].x) + (clientY - object.points[i].y) * (clientY - object.points[i].y));
          const dist2 = Math.sqrt((clientX - object.points[i + 1].x) * (clientX - object.points[i + 1].x) + (clientY - object.points[i + 1].y) * (clientY - object.points[i + 1].y));
          dist = Math.sqrt((object.points[i].x - object.points[i + 1].x) * (object.points[i].x - object.points[i + 1].x) + (object.points[i].y - object.points[i + 1].y) * (object.points[i].y - object.points[i + 1].y));
          if (Math.abs(dist1 + dist2 - dist) <= epsilon) {
            return true;
          } 
        }
        break;
      }
    default:
      break;
  }
  return false;
}
export const average = (a, b) => (a + b) / 2;

export const mousePositionCanvasCoordinates = (event) => {
  // subtracts canvas top-left corner from world-coordinates to normalize mouse position in canvas space
  const canvas = document.getElementById('canvas');
  const rect = canvas.getBoundingClientRect();
  let { clientX, clientY } = event;
  clientX -= rect.left;
  clientY -= rect.top;
  return { clientX, clientY };
}
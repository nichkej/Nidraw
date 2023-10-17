export const downloadImage = () => {
  const canvas = document.getElementById('canvas');
  const canvasUrl = canvas.toDataURL();

  // adds temporary link element
  // clicks on the elemenet to send download request
  // deletes the element from page

  const createLinkElement = document.createElement('a');
  createLinkElement.href = canvasUrl;
  
  // sets file name to 'drawing'
  createLinkElement.download = 'drawing';
  createLinkElement.click();
  createLinkElement.remove();
}
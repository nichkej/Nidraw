export const getLayer = () => (parseInt(document.getElementById('layer').value) - 1);
export const getForegroundWeight = () => parseInt(document.getElementById('foreground-weight').value);
export const getForegroundTransparency = () => parseInt(document.getElementById('foreground-opacity').value * 255 / 100.0);
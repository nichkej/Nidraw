export const generateMultidimensionalArray = (n) => {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push([]);
  }
  return result;
}
export function isNumeric(str) {
  // Regular expression to match numeric strings
  const numericRegex = /^[+-]?\d+(\.\d+)?$/;
  return numericRegex.test(str);
}

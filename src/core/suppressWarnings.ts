import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'style.resizeMode is deprecated',
]);

if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('style.resizeMode is deprecated')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      (event.filename && event.filename.includes('webextension')) ||
      (event.message && event.message.includes("Cannot read properties of null (reading '1')"))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

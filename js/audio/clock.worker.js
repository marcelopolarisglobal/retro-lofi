let timer = null;

self.onmessage = (event) => {
  if (event.data === 'start' && !timer) {
    timer = setInterval(() => self.postMessage('tick'), 25);
  }
};

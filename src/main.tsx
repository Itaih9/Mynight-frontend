import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Take down the boot spinner that index.html paints before any of this loaded.
 *
 * Two frames deep on purpose: render() only SCHEDULES the work, so removing the
 * spinner on the next frame uncovers an #root that is still empty and the page
 * flashes white between spinner and content.
 */
const removeBootLoader = () => {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById('boot-loader')?.remove())
  );
};

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} finally {
  // In `finally` so a mount that throws still clears the spinner: a blank page
  // with an error in the console is a bug someone can see and report, whereas a
  // spinner turning forever looks like a slow network.
  removeBootLoader();
}

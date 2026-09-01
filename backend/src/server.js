// server.js

import './loadEnv.js';
import app from './app.js';

// PORT first so hosts such as Render, which inject it, keep working; then the
// namespaced value from the repo-root .env, which both apps share.
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

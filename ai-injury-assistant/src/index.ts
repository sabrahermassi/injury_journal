// Must come first: app.ts and config/port.js read process.env at import time.
import './config/load-env.js';

import app from './app.js';
import { PORT } from './config/port.js';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

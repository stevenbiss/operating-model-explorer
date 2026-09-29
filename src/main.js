// Engine entry point. Pure model code lives in src/model/ and is shared with the Node unit tests.
// Design D5: content embedded in <script id="om-content" type="application/json"> means viewer mode
// (an exported snapshot); without it the engine opens in author mode.
import { render } from './viewer/app.js';
import { startAuthor } from './author/author.js';

const embedded = document.getElementById('om-content');
if (embedded) render(JSON.parse(embedded.textContent));
else startAuthor(document.getElementById('app'));

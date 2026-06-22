// BUILD_VERSION matches "build N · YYYY-MM-DD".
import { html, done, assert } from './harness.mjs';
const m = html.match(/const\s+BUILD_VERSION\s*=\s*'([^']+)'/);
assert(!!m, 'BUILD_VERSION is a single-quoted string');
assert(/^build\s+\d+\s+·\s+\d{4}-\d{2}-\d{2}$/.test(m[1]), `format "build N · YYYY-MM-DD" (got "${m && m[1]}")`);
done('build version format');

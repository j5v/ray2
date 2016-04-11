## ray2

Renders a small ball, inside a reflective ellipsiod, producing complicated patterns.

Uses WebGL shaders, which may result in real-time animation: 60fps on a good graphics card [2014]. Works on mobile devices (even Galaxy S3), but typically with limited precision.

Currently comprises HTML+Javascript, and a supporting JavaScript framework.

#### Todo

1. Inject parameters into the script, and recompile shaders (detach, delete, etc).

2. UI for parameters.

3. UI for setting canvas size.

4. Resume after recompile, enabling seamless parameter changes, pausing, and URL-encoded state.

5. Produce high-resolution still image (requires all the above)

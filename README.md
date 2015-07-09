# ray2

Renders a small ball, inside a reflective ellipsiod, producing complicated patterns.
Uses WebGL shaders, which typically give real-time animation (60fps on a good graphics card).
Currently comprises HTML+Javascript, and a supporting JavaScript framework.

Todo:
1. Inject parameters into the script, and recompile shaders (detach, delete, etc).
2. UI for parameters.
3. UI for setting canvas size.
3. Resume after recompile, enabling seamless parameter changes, pausing, and URL-encoded state.
4. Produce high-resolution still image (requires all the above)

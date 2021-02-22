[WebGLFundamentals.org](https://webglfundamentals.org)

Have a go at it: https://jacksonn-gtc.github.io/Tetris-in-WebGL/

Possible feature additions:
*Adding score
*Allowing rotations at the top of the screen
*Adding block stashing
*Adding a block preview queue

Current Issues:
This implementation is inefficient, and lag is noticeable once blocks start piling up.
Optimizations include
*only updating player controlled blocks
*only obtaining data for all blocks when new blocks become solid, instead of every update
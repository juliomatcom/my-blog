/* Tunables shared across the scene. `initSpaceScene` mutates a few of these at
 * startup (star density, drift, parallax reach) depending on whether the page is
 * a blog post or the home page -- every body reads them live. */
export const CONFIG = {
  starCount: 7500,
  near: 10, // nearest star distance
  depth: 260, // furthest star distance
  margin: 1.4, // spawn spread beyond the frustum edges
  drift: 0.2, // star travel speed toward the camera (units/sec)
  fov: 60,
  camShift: 1.1, // camera lateral travel per unit of pointer offset
  lookShift: 12, // look-target travel per unit of pointer offset (turn parallax)
  ease: 5, // pointer follow rate
  idleReturn: 0.5, // drift back to centre when the pointer is still
  idleAfter: 2.0, // seconds of stillness before drift-back
  maxDpr: 2,
};

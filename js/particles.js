// Based on https://css-tricks.com/playing-with-particles-using-the-web-animations-api/ by Louis Hoebregts


function animatePop (e, dx=0, dy=0, spread=75) {
  // Quick check if user clicked the button using a keyboard
  if (e.clientX === 0 && e.clientY === 0) { // TODO: this is a bad check
    const bbox = document.querySelector('#button').getBoundingClientRect();
    const x = bbox.left + bbox.width / 2;
    const y = bbox.top + bbox.height / 2;
    for (let i = 0; i < 30; i++) {
      createParticle(x, y, dx, dy, spread);
    }
  } else {
    for (let i = 0; i < 30; i++) {
      createParticle(e.clientX, e.clientY, dx, dy, spread);
    }
  }
}

function createParticle (x, y, dx=0, dy=0, spread=75) {
  const particle = document.createElement('particle');
  document.body.appendChild(particle);
  
  // Calculate a random size from 5px to 25px
  const size = Math.floor(Math.random() * 7 + 3);
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  // Generate a random color in a blue/purple palette
  
  particle.style.background = new Color(180, 10, 0).mix(framing, Math.random()).rgb(); // FIXME: ugly dependency on having palettize script above it
  
  // Generate a random x & y destination within a distance of 75px from the mouse
  const startX = x + (Math.random() - 0.5) * 2 * spread * 0.7;
  const startY = y + (Math.random() - 0.5) * 2 * spread * 0.7;

  const destinationX = dx + startX + (Math.random() - 0.5) * 2 * spread;
  const destinationY = dy + startY + (Math.random() - 0.5) * 2 * spread;

  // Store the animation in a variable as we will need it later
  const animation = particle.animate([
    {
      // Set the origin position of the particle
      // We offset the particle with half its size to center it around the mouse
      transform: `translate(-50%, -50%) translate(${startX}px, ${startY}px)`,
      opacity: 1
    },
    {
      // We define the final coordinates as the second keyframe
      transform: `translate(${destinationX}px, ${destinationY}px)`,
      opacity: 0
    }
  ], {
    // Set a random duration from 500 to 1500ms
    duration: Math.random() * 1000 + 500,
    easing: 'cubic-bezier(0, .9, .57, 1)',
    // Delay every particle with a random value of 200ms
    delay: Math.random() * 200
  });
  
  // When the animation is complete, remove the element from the DOM
  animation.onfinish = () => {
    particle.remove();
  };
}
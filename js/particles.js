// Based on https://css-tricks.com/playing-with-particles-using-the-web-animations-api/ by Louis Hoebregts

var predefinedParticles = {
  theme_disk: function(particle, sizeMult=1){
    // Randomize particle size
    const size = Math.floor(Math.random() * 7 + 3);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = '50%';
    
    // Generate a random theme color
    particle.style.background = highlights.mix(framing, Math.random()).rgb(); // FIXME: ugly dependency on having palettize script above it
  },
}
var predefinedMovements = {
  spew: function(particle, x, y, dx, dy, spread) {
    // Generate a random destination within some distance from the mouse
    const startX = x + (Math.random()*2-1) * spread * 0.7;
    const startY = y + (Math.random()*2-1) * spread * 0.7;

    const destinationX = startX + dx + (Math.random() - 0.5) * 2 * spread;
    const destinationY = startY + dy + (Math.random() - 0.5) * 2 * spread;

    const animation = particle.animate([
      { // start position
        // We offset the particle with half its size to center it around the mouse FIXME
        transform: `translate(-50%, -50%) translate(${startX}px, ${startY}px)`,
        opacity: 1
      },
      { // end position
        transform: `translate(${destinationX}px, ${destinationY}px)`,
        opacity: 1
      }
    ], {
      // Set a random duration
      duration: Math.random() * 500 + 300,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      // Delay every particle with a random value
      delay: Math.random() * 100
    });
    return animation
  }
}

function animatePop (e, particle='theme_disk', movement="spew", particleCount=30, dx=0, dy=0, spread=75) {
  generator = predefinedParticles[particle]
  movement = predefinedMovements[movement]

  let x, y
  // Quick check if user clicked the button using a keyboard, then the particle is in the middle of the button
  if (e.clientX === 0 && e.clientY === 0) { // TODO: this is a bad check
    const bbox = document.querySelector('#button').getBoundingClientRect();
    x = bbox.left + bbox.width / 2;
    y = bbox.top + bbox.height / 2;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  for (let i = 0; i < particleCount; i++) {
    createParticle(x, y, generator, movement, dx, dy, spread);
  }
}

function createParticle (x, y, generator, movement, dx=0, dy=0, spread=75) {
  const particle = document.createElement('particle');
  document.body.appendChild(particle);

  generator(particle)

  animation = movement(particle, x, y, dx, dy, spread)
  
  // When the animation is complete, remove the element from the DOM
  animation.onfinish = () => {
    particle.remove();
  };
}
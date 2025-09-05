// Based on https://css-tricks.com/playing-with-particles-using-the-web-animations-api/ by Louis Hoebregts

var predefinedParticles = {
  theme_disk: function(sizeMult=1, passedColors){
    const particle = document.createElement('particle');
    document.body.appendChild(particle);

    // Randomize particle size
    const size = Math.floor(Math.random() * 7 + 3);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = '50%';
    
    // Generate a random theme color
    particle.style.background = highlights.mix(framing, Math.random()).rgb(); // FIXME: ugly dependency on having palettize script above it

    return particle
  },
  leafy: function(sizeMult=1, passedColors){
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    particle.classList.add("particle");
    particle.setAttributeNS(null, "viewBox", "-30 -30 60 60")
    document.body.appendChild(particle); // TODO: could probably append to event originator instead
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    const elementID = '#monstera'+Math.floor(Math.random()*3+1)
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', elementID);
    particle.appendChild(use)

    // Randomize particle size
    const size = Math.floor(Math.random() * 20 + 20);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    let color
    // Generate a random theme color
    if (passedColors) {
      // color = passedColors[0].mix(passedColors[1], Math.random());
      color = passedColors[Math.floor(Math.random()*passedColors.length)];
    } else {
      color = framing.mix(deepFraming, Math.random()); // FIXME: ugly dependency on having palettize script above it
    }
    particle.style.fill = color.rgb()
    
    return particle
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
  },
  pop: function(particle, x, y, dx, dy, spread) {
    // Generate a random destination within some distance from the mouse
    const startX = x;
    const startY = y;

    const destinationX = startX + (Math.random() - 0.5) * 2 * spread;
    const destinationY = startY + (Math.random() - 0.5) * 2 * spread;

    const rot1 = Math.random() * 500;
    const rot2 = Math.random() * 500;

    const animation = particle.animate([
      { // start position
        // We offset the particle with half its size to center it around the mouse FIXME
        transform: `translate(${startX}px, ${startY}px) rotate(${rot1}deg)`,
        opacity: 1
      },
      { // end position
        transform: `translate(${destinationX}px, ${destinationY}px) rotate(${rot2}deg)`,
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
  },
}

function animatePop (e, particle='theme_disk', movement="spew", particleCount=30, dx=0, dy=0, spread=75, passedColors) {
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
    createParticle(x, y, generator, movement, dx, dy, spread, passedColors);
  }
}

function createParticle (x, y, generator, movement, dx=0, dy=0, spread=75, passedColors) {
  const particle = generator(undefined, passedColors)

  animation = movement(particle, x, y, dx, dy, spread)
  
  // When the animation is complete, remove the element from the DOM
  animation.onfinish = () => {
    particle.remove();
  };
}
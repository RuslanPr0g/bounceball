const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Make canvas square
canvas.width = Math.min(window.innerWidth, window.innerHeight) - 20;
canvas.height = canvas.width;

const circles = [];
const boundaryRadius = canvas.width / 2 - 20;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Define the hole
const holeAngle = Math.PI / 4; // Position of the hole
const holeSize = Math.PI / 8; // Increased hole size

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25; // Increased radius
        this.dx = (Math.random() - 0.5) * 8; // Increased initial speed
        this.dy = (Math.random() - 0.5) * 8; // Increased initial speed
        this.color = getRandomColor();
        this.mass = 1; // Add mass for collision calculations
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(circles) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Check if the circle is near the hole
        if (distance + this.radius > boundaryRadius &&
            Math.abs(angle - holeAngle) < holeSize / 2) {
            return false; // Circle escaped, remove it
        }

        // Bounce off the circular boundary
        if (distance + this.radius > boundaryRadius) {
            // Calculate the normal vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Calculate the dot product of velocity and normal
            const dotProduct = this.dx * nx + this.dy * ny;

            // Calculate the reflection
            this.dx -= 2 * dotProduct * nx;
            this.dy -= 2 * dotProduct * ny;

            // Increase speed slightly
            const speedIncrease = 1.05; // Increased speed increase factor
            this.dx *= speedIncrease;
            this.dy *= speedIncrease;

            // Move the circle back inside the boundary
            const scale = (boundaryRadius - this.radius) / distance;
            this.x = centerX + dx * scale;
            this.y = centerY + dy * scale;
        }

        // Check collisions with other circles
        for (let other of circles) {
            if (other !== this) {
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.radius + other.radius) {
                    // Collision detected, calculate new velocities
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate velocity vectors
                    const vx1 = this.dx * cos + this.dy * sin;
                    const vy1 = this.dy * cos - this.dx * sin;
                    const vx2 = other.dx * cos + other.dy * sin;
                    const vy2 = other.dy * cos - other.dx * sin;

                    // Collision reaction
                    const vx1Final = ((this.mass - other.mass) * vx1 + 2 * other.mass * vx2) / (this.mass + other.mass);
                    const vx2Final = ((other.mass - this.mass) * vx2 + 2 * this.mass * vx1) / (this.mass + other.mass);

                    // Rotate velocities back
                    this.dx = vx1Final * cos - vy1 * sin;
                    this.dy = vy1 * cos + vx1Final * sin;
                    other.dx = vx2Final * cos - vy2 * sin;
                    other.dy = vy2 * cos + vx2Final * sin;

                    // Move circles apart to prevent sticking
                    const overlap = this.radius + other.radius - distance;
                    const moveX = overlap * Math.cos(angle) / 2;
                    const moveY = overlap * Math.sin(angle) / 2;
                    this.x -= moveX;
                    this.y -= moveY;
                    other.x += moveX;
                    other.y += moveY;
                }
            }
        }

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        this.draw();
        return true; // Circle stays in the game
    }
}

function drawBoundary() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, boundaryRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, boundaryRadius, holeAngle - holeSize / 2, holeAngle + holeSize / 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBoundary();
    circles.forEach((circle, index) => {
        if (!circle.update(circles)) {
            circles.splice(index, 1); // Remove escaped circles
        }
    });
    
    requestAnimationFrame(animate);
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < boundaryRadius - 25) { // Ensure the entire ball fits inside the boundary
        circles.push(new Circle(x, y));
    }
});

animate();
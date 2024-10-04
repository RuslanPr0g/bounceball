const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bounceSound = document.getElementById('bounceSound');
const escapeSound = document.getElementById('escapeSound');
const collisionSound = document.getElementById('collisionSound');

canvas.width = Math.min(window.innerWidth, window.innerHeight) - 20;
canvas.height = canvas.width;

const circles = [];
const boundaryRadius = canvas.width / 2 - 20;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const holeSize = Math.PI / 16;
const innerBoundaries = [];

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

function createInnerBoundaries() {
    const numBoundaries = Math.floor(Math.random() * 3) + 3; // 3 to 5 inner boundaries
    const minRadius = boundaryRadius * 0.2; // Minimum radius for the innermost circle
    const radiusStep = (boundaryRadius - minRadius) / numBoundaries;
    
    for (let i = 0; i < numBoundaries; i++) {
        const radius = boundaryRadius - i * radiusStep;
        innerBoundaries.push({ 
            x: centerX, 
            y: centerY, 
            radius,
            holes: []
        });
    }
}

function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.error("Error playing sound:", e));
}

class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20; // Increased from 10 to 20
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = (Math.random() - 0.5) * 4;
        this.color = getRandomColor();
        this.currentBoundary = innerBoundaries.length - 1;
        this.outerMostBoundary = innerBoundaries.length - 1;
        this.mass = 1;
        this.passedBoundaries = new Set();
    }

    update(otherCircles) {
        let dx = this.x - centerX;
        let dy = this.y - centerY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        // Check all boundaries the ball interacts with
        for (let i = 0; i <= this.outerMostBoundary; i++) {
            const boundary = innerBoundaries[i];
            const nearHole = boundary.holes.some(hole => Math.abs(angle - hole) < holeSize / 2);

            if (!nearHole) {
                const distanceToBoundary = Math.abs(distance - boundary.radius);
                if (distanceToBoundary < this.radius) {
                    this.bounceOff(centerX, centerY, boundary.radius);
                    boundary.holes.push(angle);
                    // Recalculate distance and angle after bounce
                    dx = this.x - centerX;
                    dy = this.y - centerY;
                    distance = Math.sqrt(dx * dx + dy * dy);
                    angle = Math.atan2(dy, dx);
                }
            } else if (Math.abs(distance - boundary.radius) < this.radius / 2) {
                // Pass through the hole
                if (this.passedBoundaries.has(i)) {
                    this.passedBoundaries.delete(i);
                    if (i === this.currentBoundary) this.currentBoundary++;
                } else {
                    this.passedBoundaries.add(i);
                    if (i === this.currentBoundary) this.currentBoundary--;
                }
                this.outerMostBoundary = Math.max(this.outerMostBoundary, i);
            }
        }

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Check if the ball has escaped all boundaries
        if (distance > innerBoundaries[0].radius + this.radius) {
            playSound(escapeSound);
            return false;
        }

        // Bounce off other circles
        for (let other of otherCircles) {
            if (other !== this) {
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.radius + other.radius) {
                    this.resolveCollision(other);
                    playSound(collisionSound);
                }
            }
        }

        this.draw();
        return true;
    }

    bounceOff(centerX, centerY, radius) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the normal vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate the dot product of velocity and normal
        const dotProduct = this.dx * nx + this.dy * ny;

        // Calculate the reflection
        this.dx -= 2 * dotProduct * nx;
        this.dy -= 2 * dotProduct * ny;

        // Increase speed slightly
        const speedIncrease = 1.05;
        this.dx *= speedIncrease;
        this.dy *= speedIncrease;

        // Calculate the overlap
        const overlap = this.radius - Math.abs(radius - distance);

        // Move the circle to the exact boundary
        if (distance < radius) {
            // Ball is inside the boundary
            this.x += nx * overlap;
            this.y += ny * overlap;
        } else {
            // Ball is outside the boundary
            this.x -= nx * overlap;
            this.y -= ny * overlap;
        }

        // Play the bounce sound
        playSound(bounceSound);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    resolveCollision(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normal vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Tangent vector
        const tx = -ny;
        const ty = nx;

        // Dot product tangent
        const dpTan1 = this.dx * tx + this.dy * ty;
        const dpTan2 = other.dx * tx + other.dy * ty;

        // Dot product normal
        const dpNorm1 = this.dx * nx + this.dy * ny;
        const dpNorm2 = other.dx * nx + other.dy * ny;

        // Conservation of momentum in 1D
        const m1 = (dpNorm1 * (this.mass - other.mass) + 2 * other.mass * dpNorm2) / (this.mass + other.mass);
        const m2 = (dpNorm2 * (other.mass - this.mass) + 2 * this.mass * dpNorm1) / (this.mass + other.mass);

        // Update velocities
        this.dx = tx * dpTan1 + nx * m1;
        this.dy = ty * dpTan1 + ny * m1;
        other.dx = tx * dpTan2 + nx * m2;
        other.dy = ty * dpTan2 + ny * m2;

        // Move circles apart to prevent sticking
        const overlap = (this.radius + other.radius - distance) / 2;
        this.x -= overlap * nx;
        this.y -= overlap * ny;
        other.x += overlap * nx;
        other.y += overlap * ny;
    }
}

function drawBoundaries() {
    innerBoundaries.forEach((boundary, index) => {
        ctx.beginPath();
        ctx.arc(boundary.x, boundary.y, boundary.radius, 0, Math.PI * 2);
        ctx.strokeStyle = index === 0 ? 'green' : 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw holes
        boundary.holes.forEach(holeAngle => {
            ctx.beginPath();
            ctx.arc(boundary.x, boundary.y, boundary.radius, holeAngle - holeSize / 2, holeAngle + holeSize / 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
        });
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBoundaries();
    circles.forEach((circle, index) => {
        if (!circle.update(circles)) {
            circles.splice(index, 1); // Remove escaped circles
        }
    });

    // Regenerate holes for the main boundary
    if (innerBoundaries[0].holes.length > 0) {
        innerBoundaries[0].holes = innerBoundaries[0].holes.filter(() => Math.random() > 0.01); // 1% chance to remove a hole each frame
    }
    
    requestAnimationFrame(animate);
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < innerBoundaries[innerBoundaries.length - 1].radius - 20) {
        circles.push(new Circle(x, y));
    }
});

createInnerBoundaries();
animate();
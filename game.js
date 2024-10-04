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

const temporaryHoles = [];

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
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Check if the circle is near the permanent hole or any temporary hole
        if (distance + this.radius > boundaryRadius &&
            (Math.abs(angle - holeAngle) < holeSize / 2 || 
             temporaryHoles.some(hole => Math.abs(angle - hole.angle) < hole.size / 2))) {
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

            // Create a temporary hole
            temporaryHoles.push({
                angle: angle,
                size: Math.PI / 16,
                timeLeft: 5000 // 5 seconds
            });
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

    // // Draw the permanent hole
    // ctx.beginPath();
    // ctx.arc(centerX, centerY, boundaryRadius, holeAngle - holeSize / 2, holeAngle + holeSize / 2);
    // ctx.strokeStyle = 'black';
    // ctx.lineWidth = 3;
    // ctx.stroke();
    // ctx.closePath();

    // Draw temporary holes
    temporaryHoles.forEach(hole => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, boundaryRadius, hole.angle - hole.size / 2, hole.angle + hole.size / 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    });
}

function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBoundary();
    circles.forEach((circle, index) => {
        if (!circle.update()) {
            circles.splice(index, 1); // Remove escaped circles
        }
    });

    // Update and remove expired temporary holes
    for (let i = temporaryHoles.length - 1; i >= 0; i--) {
        temporaryHoles[i].timeLeft -= 16; // Assuming 60 FPS
        if (temporaryHoles[i].timeLeft <= 0) {
            temporaryHoles.splice(i, 1);
        }
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
    
    if (distance < boundaryRadius - 25) { // Ensure the entire ball fits inside the boundary
        circles.push(new Circle(x, y));
    }
});

animate();
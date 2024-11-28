// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild, limitToLast, get, remove, set, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js";


// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkZ623jTFfaHMLnDiBdkKKRE_4ZpBks2Q",
  authDomain: "snakegamesol.firebaseapp.com",
  databaseURL: "https://snakegamesol-default-rtdb.firebaseio.com",
  projectId: "snakegamesol",
  storageBucket: "snakegamesol.firebasestorage.app",
  messagingSenderId: "554236492753",
  appId: "1:554236492753:web:a70510b1a96c31bd237ef0",
  measurementId: "G-NE6QQQE9EV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Snake Game Variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;
let gameStarted = false; // Track if the game has started


let snake = [{ x: 9 * box, y: 9 * box }];
let food = {
  x: Math.floor(Math.random() * 20) * box,
  y: Math.floor(Math.random() * 20) * box
};
const foodImage = new Image();
foodImage.src = "assets/solana.png";

let score = 0;
let direction = null;

// Declare game as a global variable
let game = null; // Ensure it's defined globally

// Add these variables at the top with your other game variables
let backgroundIntensity = 0;
const maxIntensity = 0.5; // Maximum darkness/redness intensity

// Prevent scrolling when using arrow keys or WASD
window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }
});

// Show the start prompt
const startPrompt = document.getElementById("start-prompt");
startPrompt.classList.remove("hidden");

// Event listener for WASD to start the game
document.addEventListener("keydown", event => {
  if (!gameStarted && ["w", "a", "s", "d"].includes(event.key)) {
    gameStarted = true;
    startPrompt.classList.add("hidden"); // Hide the prompt when the game starts
    direction = event.key === "w" ? "UP" : event.key === "a" ? "LEFT" : event.key === "s" ? "DOWN" : "RIGHT";

    // Clear existing interval and start the game
    if (game) clearInterval(game); // Clear any existing interval
    game = setInterval(draw, 100); // Start the game loop at a consistent speed
  }
});

// Reset Game Function
function resetGame() {
  if (game) clearInterval(game); // Clear the game loop interval
  document.getElementById("game-over").classList.add("hidden");
  document.getElementById("restartGame").classList.add("hidden");
  startPrompt.classList.remove("hidden"); // Show the start prompt again

  // Reset game variables
  snake = [{ x: 9 * box, y: 9 * box }];
  food = {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };
  score = 0;
  // Update score display when resetting
  document.getElementById("current-score").textContent = `Score: ${score}`;
  direction = null;
  gameStarted = false; // Reset the gameStarted flag
  game = null; // Reset the interval reference
  backgroundIntensity = 0;
  particles.length = 0; // Clear particles
}

// Draw Function (Unchanged, for reference)
function draw() {
  if (!gameStarted) return; // Skip drawing until game actually starts
  
  // Calculate background intensity based on score
  backgroundIntensity = Math.min(score / 30, maxIntensity); // Increases until score of 30
  
  // Create dynamic background color
  const redComponent = Math.floor(backgroundIntensity * 80); // Subtle red tint
  const darkenAmount = Math.floor(backgroundIntensity * 20);
  
  // Set canvas background with dynamic color
  ctx.fillStyle = `rgb(${darkenAmount}, 0, ${darkenAmount})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add dynamic grid effect
  ctx.strokeStyle = `rgba(153, 69, 255, ${0.1 + backgroundIntensity * 0.2})`; // Grid gets more visible
  ctx.lineWidth = 0.5;
  for (let i = 0; i < canvas.width; i += box) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Add pulsing glow effect to the background
  if (score > 0) {
    const pulseIntensity = Math.sin(Date.now() / 1000) * 0.1 * backgroundIntensity;
    ctx.fillStyle = `rgba(153, 69, 255, ${pulseIntensity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Add particle effects as score increases
  if (score > 5) {
    drawParticles();
  }

  // Draw the snake with enhanced styling
  snake.forEach((part, index) => {
    // Create gradient for snake parts
    const gradient = ctx.createLinearGradient(part.x, part.y, part.x + box, part.y + box);
    
    if (index === 0) { // Head
      gradient.addColorStop(0, "#9945FF");
      gradient.addColorStop(1, "#14F195");
      
      // Draw the main head
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(part.x, part.y, box, box, 5);
      ctx.fill();
      
      // Add glow effect to head
      ctx.shadowColor = "#9945FF";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "#9945FF";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add eyes
      ctx.shadowBlur = 5;
      ctx.fillStyle = "#000";
      let leftEye, rightEye;
      
      // Position eyes based on direction
      if (direction === "RIGHT") {
        leftEye = { x: part.x + box - 6, y: part.y + 5 };
        rightEye = { x: part.x + box - 6, y: part.y + box - 8 };
      } else if (direction === "LEFT") {
        leftEye = { x: part.x + 4, y: part.y + 5 };
        rightEye = { x: part.x + 4, y: part.y + box - 8 };
      } else if (direction === "UP") {
        leftEye = { x: part.x + 5, y: part.y + 4 };
        rightEye = { x: part.x + box - 8, y: part.y + 4 };
      } else if (direction === "DOWN") {
        leftEye = { x: part.x + 5, y: part.y + box - 6 };
        rightEye = { x: part.x + box - 8, y: part.y + box - 6 };
      }
      
      // Draw eyes with glow
      ctx.beginPath();
      ctx.arc(leftEye.x, leftEye.y, 2, 0, Math.PI * 2);
      ctx.arc(rightEye.x, rightEye.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
    } else { // Body parts
      gradient.addColorStop(0, "#14F195");
      gradient.addColorStop(1, "#9945FF");
      
      // Draw body segments with slight transparency
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(part.x, part.y, box, box, 3);
      ctx.fill();
      
      // Add subtle glow to body
      ctx.shadowColor = "#14F195";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(20, 241, 149, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });

  // Draw the food (Solana logo) with glow effect
  ctx.shadowColor = "#14F195";
  ctx.shadowBlur = 20;
  ctx.drawImage(foodImage, food.x, food.y, box, box);
  ctx.shadowBlur = 0;

  // Move the snake
  const head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  // Check for collision with food
  if (head.x === food.x && head.y === food.y) {
    score++;
    // Update score display
    document.getElementById("current-score").textContent = `Score: ${score}`;
    food = {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box
    };
  } else {
    snake.pop();
  }

  // Check for collisions
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= canvas.width ||
    head.y >= canvas.height ||
    snake.some(part => part.x === head.x && part.y === head.y)
  ) {
    clearInterval(game); // Stop the game loop
    document.getElementById("game-over").classList.remove("hidden");
    return;
  }

  snake.unshift(head);
}
// Change Direction
document.addEventListener("keydown", event => {
  if (event.key === "a" && direction !== "RIGHT") direction = "LEFT";
  if (event.key === "w" && direction !== "DOWN") direction = "UP";
  if (event.key === "d" && direction !== "LEFT") direction = "RIGHT";
  if (event.key === "s" && direction !== "UP") direction = "DOWN";
});

// Fetch Leaderboard
function fetchLeaderboard() {
    const leaderboardRef = query(ref(db, "scores"), orderByChild("score"));
    
    get(leaderboardRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const leaderboard = [];
                snapshot.forEach(data => {
                    leaderboard.push(data.val());
                });
                
                leaderboard.sort((a, b) => b.score - a.score);
                const top10 = leaderboard.slice(0, 10);
                
                const leaderboardList = document.querySelector("#leaderboard ul");
                leaderboardList.innerHTML = "";
                top10.forEach((entry, index) => {
                    const li = document.createElement("li");
                    li.textContent = `#${index + 1} ${entry.name}: ${entry.score}`;
                    li.style.animation = "fadeIn 0.5s ease-in-out";
                    leaderboardList.appendChild(li);
                });
            } else {
                const leaderboardList = document.querySelector("#leaderboard ul");
                leaderboardList.innerHTML = "<li>No scores yet.</li>";
            }
        })
        .catch(error => {
            console.error("Error fetching leaderboard");
        });
}

function fetchSnakesOfTheMonth() {
    const snakesRef = ref(db, "snake-month");
    
    onValue(snakesRef, (snapshot) => {
        if (snapshot.exists()) {
            const snakesArray = [];
            snapshot.forEach((childSnapshot) => {
                snakesArray.push({
                    key: childSnapshot.key,
                    ...childSnapshot.val(),
                });
            });

            snakesArray.sort((a, b) => b.vote - a.vote);
            
            const snakesList = document.querySelector("#snakes-of-the-month ul");
            if (!snakesList) return;
            
            snakesList.innerHTML = "";
            snakesArray.forEach((snake) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <img src="${snake.image}" alt="${snake.name}" class="snake-image" />
                    <span>${snake.name} - ${snake.vote} votes</span>
                    <button data-snake="${snake.key}" class="vote-button">Vote</button>
                `;
                snakesList.appendChild(listItem);
            });
        }
    }, (error) => {
        console.error("Error fetching data");
    });
}

  

  
// Logic for voting a snake
function voteForSnake(snakeId) {
    // Check if the user has already voted (using localStorage)
    if (localStorage.getItem("hasVoted")) {
      alert("You have already voted!");
      console.log("Vote attempt rejected: already voted.");
      return; // Prevent further execution
    }
  
    // Reference the specific snake's vote count in Firebase
    const snakeRef = ref(db, `snake-month/${snakeId}/vote`);
  
    // Run the transaction to safely update the vote count
    runTransaction(snakeRef, (currentVotes) => {
      if (localStorage.getItem("hasVoted")) {
        console.log("Transaction aborted: User has already voted.");
        return; // Abort the transaction by returning undefined
      }
  
      console.log(`Current votes for ${snakeId}: ${currentVotes || 0}. Incrementing by 1.`);
      return (currentVotes || 0) + 1; // Increment vote count
    })
      .then((result) => {
        // Check if the transaction was committed
        if (!result.committed) {
          console.log("Transaction not committed: User has already voted.");
          return; // Prevent further processing
        }
  
        // Mark the user as having voted after a successful transaction
        localStorage.setItem("hasVoted", true);
        alert("Vote submitted successfully!");
        console.log(`Vote successfully updated for ${snakeId}. New vote count: ${result.snapshot.val()}`);
      })
      .catch((error) => {
        console.error("Error submitting vote:", error);
      });
  }
  
  
    

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("vote-button")) {
      const snakeKey = event.target.getAttribute("data-snake");
      console.log(`Vote button clicked for snake: ${snakeKey}`);
    
      // Check if the user has already voted
    if (localStorage.getItem("hasVoted")) {
        alert("You have already voted!");
        console.log("Vote attempt rejected: User has already voted.");
        return; // Exit to prevent further processing
      }

      
      voteForSnake(snakeKey);

      // Increment the vote count for the selected snake
      const snakeRef = ref(db, `snake-month/${snakeKey}/vote`);
      get(snakeRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const currentVotes = snapshot.val();
            const newVotes = currentVotes + 1;
            console.log(
              `Current votes for ${snakeKey}: ${currentVotes}. Incrementing to: ${newVotes}`
            );
            set(snakeRef, newVotes)
              .then(() =>
                console.log(`Vote successfully updated for ${snakeKey}`)
              )
              .catch((error) =>
                console.error(`Error updating vote for ${snakeKey}:`, error)
              );
          } else {
            console.error(`Snake ${snakeKey} not found in Firebase.`);
          }
        })
        .catch((error) =>
          console.error(`Error fetching current votes for ${snakeKey}:`, error)
        );
    }
  });
  
  
  
  
// Submit Score
document.getElementById("scoreForm").addEventListener("submit", event => {
    event.preventDefault();
  
    // Capture user inputs
    const playerName = document.getElementById("playerName").value.trim();
    const walletAddress = document.getElementById("walletAddress").value.trim();
  
    // Ensure player name is not empty
    if (!playerName) {
      alert("Player name is required!"); // Notify user if name is missing
      return;
    }
  
    // Prepare the data object
    const data = {
      name: playerName,
      score: score
    };
  
    // Add wallet address only if provided
    if (walletAddress) {
      data.wallet = walletAddress;
    }

    //Clean database
    function pruneLeaderboard() {
        console.log("Pruning leaderboard...");
      
        const scoresRef = ref(db, "scores");
        const queryRef = query(scoresRef, orderByChild("score"));
      
        get(queryRef)
          .then(snapshot => {
            if (snapshot.exists()) {
              console.log("Fetching all scores for pruning...");
              const scoresArray = [];
      
              snapshot.forEach(childSnapshot => {
                scoresArray.push({
                  key: childSnapshot.key, // Unique key for deletion
                  ...childSnapshot.val(), // Spread other data (name, wallet, etc.)
                });
              });
      
              // Sort scores in descending order by "score"
              scoresArray.sort((a, b) => b.score - a.score);
      
              console.log("Sorted scores (by 'score'):", scoresArray);
      
              // Keep only the top 20 scores
              const scoresToDelete = scoresArray.slice(10);
      
              console.log("Scores to delete:", scoresToDelete);
      
              // Delete scores from Firebase using Promise.all
              const deletePromises = scoresToDelete.map(score => {
                const deleteRef = ref(db, `scores/${score.key}`);
                return remove(deleteRef)
                  .then(() => console.log(`Deleted score: ${score.name} (${score.score})`))
                  .catch(error => console.error(`Error deleting score: ${error}`));
              });
      
              // Wait for all deletions to complete
              return Promise.all(deletePromises).then(() => {
                console.log("Pruning complete. Only top 20 scores retained.");
              });
            } else {
              console.log("No scores found to prune.");
            }
          })
          .catch(error => console.error("Error fetching scores for pruning:", error));
      }
      
      
  
    // Push data to Firebase
    push(ref(db, "scores"), data)
      .then(() => {
        console.log("Score submitted successfully.");
        fetchLeaderboard(); // Refresh leaderboard after successful submission
        pruneLeaderboard(); // Prune scores after submission
      })
      .catch(error => {
        console.error("Error submitting score:", error);
      });
  
    // Reset game after submission
    resetGame();
  });
  
  
// Restart Game Button
document.getElementById("restartGame").addEventListener("click", resetGame);

// Initialize Game
fetchLeaderboard();
game = setInterval(draw, 100);

// Initialize Snakes of the Month leaderboard
fetchSnakesOfTheMonth();

// Add particle system
const particles = [];

function drawParticles() {
    // Create new particles based on score
    if (Math.random() < backgroundIntensity * 0.3) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            size: Math.random() * 3 + 1,
            speedY: -(Math.random() * 2 + 1)
        });
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.y += particle.speedY;
        
        // Remove particles that are off screen
        if (particle.y < 0) {
            particles.splice(i, 1);
            continue;
        }

        // Draw particle
        ctx.fillStyle = `rgba(153, 69, 255, ${backgroundIntensity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
async function updateMarketCap() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/HGRvEZF83Hm2x5HoVx9ec2cBiAjTmWFHK6VCUPLH4yDY');
        const data = await response.json();
        
        if (data.pairs && data.pairs[0]) {
            const marketCap = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(data.pairs[0].marketCap);
            
            // Add price data as well
            const price = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 8,
                maximumFractionDigits: 8
            }).format(data.pairs[0].priceUsd);

            document.getElementById('marketcap-value').textContent = `${marketCap} | ${price}`;
        }
    } catch (error) {
        console.error('Error fetching marketcap:', error);
        document.getElementById('marketcap-value').textContent = 'Error';
    }
}

// Update initially and every 30 seconds
updateMarketCap();
setInterval(updateMarketCap, 30000);


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
  direction = null;
  gameStarted = false; // Reset the gameStarted flag
  game = null; // Reset the interval reference
}

// Draw Function (Unchanged, for reference)
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the snake
  snake.forEach((part, index) => {
    const gradient = ctx.createLinearGradient(part.x, part.y, part.x + box, part.y + box);
    if (index === 0) {
      gradient.addColorStop(0, "#9945FF");
      gradient.addColorStop(1, "#14F195");
    } else {
      gradient.addColorStop(0, "#14F195");
      gradient.addColorStop(1, "#9945FF");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(part.x, part.y, box, box);
  });

  // Draw the food
  ctx.drawImage(foodImage, food.x, food.y, box, box);

  // Move the snake
  const head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  // Check for collision with food
  if (head.x === food.x && head.y === food.y) {
    score++;
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
    console.log("Fetching leaderboard...");
  
    // Query Firebase for scores ordered by "score"
    const leaderboardRef = query(ref(db, "scores"), orderByChild("score"));
  
    get(leaderboardRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          console.log("Snapshot exists. Data fetched from Firebase:", snapshot.val());
  
          const leaderboard = [];
  
          // Push each entry into an array
          snapshot.forEach(data => {
            console.log("Fetched entry:", data.val()); // Debug: Log each entry
            leaderboard.push(data.val());
          });
  
          // Sort scores in descending order
          leaderboard.sort((a, b) => b.score - a.score);
          console.log("Sorted leaderboard:", leaderboard); // Debug: Log sorted leaderboard
  
          // Limit to top 10 scores
          const top10 = leaderboard.slice(0, 10);
          console.log("Top 10 leaderboard:", top10); // Debug: Log top 10 scores
  
          // Update the leaderboard UI
          const leaderboardList = document.querySelector("#leaderboard ul");
          leaderboardList.innerHTML = ""; // Clear old leaderboard
          top10.forEach((entry, index) => {
            const li = document.createElement("li");
            li.textContent = `#${index + 1} ${entry.name}: ${entry.score}`;
            li.style.animation = "fadeIn 0.5s ease-in-out";
            leaderboardList.appendChild(li);
            console.log(`Updated leaderboard item: #${index + 1} ${entry.name}: ${entry.score}`); // Debug: Log each updated item
          });
        } else {
          console.log("No data found in Firebase for scores."); // Debug: Log if no scores exist
          const leaderboardList = document.querySelector("#leaderboard ul");
          leaderboardList.innerHTML = "<li>No scores yet.</li>";
        }
      })
      .catch(error => {
        console.error("Error fetching leaderboard data:", error); // Debug: Log Firebase errors
      });
  }
  
  function fetchSnakesOfTheMonth() {
    console.log("Fetching Snakes of the Month...");
    const snakesRef = ref(db, "snake-month");
    
    onValue(snakesRef, (snapshot) => {
        if (snapshot.exists()) {
            console.log("Data fetched from Firebase (Snakes of the Month):", snapshot.val());
            const snakesArray = [];

            snapshot.forEach((childSnapshot) => {
                snakesArray.push({
                    key: childSnapshot.key,
                    ...childSnapshot.val(),
                });
            });

            // Sort snakes by votes in descending order
            snakesArray.sort((a, b) => b.vote - a.vote);
            console.log("Sorted Snakes of the Month:", snakesArray);

            // Update the UI
            const snakesList = document.querySelector("#snakes-of-the-month ul");
            if (!snakesList) {
                console.error("#snakes-of-the-month ul not found in the DOM.");
                return;
            }
            snakesList.innerHTML = ""; // Clear old list
            snakesArray.forEach((snake) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <img src="${snake.image}" alt="${snake.name}" class="snake-image" />
                    <span>${snake.name} - ${snake.vote} votes</span>
                    <button data-snake="${snake.key}" class="vote-button">Vote</button>
                `;
                snakesList.appendChild(listItem);
                console.log(`Added to UI: ${snake.name} with ${snake.vote} votes`);
            });
        } else {
            console.log("No data found in Firebase for Snakes of the Month.");
        }
    }, (error) => {
        console.error("Error fetching Snakes of the Month data:", error);
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
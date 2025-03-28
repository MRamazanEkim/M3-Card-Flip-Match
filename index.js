
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
// Game variables
let playerName = '';
let score = 0;
let timeLeft = 20; // Changed default to 20 seconds
let timeSpent = 0;
let timer;
let firstCard = null;
let secondCard = null;
let canFlip = true;
let matchedPairs = 0;
let totalPairs = 4; // Default is 8 cards (4 pairs)
let cardCount = 8; // Default card count
let highScores = []; // Store scores in memory instead of localStorage
let cardImages = JSON.parse(localStorage.getItem('cardImages')) || [];

// DOM elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameContainer = document.getElementById('game-container');
const playerNameInput = document.getElementById('player-name-input');
const startGameBtn = document.getElementById('start-game-btn');
const displayName = document.getElementById('display-name');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const gameBoard = document.getElementById('game-board');
const popupOverlay = document.getElementById('popup-overlay');
const gameOverPopup = document.getElementById('game-over-popup');
const finalPlayer = document.getElementById('final-player');
const finalScore = document.getElementById('final-score');
const finalTime = document.getElementById('final-time');
const scoresTableBody = document.getElementById('scores-table-body');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const cardOptions = document.querySelectorAll('.card-option');
const settingsOverlay = document.getElementById('settings-overlay');
const imageUpload = document.getElementById('image-upload');
const uploadedImagesGrid = document.getElementById('uploaded-images');
const onScreenKeyboard = document.getElementById('on-screen-keyboard');

// Card symbols (using emoji for simplicity)
const symbols = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🍑', '🥝', '🥥', '🍍', '🥭', '🍈'];

// Initialize the game
initGame();

// Toggle settings panel with CTRL key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Control') {
        e.preventDefault(); // Prevent default CTRL behavior
        const isVisible = settingsPanel.style.display === 'block';
        settingsPanel.style.display = isVisible ? 'none' : 'block';
        settingsOverlay.style.display = isVisible ? 'none' : 'block';
    }
});

// Close settings when clicking overlay
settingsOverlay.addEventListener('click', function() {
    settingsPanel.style.display = 'none';
    settingsOverlay.style.display = 'none';
});

// Handle card count selection
cardOptions.forEach(option => {
    option.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
        cardOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        cardCount = parseInt(this.dataset.cards);
        totalPairs = cardCount / 2;
        
        // If game is in progress, restart with new card count
        if (gameContainer.style.display === 'block') {
            startGame();
        }
    });
});

// Handle image upload
imageUpload.addEventListener('change', function(e) {
    const files = e.target.files;
    for (let file of files) {
        if (file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = function(event) {
                cardImages.push(event.target.result);
                localStorage.setItem('cardImages', JSON.stringify(cardImages));
                updateUploadedImagesGrid();
            };
            reader.readAsDataURL(file);
        }
    }
});

// Update uploaded images grid
function updateUploadedImagesGrid() {
    uploadedImagesGrid.innerHTML = '';
    cardImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'uploaded-image-item';
        
        const img = document.createElement('img');
        img.src = image;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image';
        removeButton.innerHTML = '×';
        removeButton.onclick = function(e) {
            e.stopPropagation();
            cardImages.splice(index, 1);
            localStorage.setItem('cardImages', JSON.stringify(cardImages));
            updateUploadedImagesGrid();
        };
        
        imageItem.appendChild(img);
        imageItem.appendChild(removeButton);
        uploadedImagesGrid.appendChild(imageItem);
    });
}

// Initialize uploaded images grid
updateUploadedImagesGrid();

// Handle input field click
playerNameInput.addEventListener('click', function() {
    onScreenKeyboard.style.display = 'block';
});

// Handle keyboard key clicks
document.querySelectorAll('.keyboard-key').forEach(key => {
    key.addEventListener('click', function() {
        const keyText = this.textContent;
        if (keyText === 'Sil') {
            playerNameInput.value = playerNameInput.value.slice(0, -1);
        } else if (keyText === 'Boşluk') {
            playerNameInput.value += ' ';
        } else if (keyText === 'Tamam') {
            onScreenKeyboard.style.display = 'none';
        } else if (keyText === 'Türkçe') {
            // Handle Turkish character toggle if needed
        } else {
            playerNameInput.value += keyText;
        }
    });
});

function initGame() {
    playerNameInput.value = '';
    updateHighScoresTable();
    startGameBtn.addEventListener('click', startGame);
    
    // Set initial card count from selected option
    const selectedOption = document.querySelector('.card-option.selected');
    if (selectedOption) {
        cardCount = parseInt(selectedOption.dataset.cards);
        totalPairs = cardCount / 2;
    }
}

// Start the game
function startGame() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Lütfen adınızı girin!');
        return;
    }
    
    // Start the game immediately
    welcomeScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    document.querySelector('.bottom-panel').style.display = 'flex';
    displayName.textContent = playerName;
    
    // Reset game state
    score = 0;
    timeLeft = parseInt(localStorage.getItem('gameTime')) || 20;
    timeSpent = 0;
    matchedPairs = 0;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    // Reset timer visual state
    const timerElement = document.querySelector('.timer');
    timerElement.classList.remove('warning', 'danger');
    
    popupOverlay.style.display = 'none';
    gameOverPopup.style.display = 'none';
    
    // Clear input field
    playerNameInput.value = '';
    
    // Create cards
    createGameBoard();
    
    // Show countdown overlay
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');
    countdownOverlay.style.display = 'flex';
    
    // Countdown sequence
    let count = 3;
    countdownText.textContent = count; // Show initial count
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = 'BAŞLA';
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.style.display = 'none';
            
            // Start timer after countdown
            clearInterval(timer);
            timer = setInterval(updateTimer, 1000);
        }
    }, 1000);
}

// Create the game board with cards
function createGameBoard() {
    gameBoard.innerHTML = '';
    
    // Set the data attribute for grid rows
    gameBoard.setAttribute('data-cards', cardCount);
    
    // Get available images or use default symbols
    let cardValues;
    if (cardImages.length >= totalPairs) {
        // Use uploaded images
        const selectedImages = shuffleArray([...cardImages]).slice(0, totalPairs);
        cardValues = [...selectedImages, ...selectedImages];
    } else {
        // Use default symbols if not enough images
        const neededSymbols = symbols.slice(0, totalPairs);
        cardValues = [...neededSymbols, ...neededSymbols];
    }
    
    // Shuffle the cards
    shuffleArray(cardValues);
    
    // Get card front image
    const cardFrontImage = localStorage.getItem('cardFrontImage');
    
    // Create card elements
    cardValues.forEach((value, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.cardValue = value;
        card.dataset.index = index;
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        if (cardFrontImage) {
            cardFront.style.backgroundImage = `url(${cardFrontImage})`;
            cardFront.style.backgroundSize = 'contain';
            cardFront.style.backgroundPosition = 'center';
            cardFront.style.backgroundRepeat = 'no-repeat';
        } else {
            cardFront.textContent = '?';
        }
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        if (value.startsWith('data:image')) {
            // If it's an image
            const img = document.createElement('img');
            img.src = value;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            cardBack.appendChild(img);
        } else {
            // If it's a symbol
            cardBack.textContent = value;
        }
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Handle card flip
function flipCard() {
    if (!canFlip || this.classList.contains('flipped') || this === firstCard) {
        return;
    }
    
    this.classList.add('flipped');
    
    if (!firstCard) {
        // First card flipped
        firstCard = this;
        return;
    }
    
    // Second card flipped
    secondCard = this;
    canFlip = false;
    
    // Check for match
    checkForMatch();
}

// Check if the two flipped cards match
function checkForMatch() {
    const isMatch = firstCard.dataset.cardValue === secondCard.dataset.cardValue;
    
    if (isMatch) {
        // Handle match
        disableCards();
        matchedPairs++;
        
        // Create and animate score text
        const scoreText = document.createElement('div');
        scoreText.className = 'score-animation';
        scoreText.textContent = '+10';
        
        // Position the text in the center of the screen
        scoreText.style.left = '50%';
        scoreText.style.top = '50%';
        scoreText.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(scoreText);
        
        // Remove the element after animation
        setTimeout(() => {
            scoreText.remove();
        }, 1000);
        
        // Update score after a short delay
        setTimeout(() => {
            score += 10;
            scoreDisplay.textContent = score;
        }, 500);
        
        // Check if game is complete
        if (matchedPairs === totalPairs) {
            clearInterval(timer);
            setTimeout(showGameOver, 500);
        }
    } else {
        // Not a match, add shake animation and flip cards back
        firstCard.classList.add('shake');
        secondCard.classList.add('shake');
        unflipCards();
    }
}

// Disable matched cards
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    resetCardState();
}

// Unflip non-matching cards
function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        firstCard.classList.remove('shake');
        secondCard.classList.remove('shake');
        resetCardState();
    }, 1000);
}

// Reset card selection state
function resetCardState() {
    [firstCard, secondCard] = [null, null];
    canFlip = true;
}

// Update the timer
function updateTimer() {
    timeLeft--;
    timeSpent++;
    timerDisplay.textContent = timeLeft; // Show countdown
    
    // Add warning and danger states
    const timerElement = document.querySelector('.timer');
    if (timeLeft <= 10) {
        timerElement.classList.add('danger');
    } else if (timeLeft <= 20) {
        timerElement.classList.add('warning');
    }
    
    if (timeLeft <= 0) {
        clearInterval(timer);
        showGameOver();
    }
}

// Show game over popup
function showGameOver() {
    // Update popup with details
    finalPlayer.textContent = playerName;
    finalScore.textContent = score;
    finalTime.textContent = timeSpent; // Show total time spent in scoreboard
    
    // Show popup and overlay
    popupOverlay.style.display = 'block';
    gameOverPopup.style.display = 'block';
    
    // Save score
    saveScore();
    
    // Update high scores table
    updateHighScoresTable();
    
    // Set timeout to return to welcome screen
    setTimeout(returnToWelcome, 4000);
}

// Return to welcome screen
function returnToWelcome() {
    // Hide popup and game
    popupOverlay.style.display = 'none';
    gameOverPopup.style.display = 'none';
    gameContainer.style.display = 'none';
    document.querySelector('.bottom-panel').style.display = 'none';
    
    // Show welcome screen
    welcomeScreen.style.display = 'block';
}

// Save score to memory
function saveScore() {
    const newScore = {
        name: playerName,
        score: score,
        time: timeSpent
    };
    
    highScores.push(newScore);
    // Sort by score first, then by time (lower time is better)
    highScores.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.time - b.time;
    });
    highScores = highScores.slice(0, 10); // Keep only top 10 scores
}

// Update high scores table
function updateHighScoresTable() {
    scoresTableBody.innerHTML = '';
    
    highScores.forEach((scoreData, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = scoreData.name;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = scoreData.score;
        
        const timeCell = document.createElement('td');
        timeCell.textContent = `${scoreData.time}s`;
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        row.appendChild(timeCell);
        
        scoresTableBody.appendChild(row);
    });
}

// Background settings
const backgroundPreview = document.getElementById('background-preview');
const addBackgroundBtn = document.getElementById('add-background-btn');
const changeBackgroundBtn = document.getElementById('change-background-btn');
const deleteBackgroundBtn = document.getElementById('delete-background-btn');
const backgroundColorPicker = document.getElementById('background-color');

// Load saved background
const savedBackground = localStorage.getItem('backgroundImage');
const savedBackgroundColor = localStorage.getItem('backgroundColor') || '#f0f8ff';

if (savedBackground) {
    backgroundPreview.style.backgroundImage = `url(${savedBackground})`;
} else {
    backgroundPreview.style.backgroundColor = savedBackgroundColor;
}

document.body.style.backgroundColor = savedBackgroundColor;

// Handle background image upload
addBackgroundBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('backgroundImage', imageUrl);
                backgroundPreview.style.backgroundImage = `url(${imageUrl})`;
                document.body.style.backgroundImage = `url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle background image change
changeBackgroundBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('backgroundImage', imageUrl);
                backgroundPreview.style.backgroundImage = `url(${imageUrl})`;
                document.body.style.backgroundImage = `url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle background image deletion
deleteBackgroundBtn.addEventListener('click', function() {
    localStorage.removeItem('backgroundImage');
    backgroundPreview.style.backgroundImage = 'none';
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = backgroundColorPicker.value;
});

// Handle background color change
backgroundColorPicker.addEventListener('input', function() {
    const color = this.value;
    localStorage.setItem('backgroundColor', color);
    if (!localStorage.getItem('backgroundImage')) {
        document.body.style.backgroundColor = color;
        backgroundPreview.style.backgroundColor = color;
    }
});

// Card front image settings
const cardFrontPreview = document.getElementById('card-front-preview');
const addCardFrontBtn = document.getElementById('add-card-front-btn');
const changeCardFrontBtn = document.getElementById('change-card-front-btn');
const deleteCardFrontBtn = document.getElementById('delete-card-front-btn');

// Logo settings
const logoPreview = document.getElementById('logo-preview');
const addLogoBtn = document.getElementById('add-logo-btn');
const changeLogoBtn = document.getElementById('change-logo-btn');
const deleteLogoBtn = document.getElementById('delete-logo-btn');
const logoImg = document.querySelector('.logo');

// Load saved logo
const savedLogo = localStorage.getItem('bottomPanelLogo');
if (savedLogo) {
    logoPreview.style.backgroundImage = `url(${savedLogo})`;
    logoImg.src = savedLogo;
}

// Handle logo upload
addLogoBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('bottomPanelLogo', imageUrl);
                logoPreview.style.backgroundImage = `url(${imageUrl})`;
                logoImg.src = imageUrl;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle logo change
changeLogoBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('bottomPanelLogo', imageUrl);
                logoPreview.style.backgroundImage = `url(${imageUrl})`;
                logoImg.src = imageUrl;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle logo deletion
deleteLogoBtn.addEventListener('click', function() {
    localStorage.removeItem('bottomPanelLogo');
    logoPreview.style.backgroundImage = 'none';
    logoImg.src = 'logo.png'; // Reset to default logo
});

// Load saved card front image
const savedCardFront = localStorage.getItem('cardFrontImage');
if (savedCardFront) {
    cardFrontPreview.style.backgroundImage = `url(${savedCardFront})`;
}

// Handle card front image upload
addCardFrontBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('cardFrontImage', imageUrl);
                cardFrontPreview.style.backgroundImage = `url(${imageUrl})`;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle card front image change
changeCardFrontBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                localStorage.setItem('cardFrontImage', imageUrl);
                cardFrontPreview.style.backgroundImage = `url(${imageUrl})`;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Handle card front image deletion
deleteCardFrontBtn.addEventListener('click', function() {
    localStorage.removeItem('cardFrontImage');
    cardFrontPreview.style.backgroundImage = 'none';
});

// Time settings
const timeDisplay = document.getElementById('time-display');
const decreaseTimeBtn = document.getElementById('decrease-time');
const increaseTimeBtn = document.getElementById('increase-time');

// Load saved time
const savedTime = localStorage.getItem('gameTime') || '60';
timeDisplay.textContent = savedTime;
timeLeft = parseInt(savedTime);

// Handle time adjustment
decreaseTimeBtn.addEventListener('click', function() {
    const currentTime = parseInt(timeDisplay.textContent);
    if (currentTime > 20) {
        const newTime = currentTime - 10;
        timeDisplay.textContent = newTime;
        localStorage.setItem('gameTime', newTime);
        timeLeft = newTime;
    }
});

increaseTimeBtn.addEventListener('click', function() {
    const currentTime = parseInt(timeDisplay.textContent);
    if (currentTime < 60) {
        const newTime = currentTime + 10;
        timeDisplay.textContent = newTime;
        localStorage.setItem('gameTime', newTime);
        timeLeft = newTime;
    }
});
});
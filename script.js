// Estado da aplicação
let currentStep = 0;
let selectedMovie = null;
let selectedTime = null;
let selectedLocation = null;
let selectedSeats = [];

// Dados dos filmes - serão carregados do movies.json
let movies = {};

// Função para obter a imagem do streaming
function getStreamingImage(streamingName) {
    const streamingMap = {
        'Netflix': 'streamings-images/netflix.jpg',
        'Disney+': 'streamings-images/disney.jpg'
    };
    
    return streamingMap[streamingName] || null;
}

// Função para carregar filmes do JSON
async function loadMovies() {
    try {
        const response = await fetch('./movies.json');
        const moviesData = await response.json();
        
        // Converter para o formato esperado
        movies = {};
        let index = 1;
        
        for (const [key, movieData] of Object.entries(moviesData)) {
            movies[index] = {
                id: key,
                title: movieData.titulo,
                genre: movieData.tipo,
                description: `${movieData.duracao} • ⭐ ${movieData.avaliacao}/10 • ${movieData.ano}`,
                price: 49.90,
                poster: movieData.poster,
                imdb: movieData.imdb,
                certificacao: movieData['certificacao-idade'],
                year: movieData.ano,
                duration: movieData.duracao,
                rating: movieData.avaliacao,
                streaming: movieData.streaming
            };
            index++;
        }
        
        console.log('Filmes carregados:', movies);
        
        // Depois de carregar os filmes, configurar a seleção
        setupMovieSelection();
        
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        
        // Fallback para dados estáticos
        movies = {
            1: {
                title: "Aventura Mágica",
                genre: "Fantasia • 2h 15min",
                description: "Uma jornada épica através de mundos fantásticos!",
                price: 49.90
            },
            2: {
                title: "Romance na Cidade",
                genre: "Romance • 1h 45min", 
                description: "Uma história de amor inesquecível!",
                price: 49.90
            },
            3: {
                title: "Missão Espacial",
                genre: "Ficção Científica • 2h 30min",
                description: "Uma aventura intergaláctica emocionante!",
                price: 49.90
            }
        };
        
        setupMovieSelection();
    }
}

// Dados dos locais
const locations = {
    dani: {
        name: "Casa da Dani",
        seats: [
            { id: "Dani", label: "Vaga da Dani", available: true },
            { id: "Acompanhante", label: "Acompanhante", available: true },
            { id: "Gato", label: "Acompanhante Felino", available: true, icon: "🐱" }
        ]
    }
};

// Elementos DOM
const sections = document.querySelectorAll('.section');
const backBtn = document.getElementById('back-btn');
const confirmBtn = document.getElementById('confirm-btn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadMovies().then(() => {
        initializeApp();
    });
});

function initializeApp() {
    // setupMovieSelection(); // Já será chamado após carregar os filmes
    setupLocationAndTimeSelection();
    setupNavigation();
    initializeSeatSelection();
    setupSeatCheckboxes();
    updateNavigationButtons();
}

// === SELEÇÃO DE FILMES ===
function setupMovieSelection() {
    const moviesContainer = document.querySelector('.movies-grid');
    
    if (!moviesContainer) {
        console.error('Container de filmes não encontrado');
        return;
    }
    
    // Limpar container
    moviesContainer.innerHTML = '';
    
    // Gerar cartões dos filmes
    Object.entries(movies).forEach(([index, movie]) => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.movie = index;
        
        const streamingImage = getStreamingImage(movie.streaming);
        
        movieCard.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster || 'https://via.placeholder.com/400x600?text=' + encodeURIComponent(movie.title)}" 
                     alt="${movie.title}" 
                     onerror="this.src='https://via.placeholder.com/400x600?text=' + encodeURIComponent('${movie.title}')">
                ${movie.certificacao ? `<span class="age-rating">${movie.certificacao}+</span>` : ''}
                ${streamingImage ? `<div class="streaming-badge"><img src="${streamingImage}" alt="${movie.streaming}" title="Disponível no ${movie.streaming}"></div>` : ''}
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p class="movie-genre">${movie.genre}</p>
                <p class="movie-description">${movie.description}</p>
            </div>
        `;
        
        // Adicionar evento de clique
        movieCard.addEventListener('click', function() {
            // Remove seleção anterior
            document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('selected'));
            
            // Adiciona seleção atual
            this.classList.add('selected');
            
            // Armazena filme selecionado
            selectedMovie = parseInt(this.dataset.movie);
            
            // Adiciona efeito de sucesso
            this.style.transform = 'scale(1.05)';
            
            // Avança automaticamente para a próxima página após animação
            setTimeout(() => {
                this.style.transform = '';
                updateMovieSelectionInfo();
                currentStep = 1;
                showCurrentStep();
                updateNavigationButtons();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
        });
        
        moviesContainer.appendChild(movieCard);
    });
}

// === SELEÇÃO DE LOCAIS, HORÁRIOS E VAGAS ===
// Função para configurar a seleção de local
function setupLocationAndTimeSelection() {
    // Selecionar automaticamente o horário "Agora"
    const agoraSlot = document.querySelector('.time-slot.available-now');
    if (agoraSlot) {
        agoraSlot.classList.add('selected');
        selectedTime = 'Agora';
    }
    
    // Configurar clique nos cartões de localização
    const locationCards = document.querySelectorAll('.location-card.available');
    const seatSelectionSection = document.querySelector('.seat-selection-section');
    
    locationCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remover seleção anterior
            document.querySelectorAll('.location-card').forEach(c => c.classList.remove('selected'));
            
            // Adicionar seleção ao cartão clicado
            this.classList.add('selected');
            
            // Armazenar local selecionado
            selectedLocation = this.dataset.location || 'dani';
            
            // Mostrar seleção de vagas
            if (seatSelectionSection) {
                seatSelectionSection.style.display = 'block';
                // Pequeno delay para garantir que o elemento está visível antes do scroll
                setTimeout(() => {
                    // Obter a posição real do elemento após estar visível
                    const rect = seatSelectionSection.getBoundingClientRect();
                    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const elementTop = rect.top + currentScrollTop;
                    const offset = 80; // Offset para dar um espaço do topo
                    
                    console.log('Debug scroll:', {
                        currentScrollTop,
                        rectTop: rect.top,
                        elementTop,
                        scrollTarget: elementTop - offset
                    });
                    
                    // Verificar se precisa rolar para baixo (elemento está abaixo da viewport)
                    if (rect.top > window.innerHeight || rect.top < 0) {
                        window.scrollTo({
                            top: elementTop - offset,
                            behavior: 'smooth'
                        });
                    } else {
                        // Se já está visível, apenas um pequeno ajuste
                        window.scrollTo({
                            top: currentScrollTop + rect.top - offset,
                            behavior: 'smooth'
                        });
                    }
                }, 150);
            }
            
            console.log('Local selecionado:', this.querySelector('.location-info h4').textContent);
            updateNavigationButtons();
        });
    });
}

// Função para verificar vagas selecionadas
function checkSelectedSeats() {
    const selectedCheckboxes = document.querySelectorAll('.seat-option input[type="checkbox"]:checked');
    
    // Atualizar array de vagas selecionadas
    selectedSeats = [];
    selectedCheckboxes.forEach(checkbox => {
        selectedSeats.push(checkbox.value);
    });
    
    // Atualizar informações do resumo
    updateSelectedSeatsInfo();
    
    // Atualizar botão de navegação
    updateNavigationButtons();
    
    console.log('Vagas selecionadas:', selectedSeats);
}

// Função para atualizar informações das vagas selecionadas
function updateSelectedSeatsInfo() {
    const seatsList = document.getElementById('selected-seats-list');
    const originalPrice = document.getElementById('original-price');
    const totalPrice = document.getElementById('total-price');
    
    if (!seatsList || !originalPrice || !totalPrice) {
        console.warn('Elementos do resumo não encontrados');
        return;
    }
    
    if (selectedSeats.length === 0) {
        seatsList.textContent = 'Nenhuma';
        originalPrice.textContent = 'R$ 0,00';
        totalPrice.textContent = 'R$ 0,00';
    } else {
        const seatLabels = selectedSeats.map(seatId => {
            switch(seatId) {
                case 'Dani': return 'Vaga da Dani';
                case 'Gato': return 'Vaga do Willow';
                default: return seatId;
            }
        });
        
        seatsList.textContent = seatLabels.join(', ');
        
        if (selectedMovie && movies[selectedMovie]) {
            const price = movies[selectedMovie].price * selectedSeats.length;
            originalPrice.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
        } else {
            originalPrice.textContent = `R$ ${(49.90 * selectedSeats.length).toFixed(2).replace('.', ',')}`;
        }
        
        totalPrice.textContent = 'R$ 0,00'; // Desconto de 100%
    }
}

// Inicialização da seleção de vagas
function initializeSeatSelection() {
    const seatOptions = document.querySelectorAll('.seat-option');
    
    seatOptions.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        
        // Evento de clique no card da vaga
        option.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                this.classList.add('selected');
            } else {
                this.classList.remove('selected');
            }
            
            checkSelectedSeats();
        });
        
        // Evento de mudança no checkbox
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
            
            checkSelectedSeats();
        });
    });
}

// Função para gerenciar seleção de assentos (manter para compatibilidade)
function setupSeatSelection() {
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
        seat.addEventListener('click', function() {
            if (!this.classList.contains('occupied-seat')) {
                this.classList.toggle('selected');
                updateNavigationButtons();
            }
        });
    });
}

function setupTimeSelection() {
    const timeSlots = document.querySelectorAll('.time-slot');
    
    timeSlots.forEach(slot => {
        if (slot.classList.contains('available-now')) {
            slot.addEventListener('click', function() {
                // Remove seleção anterior
                timeSlots.forEach(s => s.classList.remove('selected'));
                
                // Adiciona seleção atual
                this.classList.add('selected');
                
                // Armazena horário selecionado
                selectedTime = this.dataset.time;
                
                // Atualiza botão próximo
                updateNavigationButtons();
            });
        }
    });
}

function setupLocationSelection() {
    const houseSection = document.querySelector('.house-section.available');
    
    if (houseSection) {
        houseSection.addEventListener('click', function() {
            if (!this.classList.contains('selected')) {
                this.classList.add('selected');
                selectedLocation = this.dataset.location;
                
                updateNavigationButtons();
            }
        });
    }
}

function setupSeatCheckboxes() {
    const seatCheckboxes = document.querySelectorAll('input[name="seat"]');
    
    seatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const seatValue = this.value;
            
            if (this.checked) {
                if (!selectedSeats.includes(seatValue)) {
                    selectedSeats.push(seatValue);
                }
            } else {
                selectedSeats = selectedSeats.filter(seat => seat !== seatValue);
            }
            
            updateSelectedSeatsInfo();
            updateNavigationButtons();
        });
    });
}

function updateSelectedSeatsInfo() {
    const seatsList = document.getElementById('selected-seats-list');
    const originalPrice = document.getElementById('original-price');
    const totalPrice = document.getElementById('total-price');
    
    if (selectedSeats.length === 0) {
        seatsList.textContent = 'Nenhuma';
        originalPrice.textContent = 'R$ 0,00';
        totalPrice.textContent = 'R$ 0,00';
    } else {
        const seatLabels = selectedSeats.map(seatId => {
            switch(seatId) {
                case 'Dani': return 'Vaga da Dani';
                case 'Gato': return 'Vaga do Willow';
                default: return seatId;
            }
        });
        
        seatsList.textContent = seatLabels.join(', ');
        const price = movies[selectedMovie].price * selectedSeats.length;
        originalPrice.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
        totalPrice.textContent = 'R$ 0,00'; // Desconto de 100%
    }
}

// === NAVEGAÇÃO ===
function setupNavigation() {
    backBtn.addEventListener('click', goToPreviousStep);
    confirmBtn.addEventListener('click', goToNextStep);
}

function goToPreviousStep() {
    if (currentStep > 0) {
        currentStep--;
        showCurrentStep();
        updateNavigationButtons();
    }
}

function goToNextStep() {
    if (canProceedToNextStep()) {
        if (currentStep === 0) {
            updateMovieSelectionInfo();
        } else if (currentStep === 1) {
            processReservation();
        }
        
        currentStep++;
        showCurrentStep();
        updateNavigationButtons();
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showCurrentStep() {
    sections.forEach((section, index) => {
        section.classList.toggle('active', index === currentStep);
    });
}

function canProceedToNextStep() {
    switch (currentStep) {
        case 0: // Seleção de filme (avança automaticamente)
            return selectedMovie !== null;
        case 1: // Seleção de local, horário e vagas
            const hasLocationSelected = document.querySelector('.location-card.selected') !== null;
            const hasTimeSelected = selectedTime !== null || document.querySelector('.time-slot.available-now.selected') !== null;
            const hasSeatsSelected = selectedSeats.length > 0;
            
            // Para simplificar, vamos considerar que sempre temos horário "Agora" selecionado automaticamente
            if (!hasTimeSelected) {
                const agoraSlot = document.querySelector('.time-slot.available-now');
                if (agoraSlot) {
                    agoraSlot.classList.add('selected');
                    selectedTime = 'Agora';
                }
            }
            
            return hasLocationSelected && hasSeatsSelected;
        case 2: // Confirmação
            return false; // Não há próximo passo
        default:
            return false;
    }
}

function updateNavigationButtons() {
    // Botão voltar - visível apenas após a primeira página
    if (currentStep === 0) {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'flex';
    }
    
    // Botão confirmar - visível apenas na página de seleção
    if (currentStep === 1) {
        confirmBtn.style.display = 'inline-flex';
        const canProceed = canProceedToNextStep();
        confirmBtn.disabled = !canProceed;
    } else {
        confirmBtn.style.display = 'none';
    }
}

// === ATUALIZAÇÃO DE INFORMAÇÕES ===
function updateMovieSelectionInfo() {
    const movieTitle = document.getElementById('selected-movie-title');
    const movieGenre = document.getElementById('selected-movie-genre');
    const movieStreaming = document.getElementById('selected-movie-streaming');
    
    movieTitle.textContent = movies[selectedMovie].title;
    movieGenre.textContent = movies[selectedMovie].genre;
    
    if (movies[selectedMovie].streaming) {
        movieStreaming.innerHTML = `📺 Disponível no <strong>${movies[selectedMovie].streaming}</strong>`;
        movieStreaming.style.display = 'block';
    } else {
        movieStreaming.style.display = 'none';
    }
}

// === PROCESSAMENTO DA RESERVA ===
function processReservation() {
    // Simula processamento
    showNotification('Processando reserva...', 'info');
    
    setTimeout(() => {
        generateTicket();
        showNotification('Reserva confirmada! 🎉', 'success');
        startCelebration();
    }, 1500);
}

function generateTicket() {
    const ticket = document.getElementById('digital-ticket');
    const ticketNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const seatLabels = selectedSeats.map(seatId => {
        switch(seatId) {
            case 'Dani': return 'Vaga da Dani';
            case 'Gato': return 'Vaga do Willow';
            default: return seatId;
        }
    });
    
    ticket.innerHTML = `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 15px;">🎫 RESERVA CINEMENDES</h3>
            <div style="font-size: 0.9rem; line-height: 1.6;">
                <strong>CINEMA EM CASA</strong><br>
                Reserva: ${ticketNumber}<br><br>
                <strong>Filme:</strong> ${movies[selectedMovie].title}<br>
                <strong>Streaming:</strong> ${movies[selectedMovie].streaming || 'N/A'}<br>
                <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}<br>
                <strong>Horário:</strong> ${selectedTime}<br>
                <strong>Local:</strong> Casa da Dani<br>
                <strong>Vagas:</strong> ${seatLabels.join(', ')}<br><br>
                <strong>💝 PROMOÇÃO ESPECIAL PARA ANIVERSARIANTES!</strong><br>
                <strong>Valor pago: R$ 0,00</strong><br>
                <small>(Desconto de 100% aplicado)</small>
            </div>
        </div>
    `;
}

// === UTILIDADES ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(45deg, #ed8936, #dd6b20)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #e53e3e, #c53030)';
            break;
        default:
            notification.style.background = 'linear-gradient(45deg, #4299e1, #3182ce)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function startCelebration() {
    // Adiciona confetes (emoji como confetes)
    const confettiEmojis = ['🎉', '🎊', '🍿', '🎬', '⭐', '🎭'];
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createConfetti(confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]);
        }, i * 100);
    }
}

function createConfetti(emoji) {
    const confetti = document.createElement('div');
    confetti.textContent = emoji;
    confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}vw;
        font-size: 2rem;
        pointer-events: none;
        z-index: 1000;
        animation: fall 3s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// CSS para animações (adicionado dinamicamente)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// === EASTER EGGS ===
// Konami Code para easter egg
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        showNotification('🎮 Código Konami ativado! Desconto já era de 100%! 😄', 'success');
        startCelebration();
    }
});

// Click no logo para easter egg
document.querySelector('.logo').addEventListener('click', function() {
    this.style.animation = 'bounce 1s ease';
    showNotification('🎬 CineMendes - Cinema especial para Aniversariantes!', 'info');
    setTimeout(() => {
        this.style.animation = '';
    }, 1000);
});

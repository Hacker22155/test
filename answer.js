// Speech Recognition Setup
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
} else {
    console.error("Sorry, Speech Recognition is not supported in your browser.");
    document.querySelector(".error").style.display = "block";
    document.querySelector(".start").style.display = "none";
}

recognition.continuous = true;

recognition.onresult = event => {
    const speechToText = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log(`You said: ${speechToText}`);
    document.querySelector(".command").innerHTML = speechToText;

    // Process the command
    handleCommands(speechToText);
};

// UI Elements
const start = document.querySelector(".start"),
    main = document.querySelector(".container"),
    icon = document.querySelector(".fa-microphone");

start.addEventListener("click", function () {
    main.style.display = "flex";
    this.style.display = "none";
    recognition.start();
});

// Load questions and answers from JSON file
async function loadQuestionsAndAnswers() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
}

// Handle Commands
async function handleCommands(text) {
    const data = await loadQuestionsAndAnswers();

    // Remove unnecessary words and filter out only the core question
    text = text.replace(/please|tell me|calculate|answer quickly|what is|the|is|by|pls|what|how|say/gi, "").trim().toLowerCase();

    // Loop through the questions and check if the text includes any of the triggers
    for (let trigger in data) {
        if (text.includes(trigger)) {
            speak(data[trigger]);  // Speak the associated answer
            return;
        }
    }

    // Handle specific commands for time and date
    if (text.includes("what's the time") || text.includes("what is the time")) {
        speak(currentTime()); // Call currentTime function
    } 
    else if (text.includes("what's the date") || text.includes("what is the date")) {
        speak(currentDate()); // Call currentDate function
    }

    // Handle calculator commands
    if (text.match(/[\dx+\-*/]/)) {
        calculate(text);
    } else {
        speak("Sorry, I can't recognize that.");
    }
}

// Speak Function (Ensure Female Voice)
function speak(text) {
    recognition.stop();
    let msg = new SpeechSynthesisUtterance(text);

    // Ensure female voice is used
    let voices = window.speechSynthesis.getVoices();
    let femaleVoice = voices.find(voice => voice.name.toLowerCase().includes("female"));

    // Wait for voices to be loaded if not available immediately
    if (voices.length === 0) {
        setTimeout(() => speak(text), 100);
        return;
    }

    if (femaleVoice) {
        msg.voice = femaleVoice; // Set voice to a female voice
    } else {
        console.warn("Female voice not found, defaulting to system voice.");
    }

    msg.onend = () => recognition.start();
    window.speechSynthesis.speak(msg);
}

// Math Calculation Function
function calculate(text) {
    // Convert number words to digits
    const numberWords = {
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
    };

    for (let word in numberWords) {
        let regex = new RegExp(`\\b${word}\\b`, "gi");
        text = text.replace(regex, numberWords[word]);
    }

    // Convert operation words to symbols
    text = text.replace(/plus/gi, "+")
               .replace(/minus/gi, "-")
               .replace(/times|multiply/gi, "*")
               .replace(/divide/gi, "/")
               .replace(/x/gi, "*"); // Convert 'x' to '*' 

    try {
        let result = Function(`"use strict"; return (${text})`)(); // Secure eval
        speak(`${text} equals ${result}`);
    } catch (error) {
        speak("Sorry, I couldn't calculate that. Please try again.");
    }
}

// Get Current Time (Bangladesh 12-hour format with AM/PM)
function currentTime() {
    let date = new Date();
    let options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dhaka'  // Bangladesh time zone
    };
    let time = new Intl.DateTimeFormat('en-GB', options).format(date);
    return `It's ${time}`;
}

// Get Current Date (Bangladesh Format: DD/MM/YYYY)
function currentDate() {
    let date = new Date();
    let options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Dhaka'  // Bangladesh time zone
    };
    let dateStr = new Intl.DateTimeFormat('en-GB', options).format(date);
    return `Today's date is ${dateStr}`;
}

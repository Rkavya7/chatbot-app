import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import "./App.css";

// ✅ CLEAN TEXT FUNCTION
function cleanText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function App() {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef(null);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // LOAD CHAT
  useEffect(() => {
    const saved = localStorage.getItem("chat");
    if (saved) setChat(JSON.parse(saved));
  }, []);

  // SAVE CHAT + SCROLL
  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(chat));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // CLOSE EMOJI PICKER
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".emoji-picker") &&
        !e.target.closest(".emoji-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = {
      sender: "User",
      text: message,
      time: getTime(),
    };

    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      const botMsg = {
        sender: "Bot",
        text: cleanText(data.reply), // ✅ CLEANED HERE
        time: getTime(),
      };

      setChat((prev) => [...prev, botMsg]);

    } catch {
      setChat((prev) => [
        ...prev,
        {
          sender: "Bot",
          text: "Something went wrong, please try again.",
          time: getTime(),
        },
      ]);
    }

    setIsTyping(false);
  };

  // EMOJI
  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // VOICE
  const startListening = () => {
    const recognition =
      new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setMessage((prev) => prev + speechText);
    };

    recognition.start();
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>

      <div className="header">
        Chatbot
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="chat">
        {chat.map((msg, i) => (
          <div key={i} className={`row ${msg.sender === "User" ? "user" : "bot"}`}>
            <div className="bubble">
              <div style={{ whiteSpace: "pre-line" }}>
                {msg.text}
              </div>
              <span className="time">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="row bot">
            <div className="bubble typing">Bot is typing...</div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input">

        <button
          className="emoji-btn"
          onClick={() => setShowEmojiPicker((v) => !v)}
        >
          😊
        </button>

        <button onClick={startListening}>🎤</button>

        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
        />

        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}

export default App;
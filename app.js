const API_URL =
  "https://script.google.com/macros/s/AKfycbwsFKdn6NIFTbfYKW-AsdgjJX0uPK7KfpHaEAq8wilOis4ZX1prZW-X6qPBrP1p7AQp/exec";


let currentUser = null;

let isSending = false;


/* =========================
   ELEMENT
========================= */

const loginScreen =
  document.getElementById("loginScreen");

const chatApp =
  document.getElementById("chatApp");

const nameInput =
  document.getElementById("nameInput");

const loginButton =
  document.getElementById("loginButton");

const logoutButton =
  document.getElementById("logoutButton");

const currentUserElement =
  document.getElementById("currentUser");

const messagesContainer =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* =========================
   INIT
========================= */

function init() {

  const savedUser =
    localStorage.getItem("chat_user");


  if (savedUser) {

    try {

      currentUser =
        JSON.parse(savedUser);

      showChat();

    } catch (error) {

      localStorage.removeItem(
        "chat_user"
      );

    }

  }

}


function showChat() {

  loginScreen.classList.add(
    "hidden"
  );

  chatApp.classList.remove(
    "hidden"
  );


  currentUserElement.textContent =
    "Login sebagai " +
    currentUser.name;


  loadMessages(true);


  setTimeout(() => {

    messageInput.focus();

  }, 100);

}


/* =========================
   LOGIN
========================= */

function login() {

  const name =
    nameInput.value.trim();


  if (!name) {

    alert(
      "Masukkan nama terlebih dahulu."
    );

    nameInput.focus();

    return;

  }


  currentUser = {

    id:
      "USER_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 100000
      ),

    name: name

  };


  localStorage.setItem(
    "chat_user",
    JSON.stringify(currentUser)
  );


  showChat();

}


/* =========================
   LOGOUT
========================= */

function logout() {

  const confirmLogout =
    confirm(
      "Keluar dari chat?"
    );


  if (!confirmLogout) {
    return;
  }


  localStorage.removeItem(
    "chat_user"
  );


  currentUser = null;


  chatApp.classList.add(
    "hidden"
  );


  loginScreen.classList.remove(
    "hidden"
  );


  nameInput.value = "";

  messagesContainer.innerHTML = "";


  nameInput.focus();

}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages(
  scrollToBottom = false
) {

  if (!currentUser) {
    return;
  }


  try {

    const response =
      await fetch(
        API_URL +
        "?action=getMessages&t=" +
        Date.now()
      );


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      console.error(
        "API error:",
        data.message
      );

      return;

    }


    renderMessages(
      data.messages || [],
      scrollToBottom
    );


  } catch (error) {

    console.error(
      "Gagal mengambil pesan:",
      error
    );

  }

}


/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(
  messages,
  forceScroll = false
) {

  const nearBottom =
    messagesContainer.scrollHeight -
    messagesContainer.scrollTop -
    messagesContainer.clientHeight
    < 120;


  messagesContainer.innerHTML = "";


  if (messages.length === 0) {

    messagesContainer.innerHTML =
      `
        <div class="empty-chat">
          Belum ada pesan.<br>
          Jadilah orang pertama yang mengirim pesan 👋
        </div>
      `;

    return;

  }


  messages.forEach(message => {

    const mine =
      String(message.sender_id) ===
      String(currentUser.id);


    const row =
      document.createElement(
        "div"
      );


    row.className =
      "message-row " +
      (
        mine
          ? "mine"
          : "other"
      );


    const bubble =
      document.createElement(
        "div"
      );


    bubble.className =
      "message-bubble";


    /*
    Sender name
    */

    if (!mine) {

      const sender =
        document.createElement(
          "div"
        );


      sender.className =
        "sender-name";


      sender.textContent =
        message.sender_name ||
        "Unknown";


      bubble.appendChild(
        sender
      );

    }


    /*
    Message text
    */

    const text =
      document.createElement(
        "div"
      );


    text.className =
      "message-text";


    text.textContent =
      message.content || "";


    bubble.appendChild(
      text
    );


    /*
    Time
    */

    const time =
      document.createElement(
        "div"
      );


    time.className =
      "message-time";


    time.textContent =
      formatTime(
        message.timestamp
      );


    bubble.appendChild(
      time
    );


    row.appendChild(
      bubble
    );


    messagesContainer.appendChild(
      row
    );

  });


  if (
    forceScroll ||
    nearBottom
  ) {

    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;

  }

}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  if (
    !currentUser ||
    isSending
  ) {
    return;
  }


  const content =
    messageInput.value.trim();


  if (!content) {
    return;
  }


  isSending = true;

  sendButton.disabled = true;

  messageInput.disabled = true;


  const payload = {

    action:
      "sendMessage",

    room_id:
      "public",

    sender_id:
      currentUser.id,

    sender_name:
      currentUser.name,

    type:
      "text",

    content:
      content,

    image_url:
      "",

    reply_to:
      ""

  };


  try {

    const response =
      await fetch(
        API_URL,
        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "Pesan gagal dikirim."
      );

    }


    messageInput.value = "";


    await loadMessages(true);


  } catch (error) {

    console.error(
      "Gagal mengirim:",
      error
    );


    alert(
      "Pesan gagal dikirim. Coba lagi."
    );

  } finally {

    isSending = false;

    sendButton.disabled = false;

    messageInput.disabled = false;

    messageInput.focus();

  }

}


/* =========================
   FORMAT TIME
========================= */

function formatTime(timestamp) {

  if (!timestamp) {
    return "";
  }


  const date =
    new Date(timestamp);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleTimeString(
    "id-ID",
    {
      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  );

}


/* =========================
   EVENTS
========================= */

loginButton.addEventListener(
  "click",
  login
);


logoutButton.addEventListener(
  "click",
  logout
);


sendButton.addEventListener(
  "click",
  sendMessage
);


nameInput.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter"
    ) {

      login();

    }

  }
);


messageInput.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* =========================
   POLLING
========================= */

setInterval(
  function() {

    if (
      currentUser &&
      !isSending
    ) {

      loadMessages(false);

    }

  },

  3000
);


/* =========================
   START
========================= */

init();

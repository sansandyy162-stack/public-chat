const API_URL =
  "https://script.google.com/macros/s/AKfycbwsFKdn6NIFTbfYKW-AsdgjJX0uPK7KfpHaEAq8wilOis4ZX1prZW-X6qPBrP1p7AQp/exec";


let currentUser = null;
let currentPartner = null;

let serverMessages = [];
let pendingMessages = [];

let pollTimer = null;
let userTimer = null;
let heartbeatTimer = null;

let loadingMessages = false;


/* =========================
   ELEMENTS
========================= */

const loginScreen =
  document.getElementById("loginScreen");

const appScreen =
  document.getElementById("appScreen");

const nameInput =
  document.getElementById("nameInput");

const loginButton =
  document.getElementById("loginButton");

const loginStatus =
  document.getElementById("loginStatus");

const logoutButton =
  document.getElementById("logoutButton");

const myName =
  document.getElementById("myName");

const userList =
  document.getElementById("userList");

const emptyChat =
  document.getElementById("emptyChat");

const conversation =
  document.getElementById("conversation");

const backButton =
  document.getElementById("backButton");

const partnerName =
  document.getElementById("partnerName");

const partnerInitial =
  document.getElementById("partnerInitial");

const partnerStatus =
  document.getElementById("partnerStatus");

const messagesElement =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* =========================
   START
========================= */

function init() {

  const saved =
    localStorage.getItem(
      "private_chat_user"
    );


  if (!saved) {
    return;
  }


  try {

    currentUser =
      JSON.parse(saved);

    startApp();

  } catch {

    localStorage.removeItem(
      "private_chat_user"
    );

  }

}


/* =========================
   LOGIN
========================= */

async function login() {

  const name =
    nameInput.value.trim();


  if (!name) {

    alert("Masukkan nama.");

    return;

  }


  loginButton.disabled = true;

  loginStatus.textContent =
    "Mendaftarkan user...";


  const user = {

    id:
      "USER_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 100000
      ),

    name:
      name

  };


  try {

    const data =
      await postAPI({

        action:
          "registerUser",

        user_id:
          user.id,

        name:
          user.name

      });


    if (!data.success) {

      throw new Error(
        data.message
      );

    }


    currentUser = user;


    localStorage.setItem(
      "private_chat_user",
      JSON.stringify(user)
    );


    loginStatus.textContent = "";


    startApp();


  } catch (error) {

    console.error(error);

    loginStatus.textContent =
      "Gagal masuk. Coba lagi.";

  } finally {

    loginButton.disabled = false;

  }

}


/* =========================
   START APP
========================= */

function startApp() {

  loginScreen.classList.add(
    "hidden"
  );

  appScreen.classList.remove(
    "hidden"
  );


  myName.textContent =
    currentUser.name;


  loadUsers();

  sendHeartbeat();


  clearInterval(userTimer);

  userTimer =
    setInterval(
      loadUsers,
      4000
    );


  clearInterval(
    heartbeatTimer
  );

  heartbeatTimer =
    setInterval(
      sendHeartbeat,
      15000
    );

}


/* =========================
   USERS
========================= */

async function loadUsers() {

  if (!currentUser) {
    return;
  }


  try {

    const url =
      API_URL +
      "?action=getUsers" +
      "&current_user_id=" +
      encodeURIComponent(
        currentUser.id
      ) +
      "&t=" +
      Date.now();


    const response =
      await fetch(url);


    const data =
      await response.json();


    if (!data.success) {
      return;
    }


    renderUsers(
      data.users || []
    );


  } catch (error) {

    console.error(
      "Load users:",
      error
    );

  }

}


function renderUsers(users) {

  userList.innerHTML = "";


  if (!users.length) {

    userList.innerHTML =
      `
        <div class="center-info">
          Belum ada user lain.<br><br>
          Buka website ini di browser
          atau Incognito lain untuk
          membuat user kedua.
        </div>
      `;

    return;

  }


  users.forEach(user => {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "user-item";


    if (
      currentPartner &&
      String(currentPartner.user_id) ===
      String(user.user_id)
    ) {

      button.classList.add(
        "active"
      );

    }


    const avatar =
      document.createElement(
        "div"
      );


    avatar.className =
      "avatar";


    avatar.textContent =
      getInitial(user.name);


    const info =
      document.createElement(
        "div"
      );


    info.className =
      "user-info";


    const name =
      document.createElement(
        "div"
      );


    name.className =
      "user-name";


    name.textContent =
      user.name;


    const status =
      document.createElement(
        "div"
      );


    status.className =
      "user-status";


    status.textContent =
      formatLastSeen(
        user.last_seen
      );


    info.appendChild(name);

    info.appendChild(status);

    button.appendChild(avatar);

    button.appendChild(info);


    button.addEventListener(
      "click",
      () => openChat(user)
    );


    userList.appendChild(
      button
    );

  });

}


/* =========================
   OPEN CHAT
========================= */

async function openChat(user) {

  currentPartner = user;

  serverMessages = [];
  pendingMessages = [];


  partnerName.textContent =
    user.name;


  partnerInitial.textContent =
    getInitial(user.name);


  partnerStatus.textContent =
    formatLastSeen(
      user.last_seen
    );


  emptyChat.classList.add(
    "hidden"
  );


  conversation.classList.remove(
    "hidden"
  );


  appScreen.classList.add(
    "chat-open"
  );


  messagesElement.innerHTML =
    `
      <div class="no-message">
        Memuat percakapan...
      </div>
    `;


  await loadMessages(true);


  clearInterval(pollTimer);


  pollTimer =
    setInterval(
      () => {

        if (
          currentPartner &&
          document.visibilityState ===
          "visible"
        ) {

          loadMessages(false);

        }

      },
      1000
    );


  setTimeout(
    () => messageInput.focus(),
    100
  );


  loadUsers();

}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages(
  forceScroll = false
) {

  if (
    !currentUser ||
    !currentPartner ||
    loadingMessages
  ) {
    return;
  }


  loadingMessages = true;


  try {

    const partnerId =
      currentPartner.user_id;


    const url =
      API_URL +
      "?action=getMessages" +
      "&user_id=" +
      encodeURIComponent(
        currentUser.id
      ) +
      "&partner_id=" +
      encodeURIComponent(
        partnerId
      ) +
      "&t=" +
      Date.now();


    const response =
      await fetch(url);


    const data =
      await response.json();


    /*
     User mungkin sudah pindah chat
     sebelum request selesai.
    */

    if (
      !currentPartner ||
      String(
        currentPartner.user_id
      ) !==
      String(partnerId)
    ) {

      return;

    }


    if (!data.success) {

      console.error(
        data.message
      );

      return;

    }


    serverMessages =
      data.messages || [];


    /*
     Hapus pending message apabila
     client_id yang sama sudah
     ditemukan di database.
    */

    const serverClientIds =
      new Set(

        serverMessages.map(
          message =>
            String(
              message.client_id
            )
        )

      );


    pendingMessages =
      pendingMessages.filter(
        message =>

          !serverClientIds.has(
            String(
              message.client_id
            )
          )

      );


    renderMessages(
      forceScroll
    );


    /*
     Jika conversation sedang dibuka,
     tandai pesan dari partner
     sebagai terbaca.
    */

    if (
      document.visibilityState ===
      "visible"
    ) {

      await markAsRead();

    }


  } catch (error) {

    console.error(
      "Load messages:",
      error
    );

  } finally {

    loadingMessages = false;

  }

}


/* =========================
   RENDER
========================= */

function renderMessages(
  forceScroll = false
) {

  const nearBottom =
    messagesElement.scrollHeight -
    messagesElement.scrollTop -
    messagesElement.clientHeight
    < 120;


  const allMessages = [

    ...serverMessages,

    ...pendingMessages

  ];


  messagesElement.innerHTML = "";


  if (!allMessages.length) {

    messagesElement.innerHTML =
      `
        <div class="no-message">
          Belum ada pesan.<br>
          Mulai percakapan 👋
        </div>
      `;

    return;

  }


  allMessages.forEach(
    message => {

      const mine =
        String(
          message.sender_id
        ) ===
        String(
          currentUser.id
        );


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


      const text =
        document.createElement(
          "div"
        );


      text.className =
        "message-text";


      text.textContent =
        message.content;


      bubble.appendChild(text);


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "message-meta";


      const time =
        document.createElement(
          "span"
        );


      time.textContent =
        formatTime(
          message.timestamp
        );


      meta.appendChild(time);


      if (mine) {

        const status =
          document.createElement(
            "span"
          );


        const state =
          getMessageState(
            message
          );


        status.className =
          "message-status " +
          state.className;


        status.textContent =
          state.text;


        meta.appendChild(
          status
        );

      }


      bubble.appendChild(meta);

      row.appendChild(bubble);

      messagesElement.appendChild(
        row
      );

    }
  );


  if (
    forceScroll ||
    nearBottom
  ) {

    messagesElement.scrollTop =
      messagesElement.scrollHeight;

  }

}


/* =========================
   STATUS
========================= */

function getMessageState(message) {

  if (message.failed) {

    return {
      text: "⚠ Gagal",
      className: "failed"
    };

  }


  if (message.pending) {

    return {
      text: "○ Pending",
      className: "pending"
    };

  }


  if (message.read_at) {

    return {
      text: "✓✓ Terbaca",
      className: "read"
    };

  }


  return {
    text: "✓ Terkirim",
    className: "sent"
  };

}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  if (
    !currentUser ||
    !currentPartner
  ) {
    return;
  }


  const content =
    messageInput.value.trim();


  if (!content) {
    return;
  }


  /*
   Buat ID sebelum request dikirim.
  */

  const clientId =
    "LOCAL_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 100000
    );


  const partnerSnapshot = {
    ...currentPartner
  };


  const localMessage = {

    id: "",

    client_id:
      clientId,

    sender_id:
      currentUser.id,

    sender_name:
      currentUser.name,

    receiver_id:
      partnerSnapshot.user_id,

    receiver_name:
      partnerSnapshot.name,

    type:
      "text",

    content:
      content,

    image_url:
      "",

    reply_to:
      "",

    timestamp:
      new Date().toISOString(),

    read_at:
      "",

    pending:
      true,

    failed:
      false

  };


  /*
   BUBBLE LANGSUNG MUNCUL.

   Tidak menunggu GAS.
  */

  pendingMessages.push(
    localMessage
  );


  messageInput.value = "";


  renderMessages(true);


  messageInput.focus();


  /*
   Baru kirim ke GAS.
  */

  try {

    const data =
      await postAPI({

        action:
          "sendMessage",

        client_id:
          clientId,

        sender_id:
          currentUser.id,

        sender_name:
          currentUser.name,

        receiver_id:
          partnerSnapshot.user_id,

        receiver_name:
          partnerSnapshot.name,

        type:
          "text",

        content:
          content,

        image_url:
          "",

        reply_to:
          ""

      });


    if (!data.success) {

      throw new Error(
        data.message
      );

    }


    /*
     Kalau user masih membuka
     conversation yang sama,
     refresh data server.
    */

    if (
      currentPartner &&
      String(
        currentPartner.user_id
      ) ===
      String(
        partnerSnapshot.user_id
      )
    ) {

      await loadMessages(true);

    }


  } catch (error) {

    console.error(
      "Send message:",
      error
    );


    const message =
      pendingMessages.find(
        item =>
          item.client_id ===
          clientId
      );


    if (message) {

      message.pending = false;

      message.failed = true;

    }


    renderMessages(true);

  }

}


/* =========================
   MARK READ
========================= */

async function markAsRead() {

  if (
    !currentUser ||
    !currentPartner
  ) {
    return;
  }


  /*
   Cek apakah ada pesan partner
   yang belum dibaca.
  */

  const unreadExists =
    serverMessages.some(
      message =>

        String(
          message.sender_id
        ) ===
        String(
          currentPartner.user_id
        )

        &&

        String(
          message.receiver_id
        ) ===
        String(
          currentUser.id
        )

        &&

        !message.read_at
    );


  if (!unreadExists) {
    return;
  }


  const partnerId =
    currentPartner.user_id;


  try {

    const data =
      await postAPI({

        action:
          "markAsRead",

        user_id:
          currentUser.id,

        partner_id:
          partnerId

      });


    if (
      data.success &&
      currentPartner &&
      String(
        currentPartner.user_id
      ) ===
      String(partnerId)
    ) {

      /*
       Update lokal supaya tidak
       menunggu polling berikutnya.
      */

      serverMessages.forEach(
        message => {

          if (

            String(
              message.sender_id
            ) ===
            String(partnerId)

            &&

            String(
              message.receiver_id
            ) ===
            String(
              currentUser.id
            )

            &&

            !message.read_at

          ) {

            message.read_at =
              data.read_at ||
              new Date().toISOString();

          }

        }
      );

    }


  } catch (error) {

    console.error(
      "Mark read:",
      error
    );

  }

}


/* =========================
   HEARTBEAT
========================= */

async function sendHeartbeat() {

  if (!currentUser) {
    return;
  }


  try {

    await postAPI({

      action:
        "heartbeat",

      user_id:
        currentUser.id

    });


  } catch (error) {

    console.error(
      "Heartbeat:",
      error
    );

  }

}


/* =========================
   API
========================= */

async function postAPI(payload) {

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


  return response.json();

}


/* =========================
   HELPERS
========================= */

function getInitial(name) {

  if (!name) {
    return "?";
  }


  return name
    .trim()
    .charAt(0)
    .toUpperCase();

}


function formatTime(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


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


function formatLastSeen(value) {

  if (!value) {

    return "Belum aktif";

  }


  const date =
    new Date(value);


  const diff =
    Date.now() -
    date.getTime();


  if (
    Number.isNaN(diff)
  ) {

    return "";

  }


  /*
   Heartbeat setiap 15 detik.
   Anggap online jika < 30 detik.
  */

  if (diff < 30000) {

    return "Online";

  }


  const minutes =
    Math.floor(
      diff / 60000
    );


  if (minutes < 1) {

    return "Baru saja aktif";

  }


  if (minutes < 60) {

    return (
      "Aktif " +
      minutes +
      " menit lalu"
    );

  }


  return (
    "Terakhir aktif " +
    date.toLocaleString(
      "id-ID",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    )
  );

}


/* =========================
   BACK
========================= */

function closeMobileChat() {

  appScreen.classList.remove(
    "chat-open"
  );

}


/* =========================
   LOGOUT
========================= */

function logout() {

  if (
    !confirm(
      "Keluar dari akun chat ini?"
    )
  ) {
    return;
  }


  clearInterval(
    pollTimer
  );

  clearInterval(
    userTimer
  );

  clearInterval(
    heartbeatTimer
  );


  localStorage.removeItem(
    "private_chat_user"
  );


  location.reload();

}


/* =========================
   EVENTS
========================= */

loginButton.addEventListener(
  "click",
  login
);


nameInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      login();

    }

  }
);


sendButton.addEventListener(
  "click",
  sendMessage
);


messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


backButton.addEventListener(
  "click",
  closeMobileChat
);


logoutButton.addEventListener(
  "click",
  logout
);


/*
Ketika user kembali membuka tab,
langsung cek pesan.
*/

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      loadUsers();

      sendHeartbeat();


      if (currentPartner) {

        loadMessages(false);

      }

    }

  }
);


/* =========================
   INIT
========================= */

init();

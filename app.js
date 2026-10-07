/* =========================================================
   PRIVATE CHAT V1.3
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwsFKdn6NIFTbfYKW-AsdgjJX0uPK7KfpHaEAq8wilOis4ZX1prZW-X6qPBrP1p7AQp/exec";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentPartner = null;

let serverMessages = [];

let pendingMessages = [];

let replyingTo = null;

let pollTimer = null;

let userTimer = null;

let heartbeatTimer = null;

let loadingMessages = false;


/* =========================================================
   ELEMENTS
========================================================= */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const appScreen =
  document.getElementById(
    "appScreen"
  );


/* AUTH */

const loginForm =
  document.getElementById(
    "loginForm"
  );

const registerForm =
  document.getElementById(
    "registerForm"
  );

const loginUsername =
  document.getElementById(
    "loginUsername"
  );

const loginPassword =
  document.getElementById(
    "loginPassword"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const loginStatus =
  document.getElementById(
    "loginStatus"
  );

const registerName =
  document.getElementById(
    "registerName"
  );

const registerUsername =
  document.getElementById(
    "registerUsername"
  );

const registerPassword =
  document.getElementById(
    "registerPassword"
  );

const registerPassword2 =
  document.getElementById(
    "registerPassword2"
  );

const registerButton =
  document.getElementById(
    "registerButton"
  );

const registerStatus =
  document.getElementById(
    "registerStatus"
  );

const showRegisterButton =
  document.getElementById(
    "showRegisterButton"
  );

const showLoginButton =
  document.getElementById(
    "showLoginButton"
  );


/* APP */

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const myName =
  document.getElementById(
    "myName"
  );

const myUsername =
  document.getElementById(
    "myUsername"
  );

const userList =
  document.getElementById(
    "userList"
  );

const emptyChat =
  document.getElementById(
    "emptyChat"
  );

const conversation =
  document.getElementById(
    "conversation"
  );

const backButton =
  document.getElementById(
    "backButton"
  );

const partnerName =
  document.getElementById(
    "partnerName"
  );

const partnerInitial =
  document.getElementById(
    "partnerInitial"
  );

const partnerStatus =
  document.getElementById(
    "partnerStatus"
  );

const messagesElement =
  document.getElementById(
    "messages"
  );

const messageInput =
  document.getElementById(
    "messageInput"
  );

const sendButton =
  document.getElementById(
    "sendButton"
  );


/* REPLY */

const activeReply =
  document.getElementById(
    "activeReply"
  );

const activeReplyTitle =
  document.getElementById(
    "activeReplyTitle"
  );

const activeReplyText =
  document.getElementById(
    "activeReplyText"
  );

const cancelReplyButton =
  document.getElementById(
    "cancelReplyButton"
  );


/* =========================================================
   INIT
========================================================= */

function init() {

  const saved =
    localStorage.getItem(
      "private_chat_session"
    );


  if (!saved) {

    showLogin();

    return;

  }


  try {

    const user =
      JSON.parse(saved);


    if (
      !user ||
      !user.id ||
      !user.username ||
      !user.name
    ) {

      throw new Error(
        "Session tidak valid."
      );

    }


    currentUser =
      user;


    startApp();


  } catch (error) {

    localStorage.removeItem(
      "private_chat_session"
    );


    currentUser = null;


    showLogin();

  }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  loginScreen.classList.remove(
    "hidden"
  );


  appScreen.classList.add(
    "hidden"
  );


  loginForm.classList.remove(
    "hidden"
  );


  registerForm.classList.add(
    "hidden"
  );


  setTimeout(
    () =>
      loginUsername.focus(),
    100
  );

}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  loginForm.classList.add(
    "hidden"
  );


  registerForm.classList.remove(
    "hidden"
  );


  loginStatus.textContent =
    "";


  registerStatus.textContent =
    "";


  setTimeout(
    () =>
      registerName.focus(),
    100
  );

}


/* =========================================================
   REGISTER
========================================================= */

async function registerAccount() {

  const name =
    registerName.value.trim();


  const username =
    registerUsername
      .value
      .trim()
      .toLowerCase();


  const password =
    registerPassword.value;


  const password2 =
    registerPassword2.value;


  registerStatus.className =
    "small-status";


  if (
    !name ||
    !username ||
    !password
  ) {

    setRegisterError(
      "Semua data wajib diisi."
    );

    return;

  }


  if (
    username.length < 3
  ) {

    setRegisterError(
      "Username minimal 3 karakter."
    );

    return;

  }


  if (
    !/^[a-z0-9_]+$/.test(
      username
    )
  ) {

    setRegisterError(
      "Username hanya boleh huruf, angka, dan underscore."
    );

    return;

  }


  if (
    password.length < 6
  ) {

    setRegisterError(
      "Password minimal 6 karakter."
    );

    return;

  }


  if (
    password !== password2
  ) {

    setRegisterError(
      "Ulangi password tidak sama."
    );

    return;

  }


  registerButton.disabled =
    true;


  registerStatus.textContent =
    "Membuat akun...";


  try {

    const data =
      await postAPI({

        action:
          "register",

        name:
          name,

        username:
          username,

        password:
          password

      });


    if (!data.success) {

      throw new Error(
        data.message ||
        "Gagal membuat akun."
      );

    }


    /*
    Register langsung login.
    */

    currentUser =
      data.user;


    saveSession();


    startApp();


  } catch (error) {

    setRegisterError(
      cleanError(
        error.message
      )
    );


  } finally {

    registerButton.disabled =
      false;

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginAccount() {

  const username =
    loginUsername
      .value
      .trim()
      .toLowerCase();


  const password =
    loginPassword.value;


  loginStatus.className =
    "small-status";


  if (
    !username ||
    !password
  ) {

    setLoginError(
      "Username dan password wajib diisi."
    );

    return;

  }


  loginButton.disabled =
    true;


  loginStatus.textContent =
    "Memeriksa akun...";


  try {

    const data =
      await postAPI({

        action:
          "login",

        username:
          username,

        password:
          password

      });


    if (!data.success) {

      throw new Error(
        data.message ||
        "Login gagal."
      );

    }


    currentUser =
      data.user;


    saveSession();


    loginPassword.value =
      "";


    loginStatus.textContent =
      "";


    startApp();


  } catch (error) {

    setLoginError(
      cleanError(
        error.message
      )
    );


  } finally {

    loginButton.disabled =
      false;

  }

}


/* =========================================================
   SESSION
========================================================= */

function saveSession() {

  localStorage.setItem(
    "private_chat_session",
    JSON.stringify(
      currentUser
    )
  );

}


/* =========================================================
   START APP
========================================================= */

function startApp() {

  loginScreen.classList.add(
    "hidden"
  );


  appScreen.classList.remove(
    "hidden"
  );


  myName.textContent =
    currentUser.name;


  myUsername.textContent =
    "@" +
    currentUser.username;


  loadUsers();

  sendHeartbeat();


  clearInterval(
    userTimer
  );


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


/* =========================================================
   LOAD USERS
========================================================= */

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


    const users =
      data.users || [];


    renderUsers(users);


    /*
    Refresh status partner.
    */

    if (currentPartner) {

      const fresh =
        users.find(
          user =>
            String(
              user.user_id
            ) ===
            String(
              currentPartner.user_id
            )
        );


      if (fresh) {

        currentPartner = {
          ...currentPartner,
          ...fresh
        };


        partnerStatus.textContent =
          formatLastSeen(
            fresh.last_seen
          );

      }

    }


  } catch (error) {

    console.error(
      "Load users:",
      error
    );

  }

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers(users) {

  userList.innerHTML = "";


  if (!users.length) {

    userList.innerHTML =
      `
        <div class="center-info">
          Belum ada user lain.
          <br><br>
          Buat akun kedua untuk
          mulai chat.
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
      String(
        currentPartner.user_id
      ) ===
      String(
        user.user_id
      )
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
      getInitial(
        user.name
      );


    const info =
      document.createElement(
        "div"
      );


    info.className =
      "user-info";


    const top =
      document.createElement(
        "div"
      );


    top.className =
      "user-row-top";


    const name =
      document.createElement(
        "div"
      );


    name.className =
      "user-name";


    name.textContent =
      user.name;


    top.appendChild(name);


    const unread =
      Number(
        user.unread_count || 0
      );


    if (unread > 0) {

      const badge =
        document.createElement(
          "div"
        );


      badge.className =
        "unread-badge";


      badge.textContent =
        unread > 99
          ? "99+"
          : unread;


      top.appendChild(
        badge
      );

    }


    info.appendChild(top);


    if (user.last_message) {

      const preview =
        document.createElement(
          "div"
        );


      preview.className =
        "user-last-message";


      preview.textContent =
        user.last_message;


      info.appendChild(
        preview
      );

    } else {

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


      info.appendChild(
        status
      );

    }


    button.appendChild(
      avatar
    );


    button.appendChild(
      info
    );


    button.addEventListener(
      "click",
      () =>
        openChat(user)
    );


    userList.appendChild(
      button
    );

  });

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChat(user) {

  clearInterval(
    pollTimer
  );


  currentPartner = {
    ...user
  };


  cancelReply();


  serverMessages = [];

  pendingMessages = [];


  partnerName.textContent =
    user.name;


  partnerInitial.textContent =
    getInitial(
      user.name
    );


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


  await loadMessages(
    true
  );


  /*
  POLLING PESAN = 1 DETIK
  */

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
    () =>
      messageInput.focus(),
    100
  );


  loadUsers();

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

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


  const partnerId =
    currentPartner.user_id;


  try {

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


    if (
      !currentPartner ||
      String(
        currentPartner.user_id
      ) !==
      String(
        partnerId
      )
    ) {

      return;

    }


    if (!data.success) {
      return;
    }


    serverMessages =
      data.messages || [];


    const serverClientIds =
      new Set(

        serverMessages.map(
          message =>
            String(
              message.client_id || ""
            )
        )

      );


    pendingMessages =
      pendingMessages.filter(
        message => {

          if (message.failed) {
            return true;
          }


          return !serverClientIds.has(
            String(
              message.client_id
            )
          );

        }
      );


    renderMessages(
      forceScroll
    );


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

    loadingMessages =
      false;

  }

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

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


  messagesElement.innerHTML =
    "";


  if (!allMessages.length) {

    messagesElement.innerHTML =
      `
        <div class="no-message">
          Belum ada pesan.
          <br>
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


      /*
      REPLY PREVIEW
      */

      if (message.reply_to) {

        const original =
          allMessages.find(
            item =>
              String(
                item.id
              ) ===
              String(
                message.reply_to
              )
          );


        const replyBox =
          document.createElement(
            "div"
          );


        replyBox.className =
          "reply-preview";


        const replyName =
          document.createElement(
            "div"
          );


        replyName.className =
          "reply-name";


        const replyText =
          document.createElement(
            "div"
          );


        replyText.className =
          "reply-text";


        if (original) {

          replyName.textContent =
            String(
              original.sender_id
            ) ===
            String(
              currentUser.id
            )
              ? "Kamu"
              : original.sender_name;


          replyText.textContent =
            original.content;

        } else {

          replyName.textContent =
            "Reply";


          replyText.textContent =
            "Pesan sebelumnya";

        }


        replyBox.appendChild(
          replyName
        );


        replyBox.appendChild(
          replyText
        );


        bubble.appendChild(
          replyBox
        );

      }


      /*
      TEXT
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
      META
      */

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


      meta.appendChild(
        time
      );


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


      bubble.appendChild(
        meta
      );


      /*
      CLICK BUBBLE = REPLY
      */

      if (
        message.id &&
        !message.pending &&
        !message.failed
      ) {

        bubble.addEventListener(
          "click",
          () =>
            startReply(
              message
            )
        );

      }


      row.appendChild(
        bubble
      );


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


/* =========================================================
   STATUS MESSAGE
========================================================= */

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


/* =========================================================
   REPLY
========================================================= */

function startReply(message) {

  if (
    !message ||
    !message.id
  ) {
    return;
  }


  replyingTo = {
    ...message
  };


  const mine =
    String(
      message.sender_id
    ) ===
    String(
      currentUser.id
    );


  activeReplyTitle.textContent =
    mine
      ? "Reply ke pesan kamu"
      : "Reply ke " +
        message.sender_name;


  activeReplyText.textContent =
    message.content;


  activeReply.classList.remove(
    "hidden"
  );


  messageInput.focus();

}


function cancelReply() {

  replyingTo = null;


  activeReply.classList.add(
    "hidden"
  );


  activeReplyText.textContent =
    "";

}


/* =========================================================
   SEND MESSAGE
========================================================= */

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


  const replySnapshot =
    replyingTo
      ? {
          ...replyingTo
        }
      : null;


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
      replySnapshot
        ? replySnapshot.id
        : "",

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
  Bubble langsung muncul.
  */

  pendingMessages.push(
    localMessage
  );


  messageInput.value =
    "";


  cancelReply();


  renderMessages(
    true
  );


  messageInput.focus();


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
          replySnapshot
            ? replySnapshot.id
            : ""

      });


    if (!data.success) {

      throw new Error(
        data.message
      );

    }


    if (
      currentPartner &&
      String(
        currentPartner.user_id
      ) ===
      String(
        partnerSnapshot.user_id
      )
    ) {

      await loadMessages(
        true
      );

    }


    loadUsers();


  } catch (error) {

    console.error(
      "Send:",
      error
    );


    const message =
      pendingMessages.find(
        item =>
          item.client_id ===
          clientId
      );


    if (message) {

      message.pending =
        false;

      message.failed =
        true;

    }


    renderMessages(
      true
    );

  }

}


/* =========================================================
   MARK READ
========================================================= */

async function markAsRead() {

  if (
    !currentUser ||
    !currentPartner
  ) {
    return;
  }


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


    if (!data.success) {
      return;
    }


    if (
      !currentPartner ||
      String(
        currentPartner.user_id
      ) !==
      String(
        partnerId
      )
    ) {
      return;
    }


    serverMessages.forEach(
      message => {

        if (

          String(
            message.sender_id
          ) ===
          String(
            partnerId
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

        ) {

          message.read_at =
            data.read_at ||
            new Date()
              .toISOString();

        }

      }
    );


    loadUsers();


  } catch (error) {

    console.error(
      "Mark read:",
      error
    );

  }

}


/* =========================================================
   HEARTBEAT
========================================================= */

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


/* =========================================================
   API
========================================================= */

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


/* =========================================================
   AUTH ERRORS
========================================================= */

function setLoginError(message) {

  loginStatus.className =
    "small-status error";


  loginStatus.textContent =
    message;

}


function setRegisterError(message) {

  registerStatus.className =
    "small-status error";


  registerStatus.textContent =
    message;

}


function cleanError(message) {

  return String(
    message || "Terjadi kesalahan."
  )
    .replace(
      /^Error:\s*/i,
      ""
    );

}


/* =========================================================
   HELPERS
========================================================= */

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


  return date
    .toLocaleTimeString(
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


  const time =
    date.getTime();


  if (
    Number.isNaN(time)
  ) {
    return "";
  }


  const diff =
    Date.now() -
    time;


  if (
    diff < 30000
  ) {

    return "Online";

  }


  const minutes =
    Math.floor(
      diff / 60000
    );


  if (
    minutes < 1
  ) {

    return "Baru saja aktif";

  }


  if (
    minutes < 60
  ) {

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


/* =========================================================
   BACK MOBILE
========================================================= */

function closeMobileChat() {

  appScreen.classList.remove(
    "chat-open"
  );


  cancelReply();


  loadUsers();

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  const ok =
    confirm(
      "Keluar dari akun?"
    );


  if (!ok) {
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


  /*
  Hanya session browser yang
  dihapus.

  AKUN DI DATABASE TIDAK DIHAPUS.
  */

  localStorage.removeItem(
    "private_chat_session"
  );


  currentUser = null;

  currentPartner = null;


  location.reload();

}


/* =========================================================
   EVENTS
========================================================= */

showRegisterButton
  .addEventListener(
    "click",
    showRegister
  );


showLoginButton
  .addEventListener(
    "click",
    showLogin
  );


registerButton
  .addEventListener(
    "click",
    registerAccount
  );


loginButton
  .addEventListener(
    "click",
    loginAccount
  );


loginPassword
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        loginAccount();

      }

    }
  );


registerPassword2
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        registerAccount();

      }

    }
  );


sendButton
  .addEventListener(
    "click",
    sendMessage
  );


messageInput
  .addEventListener(
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


backButton
  .addEventListener(
    "click",
    closeMobileChat
  );


logoutButton
  .addEventListener(
    "click",
    logout
  );


cancelReplyButton
  .addEventListener(
    "click",
    cancelReply
  );


/* =========================================================
   TAB ACTIVE
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      sendHeartbeat();

      loadUsers();


      if (
        currentPartner
      ) {

        loadMessages(
          false
        );

      }

    }

  }
);


/* =========================================================
   START
========================================================= */

init();

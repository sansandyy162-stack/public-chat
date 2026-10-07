/* =========================================================
   PRIVATE CHAT V1.2
   ---------------------------------------------------------
   FITUR:
   - Login / register user
   - Daftar user
   - Online / last seen
   - Private chat 1-to-1
   - Optimistic message
   - Pending
   - Terkirim
   - Terbaca
   - Unread badge
   - Last message preview
   - Reply message
   - Polling pesan
   - Heartbeat user
========================================================= */


/* =========================================================
   CONFIG
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


const nameInput =
  document.getElementById(
    "nameInput"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginStatus =
  document.getElementById(
    "loginStatus"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


const myName =
  document.getElementById(
    "myName"
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


/*
Reply elements
*/

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
      "private_chat_user"
    );


  if (!saved) {

    nameInput.focus();

    return;

  }


  try {

    currentUser =
      JSON.parse(saved);


    if (
      !currentUser ||
      !currentUser.id ||
      !currentUser.name
    ) {

      throw new Error(
        "Data user tidak valid."
      );

    }


    startApp();


  } catch (error) {

    console.error(
      "Restore user:",
      error
    );


    localStorage.removeItem(
      "private_chat_user"
    );


    currentUser = null;


    nameInput.focus();

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const name =
    nameInput.value.trim();


  if (!name) {

    alert(
      "Masukkan nama terlebih dahulu."
    );


    nameInput.focus();

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
        data.message ||
        "Gagal register user."
      );

    }


    currentUser = user;


    localStorage.setItem(
      "private_chat_user",
      JSON.stringify(
        currentUser
      )
    );


    loginStatus.textContent =
      "";


    startApp();


  } catch (error) {

    console.error(
      "Login:",
      error
    );


    loginStatus.textContent =
      "Gagal masuk. Coba lagi.";


  } finally {

    loginButton.disabled = false;

  }

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


  /*
  Load awal.
  */

  loadUsers();

  sendHeartbeat();


  /*
  Refresh daftar user setiap
  4 detik.
  */

  clearInterval(
    userTimer
  );


  userTimer =
    setInterval(
      loadUsers,
      4000
    );


  /*
  Update last seen setiap
  15 detik.
  */

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
        "Get users:",
        data.message
      );

      return;

    }


    renderUsers(
      data.users || []
    );


    /*
    Update status partner
    kalau sedang membuka chat.
    */

    if (currentPartner) {

      const freshPartner =
        (data.users || [])
          .find(
            user =>
              String(
                user.user_id
              ) ===
              String(
                currentPartner.user_id
              )
          );


      if (freshPartner) {

        currentPartner = {
          ...currentPartner,
          ...freshPartner
        };


        partnerStatus.textContent =
          formatLastSeen(
            freshPartner.last_seen
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


    /*
    Tandai chat aktif.
    */

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


    /*
    Avatar.
    */

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


    /*
    Info container.
    */

    const info =
      document.createElement(
        "div"
      );


    info.className =
      "user-info";


    /*
    Row nama + unread.
    */

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


    top.appendChild(
      name
    );


    /*
    UNREAD BADGE
    */

    const unreadCount =
      Number(
        user.unread_count || 0
      );


    if (unreadCount > 0) {

      const badge =
        document.createElement(
          "div"
        );


      badge.className =
        "unread-badge";


      badge.textContent =
        unreadCount > 99
          ? "99+"
          : unreadCount;


      top.appendChild(
        badge
      );

    }


    info.appendChild(
      top
    );


    /*
    Last message preview.
    */

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

      /*
      Kalau belum pernah chat,
      tampilkan online / last seen.
      */

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
      () => {

        openChat(user);

      }
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

  /*
  Stop polling chat sebelumnya.
  */

  clearInterval(
    pollTimer
  );


  currentPartner = {
    ...user
  };


  /*
  Reset reply.
  */

  cancelReply();


  /*
  Reset message conversation.
  */

  serverMessages = [];

  pendingMessages = [];


  /*
  Header partner.
  */

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


  /*
  Tampilkan conversation.
  */

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


  /*
  Load pertama.
  */

  await loadMessages(
    true
  );


  /*
  Polling chat setiap 1 detik.
  */

  pollTimer =
    setInterval(
      () => {

        if (
          currentPartner &&
          document.visibilityState ===
          "visible"
        ) {

          loadMessages(
            false
          );

        }

      },
      1000
    );


  setTimeout(
    () => {

      messageInput.focus();

    },
    100
  );


  /*
  Refresh user list supaya
  unread badge ikut berubah.
  */

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


  /*
  Simpan partner saat request dibuat.
  */

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


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    /*
    User mungkin pindah chat
    sebelum request selesai.
    */

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

      console.error(
        "Get messages:",
        data.message
      );

      return;

    }


    serverMessages =
      data.messages || [];


    /*
    Cari client_id yang sudah
    berhasil masuk database.
    */

    const serverClientIds =
      new Set(

        serverMessages.map(
          message =>
            String(
              message.client_id || ""
            )
        )

      );


    /*
    Pending yang sudah ditemukan
    di server tidak perlu
    ditampilkan lagi.
    */

    pendingMessages =
      pendingMessages.filter(
        message => {

          /*
          Message failed tetap
          kita tampilkan.
          */

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


    /*
    Kalau tab aktif dan conversation
    sedang dibuka, tandai pesan
    partner sebagai terbaca.
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


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages(
  forceScroll = false
) {

  /*
  Cek posisi scroll sebelum
  render ulang.
  */

  const nearBottom =
    messagesElement.scrollHeight -
    messagesElement.scrollTop -
    messagesElement.clientHeight
    < 120;


  /*
  Gabungkan server + pending.
  */

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


      /*
      MESSAGE ROW
      */

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


      /*
      MESSAGE BUBBLE
      */

      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "message-bubble";


      /*
      =========================
      REPLY PREVIEW
      =========================
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
              : (
                  original.sender_name ||
                  "User"
                );


          replyText.textContent =
            original.content ||
            "Pesan";

        } else {

          /*
          Misalnya original message
          tidak tersedia.
          */

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
      MESSAGE TEXT
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


      /*
      TIME
      */

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


      /*
      STATUS HANYA UNTUK
      PESAN MILIK SENDIRI
      */

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
      Klik bubble = Reply.

      Pending message belum punya
      server ID sehingga tidak bisa
      dijadikan reply.
      */

      if (
        message.id &&
        !message.pending &&
        !message.failed
      ) {

        bubble.addEventListener(
          "click",
          () => {

            startReply(
              message
            );

          }
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


  /*
  Auto scroll hanya jika:
  - load pertama
  - user sebelumnya dekat bawah
  */

  if (
    forceScroll ||
    nearBottom
  ) {

    messagesElement.scrollTop =
      messagesElement.scrollHeight;

  }

}


/* =========================================================
   MESSAGE STATUS
========================================================= */

function getMessageState(
  message
) {

  /*
  Request gagal.
  */

  if (message.failed) {

    return {

      text:
        "⚠ Gagal",

      className:
        "failed"

    };

  }


  /*
  Belum dikonfirmasi database.
  */

  if (message.pending) {

    return {

      text:
        "○ Pending",

      className:
        "pending"

    };

  }


  /*
  Receiver sudah membuka chat.
  */

  if (message.read_at) {

    return {

      text:
        "✓✓ Terbaca",

      className:
        "read"

    };

  }


  /*
  Sudah tersimpan database.
  */

  return {

    text:
      "✓ Terkirim",

    className:
      "sent"

  };

}


/* =========================================================
   START REPLY
========================================================= */

function startReply(
  message
) {

  /*
  Pesan harus sudah mempunyai
  server ID.
  */

  if (
    !message ||
    !message.id
  ) {

    return;

  }


  replyingTo = {
    ...message
  };


  /*
  Tentukan nama di preview.
  */

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
        (
          message.sender_name ||
          currentPartner.name
        );


  activeReplyText.textContent =
    message.content ||
    "Pesan";


  activeReply.classList.remove(
    "hidden"
  );


  messageInput.focus();

}


/* =========================================================
   CANCEL REPLY
========================================================= */

function cancelReply() {

  replyingTo = null;


  if (activeReply) {

    activeReply.classList.add(
      "hidden"
    );

  }


  if (activeReplyText) {

    activeReplyText.textContent =
      "";

  }

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


  /*
  Client ID dibuat sebelum
  dikirim ke server.
  */

  const clientId =
    "LOCAL_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 100000
    );


  /*
  Snapshot partner.

  Penting jika user pindah chat
  ketika request masih berjalan.
  */

  const partnerSnapshot = {
    ...currentPartner
  };


  /*
  Snapshot reply.
  */

  const replySnapshot =
    replyingTo
      ? {
          ...replyingTo
        }
      : null;


  /*
  Local optimistic message.
  */

  const localMessage = {

    id:
      "",

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
  Masukkan langsung ke UI.

  INILAH YANG MEMBUAT CHAT
  TERASA RESPONSIF.
  */

  pendingMessages.push(
    localMessage
  );


  /*
  Kosongkan input langsung.
  */

  messageInput.value = "";


  /*
  Tutup reply mode.
  */

  cancelReply();


  /*
  Render langsung.

  User langsung melihat:
  ○ Pending
  */

  renderMessages(
    true
  );


  messageInput.focus();


  /*
  Request database dilakukan
  setelah bubble sudah muncul.
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
          replySnapshot
            ? replySnapshot.id
            : ""

      });


    if (!data.success) {

      throw new Error(
        data.message ||
        "Pesan gagal dikirim."
      );

    }


    /*
    Kalau conversation yang sedang
    dibuka masih partner yang sama,
    ambil versi database.
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

      await loadMessages(
        true
      );

    }


    /*
    Refresh last message
    di sidebar.
    */

    loadUsers();


  } catch (error) {

    console.error(
      "Send message:",
      error
    );


    /*
    Cari optimistic message
    berdasarkan client ID.
    */

    const message =
      pendingMessages.find(
        item =>
          String(
            item.client_id
          ) ===
          String(
            clientId
          )
      );


    if (message) {

      message.pending =
        false;


      message.failed =
        true;

    }


    /*
    Hanya render jika user
    masih membuka partner sama.
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

      renderMessages(
        true
      );

    }

  }

}


/* =========================================================
   MARK AS READ
========================================================= */

async function markAsRead() {

  if (
    !currentUser ||
    !currentPartner
  ) {

    return;

  }


  /*
  Cari pesan dari partner
  yang belum read.
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


  /*
  Tidak ada unread.
  Tidak perlu POST.
  */

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


    /*
    User mungkin sudah pindah chat.
    */

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


    /*
    Update read_at lokal.
    */

    serverMessages.forEach(
      message => {

        const fromPartner =
          String(
            message.sender_id
          ) ===
          String(
            partnerId
          );


        const toMe =
          String(
            message.receiver_id
          ) ===
          String(
            currentUser.id
          );


        if (
          fromPartner &&
          toMe &&
          !message.read_at
        ) {

          message.read_at =
            data.read_at ||
            new Date()
              .toISOString();

        }

      }
    );


    /*
    Refresh sidebar supaya
    unread badge hilang.
    */

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
   POST API
========================================================= */

async function postAPI(
  payload
) {

  const response =
    await fetch(
      API_URL,
      {

        method:
          "POST",

        /*
        Sengaja tidak menggunakan
        custom Content-Type.

        Ini membantu request GAS
        tetap sederhana.
        */

        body:
          JSON.stringify(
            payload
          )

      }
    );


  if (!response.ok) {

    throw new Error(
      "HTTP " +
      response.status
    );

  }


  return response.json();

}


/* =========================================================
   INITIAL
========================================================= */

function getInitial(
  name
) {

  if (!name) {

    return "?";

  }


  return name
    .trim()
    .charAt(0)
    .toUpperCase();

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
  value
) {

  if (!value) {

    return "";

  }


  const date =
    new Date(
      value
    );


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


/* =========================================================
   FORMAT LAST SEEN
========================================================= */

function formatLastSeen(
  value
) {

  if (!value) {

    return "Belum aktif";

  }


  const date =
    new Date(
      value
    );


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


  /*
  Heartbeat = 15 detik.

  Di bawah 30 detik
  dianggap online.
  */

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
   CLOSE MOBILE CHAT
========================================================= */

function closeMobileChat() {

  appScreen.classList.remove(
    "chat-open"
  );


  /*
  Batal reply kalau kembali
  ke daftar user.
  */

  cancelReply();


  /*
  Refresh unread.
  */

  loadUsers();

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  const confirmLogout =
    confirm(
      "Keluar dari akun chat ini?"
    );


  if (!confirmLogout) {

    return;

  }


  /*
  Stop semua timer.
  */

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
  Hapus user lokal.
  */

  localStorage.removeItem(
    "private_chat_user"
  );


  currentUser = null;

  currentPartner = null;


  /*
  Reload supaya kembali login.
  */

  location.reload();

}


/* =========================================================
   EVENTS
========================================================= */


/*
LOGIN BUTTON
*/

loginButton.addEventListener(
  "click",
  login
);


/*
ENTER DI LOGIN
*/

nameInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      login();

    }

  }
);


/*
SEND BUTTON
*/

sendButton.addEventListener(
  "click",
  sendMessage
);


/*
ENTER UNTUK SEND
*/

messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/*
BACK MOBILE
*/

backButton.addEventListener(
  "click",
  closeMobileChat
);


/*
LOGOUT
*/

logoutButton.addEventListener(
  "click",
  logout
);


/*
CANCEL REPLY
*/

if (cancelReplyButton) {

  cancelReplyButton.addEventListener(
    "click",
    cancelReply
  );

}


/* =========================================================
   TAB VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    /*
    Ketika user kembali membuka
    browser/tab.
    */

    if (
      document.visibilityState ===
      "visible"
    ) {

      /*
      Update status online.
      */

      sendHeartbeat();


      /*
      Refresh user + unread.
      */

      loadUsers();


      /*
      Kalau sedang membuka chat,
      langsung cek pesan baru.
      */

      if (currentPartner) {

        loadMessages(
          false
        );

      }

    }

  }
);


/* =========================================================
   START APPLICATION
========================================================= */

init();

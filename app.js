/* =========================================================
   PRIVATE CHAT
   SUPABASE REALTIME V2
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://wsbwhnkarhwqwlgrtxgp.supabase.co";


const SUPABASE_KEY =
  "sb_publishable_hbKTQ8whgf8Lc6wMDxYr_Q_gBGGKvEe";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let currentPartner = null;

let profiles = [];

let serverMessages = [];

let pendingMessages = [];

let replyingTo = null;

let realtimeChannel = null;

let heartbeatTimer = null;


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

const loginEmail =
  document.getElementById(
    "loginEmail"
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

const registerEmail =
  document.getElementById(
    "registerEmail"
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

const myName =
  document.getElementById(
    "myName"
  );

const myEmail =
  document.getElementById(
    "myEmail"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
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

const backButton =
  document.getElementById(
    "backButton"
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

async function init() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getSession();


  if (error) {

    console.error(error);

    showLogin();

    return;

  }


  if (
    data.session
  ) {

    currentUser =
      data.session.user;


    await startApp();

  } else {

    showLogin();

  }


  /*
  Supabase mengelola session sendiri.
  Tidak perlu localStorage buatan kita.
  */

  supabaseClient
    .auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {

        if (
          event ===
          "SIGNED_OUT"
        ) {

          cleanupRealtime();

          currentUser = null;

          currentProfile = null;

          currentPartner = null;

          showLogin();

        }

      }
    );

}


/* =========================================================
   AUTH UI
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


  loginStatus.textContent =
    "";


  setTimeout(
    () =>
      loginEmail.focus(),
    100
  );

}


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
    registerName
      .value
      .trim();


  const email =
    registerEmail
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
    !email ||
    !password
  ) {

    setRegisterError(
      "Semua data wajib diisi."
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

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signUp({

          email:
            email,

          password:
            password,

          options: {

            data: {
              name:
                name
            }

          }

        });


    if (error) {
      throw error;
    }


    /*
    Jika email confirmation dimatikan,
    session langsung tersedia.
    */

    if (
      data.session
    ) {

      currentUser =
        data.user;


      await startApp();

      return;

    }


    /*
    Jika confirmation email aktif.
    */

    registerStatus.className =
      "small-status success";


    registerStatus.textContent =
      "Akun dibuat. Cek email untuk konfirmasi, lalu login.";


  } catch (error) {

    setRegisterError(
      error.message
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

  const email =
    loginEmail
      .value
      .trim()
      .toLowerCase();


  const password =
    loginPassword.value;


  if (
    !email ||
    !password
  ) {

    setLoginError(
      "Email dan password wajib diisi."
    );

    return;

  }


  loginButton.disabled =
    true;


  loginStatus.className =
    "small-status";


  loginStatus.textContent =
    "Masuk...";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({

          email:
            email,

          password:
            password

        });


    if (error) {
      throw error;
    }


    currentUser =
      data.user;


    loginPassword.value =
      "";


    loginStatus.textContent =
      "";


    await startApp();


  } catch (error) {

    setLoginError(
      error.message
    );


  } finally {

    loginButton.disabled =
      false;

  }

}


/* =========================================================
   START APP
========================================================= */

async function startApp() {

  if (!currentUser) {
    return;
  }


  loginScreen.classList.add(
    "hidden"
  );


  appScreen.classList.remove(
    "hidden"
  );


  const ok =
    await loadMyProfile();


  if (!ok) {

    alert(
      "Profile tidak ditemukan."
    );

    return;

  }


  myName.textContent =
    currentProfile.name;


  myEmail.textContent =
    currentUser.email || "";


  await updateLastSeen();


  await loadUsers();


  subscribeRealtime();


  clearInterval(
    heartbeatTimer
  );


  /*
  Heartbeat bukan polling message.

  Hanya update last_seen.
  */

  heartbeatTimer =
    setInterval(
      updateLastSeen,
      20000
    );

}


/* =========================================================
   MY PROFILE
========================================================= */

async function loadMyProfile() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "profiles"
      )
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (error) {

    console.error(
      "Profile:",
      error
    );

    return false;

  }


  currentProfile =
    data;


  return true;

}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

  if (!currentUser) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "profiles"
      )
      .select("*")
      .neq(
        "id",
        currentUser.id
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Users:",
      error
    );

    return;

  }


  profiles =
    data || [];


  await loadUserPreviews();

}


/* =========================================================
   USER PREVIEWS + UNREAD
========================================================= */

async function loadUserPreviews() {

  const rendered = [];


  for (
    const profile
    of profiles
  ) {

    /*
    Last message conversation.
    */

    const {
      data: lastMessages
    } =
      await supabaseClient
        .from(
          "messages"
        )
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);


    /*
    Unread count.
    */

    const {
      count
    } =
      await supabaseClient
        .from(
          "messages"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "sender_id",
          profile.id
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .is(
          "read_at",
          null
        );


    const last =
      lastMessages &&
      lastMessages.length
        ? lastMessages[0]
        : null;


    rendered.push({

      ...profile,

      unread_count:
        count || 0,

      last_message:
        last
          ? last.content
          : "",

      last_message_at:
        last
          ? last.created_at
          : ""

    });

  }


  rendered.sort(
    (a, b) => {

      const aTime =
        a.last_message_at
          ? new Date(
              a.last_message_at
            ).getTime()
          : 0;


      const bTime =
        b.last_message_at
          ? new Date(
              b.last_message_at
            ).getTime()
          : 0;


      return bTime - aTime;

    }
  );


  profiles =
    rendered;


  renderUsers();

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

  userList.innerHTML =
    "";


  if (!profiles.length) {

    userList.innerHTML =
      `
        <div class="center-info">
          Belum ada user lain.
          <br><br>
          Daftarkan akun kedua.
        </div>
      `;

    return;

  }


  profiles.forEach(
    user => {

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
        currentPartner.id ===
        user.id
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


      top.appendChild(
        name
      );


      if (
        Number(
          user.unread_count
        ) > 0
      ) {

        const badge =
          document.createElement(
            "div"
          );


        badge.className =
          "unread-badge";


        badge.textContent =
          user.unread_count > 99
            ? "99+"
            : user.unread_count;


        top.appendChild(
          badge
        );

      }


      info.appendChild(
        top
      );


      const status =
        document.createElement(
          "div"
        );


      if (
        user.last_message
      ) {

        status.className =
          "user-last-message";


        status.textContent =
          user.last_message;

      } else {

        status.className =
          "user-status";


        status.textContent =
          formatLastSeen(
            user.last_seen
          );

      }


      info.appendChild(
        status
      );


      button.appendChild(
        avatar
      );


      button.appendChild(
        info
      );


      button.addEventListener(
        "click",
        () =>
          openChat(
            user
          )
      );


      userList.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChat(user) {

  currentPartner = {
    ...user
  };


  serverMessages = [];

  pendingMessages = [];


  cancelReply();


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


  await loadMessages();


  await markAsRead();


  messageInput.focus();

}


/* =========================================================
   LOAD HISTORY
========================================================= */

async function loadMessages() {

  if (
    !currentUser ||
    !currentPartner
  ) {
    return;
  }


  const partnerId =
    currentPartner.id;


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "messages"
      )
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Messages:",
      error
    );

    return;

  }


  if (
    !currentPartner ||
    currentPartner.id !==
    partnerId
  ) {
    return;
  }


  serverMessages =
    data || [];


  reconcilePending();


  renderMessages(
    true
  );

}


/* =========================================================
   REALTIME
========================================================= */

function subscribeRealtime() {

  cleanupRealtime();


  realtimeChannel =
    supabaseClient
      .channel(
        "private-chat-realtime-" +
        currentUser.id
      )


      /*
      MESSAGE INSERT
      */

      .on(

        "postgres_changes",

        {
          event:
            "INSERT",

          schema:
            "public",

          table:
            "messages"

        },

        payload => {

          handleRealtimeInsert(
            payload.new
          );

        }

      )


      /*
      READ RECEIPT UPDATE
      */

      .on(

        "postgres_changes",

        {
          event:
            "UPDATE",

          schema:
            "public",

          table:
            "messages"

        },

        payload => {

          handleRealtimeUpdate(
            payload.new
          );

        }

      )


      /*
      LAST SEEN
      */

      .on(

        "postgres_changes",

        {
          event:
            "UPDATE",

          schema:
            "public",

          table:
            "profiles"

        },

        payload => {

          handleProfileUpdate(
            payload.new
          );

        }

      )


      .subscribe(
        status => {

          console.log(
            "Realtime:",
            status
          );

        }
      );

}


/* =========================================================
   REALTIME INSERT
========================================================= */

function handleRealtimeInsert(
  message
) {

  if (!currentUser) {
    return;
  }


  const involvesMe =

    message.sender_id ===
    currentUser.id

    ||

    message.receiver_id ===
    currentUser.id;


  if (!involvesMe) {
    return;
  }


  /*
  Kalau pesan sedang berada
  di conversation yang terbuka.
  */

  if (
    currentPartner &&
    (
      (
        message.sender_id ===
        currentUser.id

        &&

        message.receiver_id ===
        currentPartner.id
      )

      ||

      (
        message.sender_id ===
        currentPartner.id

        &&

        message.receiver_id ===
        currentUser.id
      )
    )
  ) {

    const exists =
      serverMessages.some(
        item =>
          item.id ===
          message.id
      );


    if (!exists) {

      serverMessages.push(
        message
      );

    }


    reconcilePending();


    renderMessages(
      true
    );


    /*
    Kalau pesan masuk dari partner
    dan tab sedang terlihat:
    langsung read.
    */

    if (
      message.sender_id ===
      currentPartner.id

      &&

      document.visibilityState ===
      "visible"
    ) {

      markAsRead();

    }

  }


  /*
  Update sidebar.
  */

  loadUsers();

}


/* =========================================================
   REALTIME UPDATE
========================================================= */

function handleRealtimeUpdate(
  message
) {

  if (!currentUser) {
    return;
  }


  const index =
    serverMessages.findIndex(
      item =>
        item.id ===
        message.id
    );


  if (
    index !== -1
  ) {

    serverMessages[index] =
      message;


    renderMessages(
      false
    );

  }


  loadUsers();

}


/* =========================================================
   PROFILE REALTIME
========================================================= */

function handleProfileUpdate(
  profile
) {

  const index =
    profiles.findIndex(
      item =>
        item.id ===
        profile.id
    );


  if (
    index !== -1
  ) {

    profiles[index] = {

      ...profiles[index],

      ...profile

    };

  }


  if (
    currentPartner &&
    currentPartner.id ===
    profile.id
  ) {

    currentPartner = {

      ...currentPartner,

      ...profile

    };


    partnerStatus.textContent =
      formatLastSeen(
        profile.last_seen
      );

  }

}


/* =========================================================
   CLEANUP REALTIME
========================================================= */

function cleanupRealtime() {

  if (
    realtimeChannel
  ) {

    supabaseClient
      .removeChannel(
        realtimeChannel
      );


    realtimeChannel =
      null;

  }

}


/* =========================================================
   RECONCILE OPTIMISTIC
========================================================= */

function reconcilePending() {

  const serverClientIds =
    new Set(

      serverMessages.map(
        message =>
          message.client_id
      )

    );


  pendingMessages =
    pendingMessages.filter(
      message =>
        !serverClientIds.has(
          message.client_id
        )
    );

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
    messageInput
      .value
      .trim();


  if (!content) {
    return;
  }


  const clientId =
    crypto.randomUUID();


  const partnerSnapshot = {
    ...currentPartner
  };


  const replyId =
    replyingTo
      ? replyingTo.id
      : null;


  const optimistic = {

    id:
      null,

    client_id:
      clientId,

    sender_id:
      currentUser.id,

    receiver_id:
      partnerSnapshot.id,

    type:
      "text",

    content:
      content,

    image_url:
      null,

    reply_to:
      replyId,

    created_at:
      new Date()
        .toISOString(),

    read_at:
      null,

    pending:
      true,

    failed:
      false

  };


  pendingMessages.push(
    optimistic
  );


  messageInput.value =
    "";


  cancelReply();


  renderMessages(
    true
  );


  messageInput.focus();


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "messages"
      )
      .insert({

        client_id:
          clientId,

        sender_id:
          currentUser.id,

        receiver_id:
          partnerSnapshot.id,

        type:
          "text",

        content:
          content,

        reply_to:
          replyId

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Send:",
      error
    );


    const failed =
      pendingMessages.find(
        item =>
          item.client_id ===
          clientId
      );


    if (failed) {

      failed.pending =
        false;

      failed.failed =
        true;

    }


    renderMessages(
      true
    );


    return;

  }


  /*
  Tidak perlu menunggu realtime
  untuk mengubah pending.
  */

  if (data) {

    const exists =
      serverMessages.some(
        item =>
          item.id ===
          data.id
      );


    if (!exists) {

      serverMessages.push(
        data
      );

    }


    reconcilePending();


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


  if (
    document.visibilityState !==
    "visible"
  ) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from(
        "messages"
      )
      .update({

        read_at:
          new Date()
            .toISOString()

      })
      .eq(
        "sender_id",
        currentPartner.id
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .is(
        "read_at",
        null
      );


  if (error) {

    console.error(
      "Read:",
      error
    );

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


  allMessages.sort(
    (a, b) =>

      new Date(
        a.created_at
      ).getTime()

      -

      new Date(
        b.created_at
      ).getTime()
  );


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
        message.sender_id ===
        currentUser.id;


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

      if (
        message.reply_to
      ) {

        const original =
          allMessages.find(
            item =>
              item.id ===
              message.reply_to
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
            original.sender_id ===
            currentUser.id
              ? "Kamu"
              : currentPartner
                ? currentPartner.name
                : "User";


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


      const text =
        document.createElement(
          "div"
        );


      text.className =
        "message-text";


      text.textContent =
        message.content;


      bubble.appendChild(
        text
      );


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
          message.created_at
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
   MESSAGE STATUS
========================================================= */

function getMessageState(
  message
) {

  if (
    message.failed
  ) {

    return {
      text:
        "⚠ Gagal",

      className:
        "failed"
    };

  }


  if (
    message.pending
  ) {

    return {
      text:
        "○ Pending",

      className:
        "pending"
    };

  }


  if (
    message.read_at
  ) {

    return {
      text:
        "✓✓ Terbaca",

      className:
        "read"
    };

  }


  return {
    text:
      "✓ Terkirim",

    className:
      "sent"
  };

}


/* =========================================================
   REPLY
========================================================= */

function startReply(
  message
) {

  replyingTo = {
    ...message
  };


  activeReplyTitle.textContent =
    message.sender_id ===
    currentUser.id
      ? "Reply ke pesan kamu"
      : "Reply ke " +
        (
          currentPartner
            ? currentPartner.name
            : "User"
        );


  activeReplyText.textContent =
    message.content;


  activeReply.classList.remove(
    "hidden"
  );


  messageInput.focus();

}


function cancelReply() {

  replyingTo =
    null;


  activeReply.classList.add(
    "hidden"
  );


  activeReplyText.textContent =
    "";

}


/* =========================================================
   LAST SEEN
========================================================= */

async function updateLastSeen() {

  if (!currentUser) {
    return;
  }


  await supabaseClient
    .from(
      "profiles"
    )
    .update({

      last_seen:
        new Date()
          .toISOString()

    })
    .eq(
      "id",
      currentUser.id
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  const ok =
    confirm(
      "Keluar dari akun?"
    );


  if (!ok) {
    return;
  }


  cleanupRealtime();


  clearInterval(
    heartbeatTimer
  );


  await supabaseClient
    .auth
    .signOut();


  location.reload();

}


/* =========================================================
   MOBILE BACK
========================================================= */

function closeMobileChat() {

  appScreen.classList.remove(
    "chat-open"
  );


  cancelReply();

}


/* =========================================================
   HELPERS
========================================================= */

function getInitial(name) {

  return name
    ? name
        .trim()
        .charAt(0)
        .toUpperCase()
    : "?";

}


function formatTime(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


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


  const diff =
    Date.now() -
    date.getTime();


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
   ERRORS
========================================================= */

function setLoginError(
  message
) {

  loginStatus.className =
    "small-status error";


  loginStatus.textContent =
    message;

}


function setRegisterError(
  message
) {

  registerStatus.className =
    "small-status error";


  registerStatus.textContent =
    message;

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
        event.key ===
        "Enter"
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
        event.key ===
        "Enter"
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
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );


cancelReplyButton
  .addEventListener(
    "click",
    cancelReply
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


/* =========================================================
   TAB ACTIVE
========================================================= */

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      await updateLastSeen();


      if (
        currentPartner
      ) {

        /*
        Safety sync ketika HP kembali
        dari background/sleep.
        */

        await loadMessages();

        await markAsRead();

      }


      await loadUsers();

    }

  }
);


/* =========================================================
   START
========================================================= */

init();

/* =========================================================
   PRIVATE CHAT
   SUPABASE REALTIME V2.4 FINAL

   - Realtime Message
   - Realtime Unread
   - Read Receipt
   - Presence Online / Offline
   - Last Seen Heartbeat
   - Typing Indicator
   - Reply
   - Copy
   - Edit
   - Delete
   - Emoji
   - Enter = Send
   - Shift + Enter = New Line
   - Shared Wallpaper
   - Browser Tab Notification
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
   APP CONSTANTS
========================================================= */

const APP_TITLE =
  "Private Chat";

const EMOJI_CHOICES = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙",
  "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
  "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕",
  "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭",
  "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
  "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥",
  "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮",
  "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
  "🤮", "🤧", "😷", "🤒", "🤕", "👍", "👎", "👏", "🙌",
  "👐", "🤝", "🙏", "✌️", "🤞", "🤟", "🤘", "👌", "👋",
  "💪", "👊", "✊", "❤️", "🧡", "💛", "💚", "💙", "💜",
  "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗",
  "💖", "💘", "💝", "💯", "💥", "💫", "💦", "💨", "🔥",
  "⭐", "✨", "🎉", "🎊", "🎁", "🎈", "✅", "❌", "⚡",
  "🌹", "🌸", "☀️", "🌈", "🍀", "🍕", "🍔", "🍟", "🍰",
  "☕", "🍻", "⚽", "🏆", "🎵", "🎮", "📷", "💬", "💡"
];

const CHAT_IMAGE_BUCKET =
  "chat-wallpapers";

const DEFAULT_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2300a884'/%3E%3Cpath d='M14 17h36v25H29L18 51v-9h-4z' fill='white'/%3E%3C/svg%3E";

const UNREAD_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2300a884'/%3E%3Cpath d='M14 17h36v25H29L18 51v-9h-4z' fill='white'/%3E%3Ccircle cx='51' cy='13' r='11' fill='%23e53935' stroke='white' stroke-width='4'/%3E%3C/svg%3E";


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
let editingMessage = null;
let selectedMessage = null;

let realtimeChannel = null;
let presenceChannel = null;

let onlineUsers =
  new Set();

let lastSeenTimer = null;

let typingTimer = null;
let remoteTypingTimer = null;

let isTyping = false;
let remoteUserTyping = false;

let currentRoomId = null;
let currentRoomSettings = null;

let selectedWallpaperFile = null;
let selectedWallpaperPreviewUrl = null;

let pastedImageFile = null;
let pastedImagePreviewUrl = null;


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

const editNameButton =
  document.getElementById(
    "editNameButton"
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

const activeEdit =
  document.getElementById(
    "activeEdit"
  );

const activeEditText =
  document.getElementById(
    "activeEditText"
  );

const cancelEditButton =
  document.getElementById(
    "cancelEditButton"
  );

const emojiButton =
  document.getElementById(
    "emojiButton"
  );

const emojiPanel =
  document.getElementById(
    "emojiPanel"
  );

const messageMenu =
  document.getElementById(
    "messageMenu"
  );

const messageMenuBackdrop =
  document.getElementById(
    "messageMenuBackdrop"
  );

const menuReply =
  document.getElementById(
    "menuReply"
  );

const menuCopy =
  document.getElementById(
    "menuCopy"
  );

const menuEdit =
  document.getElementById(
    "menuEdit"
  );

const menuDelete =
  document.getElementById(
    "menuDelete"
  );

const wallpaperButton =
  document.getElementById(
    "wallpaperButton"
  );

const wallpaperModal =
  document.getElementById(
    "wallpaperModal"
  );

const closeWallpaperModal =
  document.getElementById(
    "closeWallpaperModal"
  );

const wallpaperInput =
  document.getElementById(
    "wallpaperInput"
  );

const chooseWallpaperButton =
  document.getElementById(
    "chooseWallpaperButton"
  );

const saveWallpaperButton =
  document.getElementById(
    "saveWallpaperButton"
  );

const removeWallpaperButton =
  document.getElementById(
    "removeWallpaperButton"
  );

const wallpaperPreview =
  document.getElementById(
    "wallpaperPreview"
  );

const wallpaperStatus =
  document.getElementById(
    "wallpaperStatus"
  );

const appFavicon =
  document.getElementById(
    "appFavicon"
  );

const imagePastePreview =
  document.getElementById(
    "imagePastePreview"
  );

const imagePastePreviewImage =
  document.getElementById(
    "imagePastePreviewImage"
  );

const cancelImagePasteButton =
  document.getElementById(
    "cancelImagePasteButton"
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

    console.error(
      "Get session:",
      error
    );

    showLogin();

    return;
  }

  if (data.session) {

    currentUser =
      data.session.user;

    await startApp();

  } else {

    showLogin();
  }

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

          clearInterval(
            lastSeenTimer
          );

          clearTimeout(
            typingTimer
          );

          clearTimeout(
            remoteTypingTimer
          );

          currentUser = null;
          currentProfile = null;
          currentPartner = null;

          profiles = [];

          serverMessages = [];
          pendingMessages = [];

          onlineUsers.clear();

          resetNotificationIndicator();

          showLogin();
        }
      }
    );
}


/* =========================================================
   AUTH UI
========================================================= */

function showLogin() {

  loginScreen
    .classList
    .remove(
      "hidden"
    );

  appScreen
    .classList
    .add(
      "hidden"
    );

  loginForm
    .classList
    .remove(
      "hidden"
    );

  registerForm
    .classList
    .add(
      "hidden"
    );

  loginStatus.textContent = "";
  registerStatus.textContent = "";

  setTimeout(
    () =>
      loginEmail.focus(),
    100
  );
}


function showRegister() {

  loginForm
    .classList
    .add(
      "hidden"
    );

  registerForm
    .classList
    .remove(
      "hidden"
    );

  loginStatus.textContent = "";
  registerStatus.textContent = "";

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
    password !==
    password2
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

          email,

          password,

          options: {

            data: {
              name
            }
          }
        });

    if (error) {
      throw error;
    }

    if (data.session) {

      currentUser =
        data.user;

      await startApp();

      return;
    }

    registerStatus.className =
      "small-status success";

    registerStatus.textContent =
      "Akun dibuat. Silakan login.";

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

          email,

          password
        });

    if (error) {
      throw error;
    }

    currentUser =
      data.user;

    loginPassword.value = "";

    loginStatus.textContent = "";

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

  loginScreen
    .classList
    .add(
      "hidden"
    );

  appScreen
    .classList
    .remove(
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

  currentPartner = null;
  currentRoomId = null;

  appScreen
    .classList
    .remove(
      "chat-open"
    );

  conversation
    .classList
    .add(
      "hidden"
    );

  emptyChat
    .classList
    .remove(
      "hidden"
    );

  await updateLastSeen();

  await loadUsers();

  subscribeRealtime();

  subscribePresence();

  clearInterval(
    lastSeenTimer
  );

  /*
   * Heartbeat last seen.
   * Presence tetap menentukan Online.
   */
  lastSeenTimer =
    setInterval(
      async () => {

        await updateLastSeen();

        refreshStatusDisplay();

      },
      15000
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


async function editDisplayName() {

  if (
    !currentUser ||
    !currentProfile
  ) {
    return;
  }

  const enteredName =
    window.prompt(
      "Masukkan nama tampilan baru",
      currentProfile.name || ""
    );

  if (
    enteredName === null
  ) {
    return;
  }

  const name =
    enteredName
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  if (
    name.length < 2 ||
    name.length > 30
  ) {

    alert(
      "Nama harus terdiri dari 2 sampai 30 karakter."
    );

    return;
  }

  if (
    name === currentProfile.name
  ) {
    return;
  }

  editNameButton.disabled =
    true;

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "profiles"
        )
        .update({
          name
        })
        .eq(
          "id",
          currentUser.id
        )
        .select()
        .single();

    if (
      error
    ) {
      throw error;
    }

    currentProfile =
      data;

    myName.textContent =
      data.name;

  } catch (error) {

    console.error(
      "Update name:",
      error
    );

    alert(
      "Nama gagal diubah. Coba lagi."
    );

  } finally {

    editNameButton.disabled =
      false;
  }
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

  const oldProfiles =
    new Map(
      profiles.map(
        item => [
          item.id,
          item
        ]
      )
    );

  profiles =
    (data || [])
      .map(
        profile => {

          const old =
            oldProfiles.get(
              profile.id
            );

          return {

            ...profile,

            unread_count:
              old
                ? Number(
                    old.unread_count ||
                    0
                  )
                : 0,

            last_message:
              old
                ? old.last_message ||
                  ""
                : "",

            last_message_at:
              old
                ? old.last_message_at ||
                  ""
                : ""
          };
        }
      );

  await loadUserPreviews();
}


/* =========================================================
   PREVIEWS + UNREAD
========================================================= */
async function loadUserPreviews() {

  if (!currentUser) {
    return;
  }

  const rendered = [];

  for (const profile of profiles) {

    /* =========================
       AMBIL PESAN TERAKHIR
    ========================== */

    const {
      data: lastMessages,
      error: lastError
    } =
      await supabaseClient
        .from("messages")
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


    if (lastError) {

      console.error(
        "Last message:",
        lastError
      );
    }


    /* =========================
       HITUNG UNREAD
    ========================== */

    const {
      count,
      error: countError
    } =
      await supabaseClient
        .from("messages")
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


    if (countError) {

      console.error(
        "Unread:",
        countError
      );
    }


    /* =========================
       PESAN TERAKHIR
    ========================== */

    const last =
      lastMessages &&
      lastMessages.length > 0
        ? lastMessages[0]
        : null;


    rendered.push({

      ...profile,

      unread_count:
        count || 0,

      last_message:
        last
          ? getPreviewText(last)
          : "Belum ada pesan",

      last_message_at:
        last
          ? last.created_at
          : ""
    });
  }


  profiles =
    rendered;


  sortProfiles();

  renderUsers();

  updateNotificationIndicator();
}

/* =========================================================
   SORT USERS
========================================================= */

function sortProfiles() {

  profiles.sort(
    (
      a,
      b
    ) => {

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

      if (
        bTime !==
        aTime
      ) {

        return (
          bTime -
          aTime
        );
      }

      return (
        a.name || ""
      ).localeCompare(
        b.name || "",
        "id"
      );
    }
  );
}


/* =========================================================
   PRESENCE
========================================================= */

function subscribePresence() {

  if (
    presenceChannel
  ) {

    supabaseClient
      .removeChannel(
        presenceChannel
      );

    presenceChannel = null;
  }

  onlineUsers.clear();

  presenceChannel =
    supabaseClient.channel(
      "private-chat-presence",
      {

        config: {

          presence: {

            key:
              currentUser.id
          }
        }
      }
    );

  presenceChannel.on(
    "presence",
    {
      event: "sync"
    },
    syncOnlineUsers
  );

  presenceChannel.on(
    "presence",
    {
      event: "join"
    },
    syncOnlineUsers
  );

  presenceChannel.on(
    "presence",
    {
      event: "leave"
    },
    syncOnlineUsers
  );

  /*
   * Typing realtime
   */
  presenceChannel.on(
    "broadcast",
    {
      event: "typing"
    },
    payload => {

      handleRemoteTyping(
        payload.payload
      );
    }
  );

  presenceChannel.subscribe(
    async status => {

      console.log(
        "Presence:",
        status
      );

      if (
        status ===
        "SUBSCRIBED"
      ) {

        await presenceChannel
          .track({

            user_id:
              currentUser.id,

            name:
              currentProfile
                ? currentProfile.name
                : "User",

            online_at:
              new Date()
                .toISOString()
          });
      }
    }
  );
}


function syncOnlineUsers() {

  if (
    !presenceChannel
  ) {
    return;
  }

  const state =
    presenceChannel
      .presenceState();

  const users =
    new Set();

  Object.keys(
    state
  ).forEach(
    userId => {

      users.add(
        userId
      );
    }
  );

  onlineUsers =
    users;

  refreshStatusDisplay();
}


function isUserOnline(
  userId
) {

  return onlineUsers.has(
    userId
  );
}


/* =========================================================
   TYPING
========================================================= */

async function sendTypingState(
  typing
) {

  if (
    !presenceChannel ||
    !currentUser ||
    !currentPartner
  ) {
    return;
  }

  if (
    isTyping ===
    typing
  ) {
    return;
  }

  isTyping =
    typing;

  try {

    await presenceChannel
      .send({

        type:
          "broadcast",

        event:
          "typing",

        payload: {

          sender_id:
            currentUser.id,

          receiver_id:
            currentPartner.id,

          typing
        }
      });

  } catch (error) {

    console.log(
      "Typing:",
      error
    );
  }
}


function handleLocalTyping() {

  if (
    !currentPartner
  ) {
    return;
  }

  const hasText =
    messageInput
      .value
      .trim()
      .length > 0;

  clearTimeout(
    typingTimer
  );

  if (!hasText) {

    sendTypingState(
      false
    );

    return;
  }

  sendTypingState(
    true
  );

  typingTimer =
    setTimeout(
      () => {

        sendTypingState(
          false
        );

      },
      1500
    );
}


function handleRemoteTyping(
  payload
) {

  if (
    !payload ||
    !currentUser ||
    !currentPartner
  ) {
    return;
  }

  if (
    payload.receiver_id !==
    currentUser.id
  ) {
    return;
  }

  if (
    payload.sender_id !==
    currentPartner.id
  ) {
    return;
  }

  clearTimeout(
    remoteTypingTimer
  );

  remoteUserTyping =
    Boolean(
      payload.typing
    );

  if (
    remoteUserTyping
  ) {

    partnerStatus.textContent =
      "mengetik...";

    remoteTypingTimer =
      setTimeout(
        () => {

          remoteUserTyping =
            false;

          refreshPartnerStatus();

        },
        2500
      );

  } else {

    refreshPartnerStatus();
  }
}


/* =========================================================
   USER STATUS
========================================================= */

function refreshStatusDisplay() {

  renderUsers();

  refreshPartnerStatus();
}


function refreshPartnerStatus() {

  if (
    !currentPartner
  ) {
    return;
  }

  if (
    remoteUserTyping
  ) {

    partnerStatus.textContent =
      "mengetik...";

    return;
  }

  partnerStatus.textContent =
    getUserStatus(
      currentPartner
    );
}


function getUserStatus(
  user
) {

  if (!user) {
    return "";
  }

  if (
    isUserOnline(
      user.id
    )
  ) {

    return "Online";
  }

  return formatLastSeen(
    user.last_seen
  );
}


/* =========================================================
   RENDER USERS
========================================================= */
function renderUsers() {

  userList.innerHTML = "";

  if (!profiles.length) {

    userList.innerHTML = `
      <div class="center-info">
        Belum ada user lain.
        <br><br>
        Daftarkan akun kedua.
      </div>
    `;

    updateNotificationIndicator();

    return;
  }

  profiles.forEach(
    user => {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "user-item";

      if (
        currentPartner &&
        currentPartner.id === user.id
      ) {

        button.classList.add(
          "active"
        );
      }


      /* =========================
         AVATAR
      ========================== */

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


      /* =========================
         USER INFO
      ========================== */

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "user-info";


      /* =========================
         TOP ROW
      ========================== */

      const top =
        document.createElement(
          "div"
        );

      top.className =
        "user-row-top";


      /* =========================
         NAME + ONLINE DOT
      ========================== */

      const nameWrap =
        document.createElement(
          "div"
        );

      nameWrap.className =
        "user-name-wrap";


      const name =
        document.createElement(
          "div"
        );

      name.className =
        "user-name";

      name.textContent =
        user.name;

      nameWrap.appendChild(
        name
      );


      /*
       * ONLINE
       *
       * Tidak lagi menulis "Online".
       * Cukup tampilkan titik hijau.
       */
      if (
        isUserOnline(
          user.id
        )
      ) {

        const onlineDot =
          document.createElement(
            "span"
          );

        onlineDot.className =
          "online-dot";

        onlineDot.title =
          "Online";

        nameWrap.appendChild(
          onlineDot
        );
      }


      top.appendChild(
        nameWrap
      );


      /* =========================
         UNREAD BADGE
      ========================== */

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
            : String(unread);

        top.appendChild(
          badge
        );
      }


      info.appendChild(
        top
      );


      /* =========================
         LAST CHAT
      ========================== */

      const lastMessage =
        document.createElement(
          "div"
        );

      lastMessage.className =
        "user-last-message";

      /*
       * Baris kedua SELALU last chat.
       *
       * Online/offline tidak mengganti
       * preview pesan lagi.
       */
      if (user.last_message) {

        lastMessage.textContent =
          user.last_message;

      } else {

        lastMessage.textContent =
          "Belum ada pesan";
      }


      info.appendChild(
        lastMessage
      );


      /* =========================
         BUILD USER
      ========================== */

      button.appendChild(
        avatar
      );

      button.appendChild(
        info
      );


      button.addEventListener(
        "click",
        () => {

          openChat(
            user
          );
        }
      );


      userList.appendChild(
        button
      );
    }
  );


  updateNotificationIndicator();
}

/* =========================================================
   OPEN CHAT
========================================================= */

async function openChat(
  user
) {

  if (
    currentPartner
  ) {

    await sendTypingState(
      false
    );
  }

  const freshUser =
    profiles.find(
      item =>
        item.id ===
        user.id
    ) || user;

  currentPartner = {
    ...freshUser
  };

  currentRoomId =
    makeRoomId(
      currentUser.id,
      currentPartner.id
    );

  serverMessages = [];
  pendingMessages = [];

  cancelReply();
  cancelEdit();

  closeEmojiPanel();
  closeMessageMenu();

  remoteUserTyping =
    false;

  clearPastedImage();

  partnerName.textContent =
    currentPartner.name;

  partnerInitial.textContent =
    getInitial(
      currentPartner.name
    );

  refreshPartnerStatus();

  emptyChat
    .classList
    .add(
      "hidden"
    );

  conversation
    .classList
    .remove(
      "hidden"
    );

  appScreen
    .classList
    .add(
      "chat-open"
    );

  messagesElement.innerHTML =
    `
      <div class="no-message">
        Memuat percakapan...
      </div>
    `;

  setProfileUnread(
    currentPartner.id,
    0
  );

  renderUsers();

  await ensureRoomSettings();

  await loadMessages();

  await markAsRead();

  updateNotificationIndicator();

  messageInput.focus();
}


/* =========================================================
   CLOSE CHAT
========================================================= */

async function closeMobileChat() {

  await sendTypingState(
    false
  );

  currentPartner = null;
  currentRoomId = null;
  currentRoomSettings = null;

  serverMessages = [];
  pendingMessages = [];

  remoteUserTyping =
    false;

  cancelReply();
  cancelEdit();

  closeEmojiPanel();
  closeMessageMenu();

  resetWallpaper();

  appScreen
    .classList
    .remove(
      "chat-open"
    );

  conversation
    .classList
    .add(
      "hidden"
    );

  emptyChat
    .classList
    .remove(
      "hidden"
    );

  partnerName.textContent = "";
  partnerInitial.textContent = "";
  partnerStatus.textContent = "";

  messagesElement.innerHTML =
    "";

  renderUsers();
}


/* =========================================================
   LOAD MESSAGES
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
   REALTIME SUBSCRIPTION
========================================================= */

function subscribeRealtime() {

  if (
    realtimeChannel
  ) {

    supabaseClient
      .removeChannel(
        realtimeChannel
      );

    realtimeChannel = null;
  }

  realtimeChannel =
    supabaseClient
      .channel(
        "private-chat-realtime-" +
        currentUser.id
      )

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        payload => {

          handleRealtimeInsert(
            payload.new
          );
        }
      )

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages"
        },
        payload => {

          handleRealtimeUpdate(
            payload.new
          );
        }
      )

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages"
        },
        payload => {

          handleRealtimeDelete(
            payload.old
          );
        }
      )

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles"
        },
        payload => {

          handleProfileUpdate(
            payload.new
          );
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_settings"
        },
        payload => {

          handleRoomSettingsRealtime(
            payload
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

  if (
    !currentUser
  ) {
    return;
  }

  const involvesMe =
    message.sender_id ===
      currentUser.id
    ||
    message.receiver_id ===
      currentUser.id;

  if (
    !involvesMe
  ) {
    return;
  }

  const partnerId =
    message.sender_id ===
      currentUser.id
      ? message.receiver_id
      : message.sender_id;

  updateSidebarFromMessage(
    message
  );

  const roomIsOpen =
    currentPartner &&
    currentPartner.id ===
      partnerId &&
    appScreen
      .classList
      .contains(
        "chat-open"
      );

  /*
   * Room sedang dibuka.
   */
  if (
    roomIsOpen
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
     * Jika chat terlihat,
     * pesan langsung dianggap dibaca.
     */
    if (
      message.sender_id ===
      partnerId
      &&
      message.receiver_id ===
      currentUser.id
      &&
      document.visibilityState ===
      "visible"
    ) {

      setProfileUnread(
        partnerId,
        0
      );

      renderUsers();

      markAsRead();

    /*
     * Room terbuka tetapi browser
     * sedang di tab lain.
     * Tetap beri unread notification.
     */
    } else if (
      message.sender_id ===
      partnerId
      &&
      message.receiver_id ===
      currentUser.id
    ) {

      incrementProfileUnread(
        partnerId
      );

      renderUsers();
    }

  /*
   * Room tidak sedang dibuka.
   */
  } else {

    if (
      message.receiver_id ===
      currentUser.id
      &&
      message.sender_id ===
      partnerId
    ) {

      incrementProfileUnread(
        partnerId
      );
    }

    sortProfiles();

    renderUsers();
  }

  updateNotificationIndicator();
}


/* =========================================================
   REALTIME UPDATE
========================================================= */

function handleRealtimeUpdate(
  message
) {

  if (
    !currentUser
  ) {
    return;
  }

  const involvesMe =
    message.sender_id ===
      currentUser.id
    ||
    message.receiver_id ===
      currentUser.id;

  if (
    !involvesMe
  ) {
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

  updateSidebarFromMessage(
    message
  );

  if (
    currentPartner &&
    currentPartner.id ===
    message.sender_id &&
    message.receiver_id ===
    currentUser.id &&
    message.read_at
  ) {

    setProfileUnread(
      message.sender_id,
      0
    );
  }

  sortProfiles();

  renderUsers();

  updateNotificationIndicator();
}


/* =========================================================
   REALTIME DELETE
========================================================= */

async function handleRealtimeDelete(
  oldMessage
) {

  if (
    !oldMessage ||
    !oldMessage.id
  ) {
    return;
  }

  serverMessages =
    serverMessages.filter(
      item =>
        item.id !==
        oldMessage.id
    );

  renderMessages(
    false
  );

  await loadUsers();
}


/* =========================================================
   SIDEBAR MESSAGE
========================================================= */

function updateSidebarFromMessage(
  message
) {

  if (
    !currentUser
  ) {
    return;
  }

  const partnerId =
    message.sender_id ===
      currentUser.id
      ? message.receiver_id
      : message.sender_id;

  const index =
    profiles.findIndex(
      item =>
        item.id ===
        partnerId
    );

  if (
    index === -1
  ) {

    loadUsers();

    return;
  }

  profiles[index] = {

    ...profiles[index],

    last_message:
      getPreviewText(
        message
      ),

    last_message_at:
      message.created_at
  };

  sortProfiles();

  renderUsers();
}


/* =========================================================
   UNREAD
========================================================= */

function incrementProfileUnread(
  profileId
) {

  const index =
    profiles.findIndex(
      item =>
        item.id ===
        profileId
    );

  if (
    index === -1
  ) {
    return;
  }

  profiles[index]
    .unread_count =
      Number(
        profiles[index]
          .unread_count ||
        0
      ) + 1;

  updateNotificationIndicator();
}


function setProfileUnread(
  profileId,
  value
) {

  const index =
    profiles.findIndex(
      item =>
        item.id ===
        profileId
    );

  if (
    index === -1
  ) {
    return;
  }

  profiles[index]
    .unread_count =
      Number(
        value
      ) || 0;

  updateNotificationIndicator();
}


/* =========================================================
   BROWSER TAB NOTIFICATION

   Ada unread:
   ● Private Chat

   Tidak ada unread:
   Private Chat
========================================================= */

function getTotalUnread() {

  return profiles.reduce(
    (
      total,
      profile
    ) => {

      return (
        total +
        Number(
          profile.unread_count ||
          0
        )
      );

    },
    0
  );
}


function updateNotificationIndicator() {

  const totalUnread =
    getTotalUnread();

  if (
    totalUnread > 0
  ) {

    /*
     * Judul tab.
     *
     * Contoh:
     * ● Private Chat
     */
    document.title =
      "● " +
      APP_TITLE;

    /*
     * Titik merah pada favicon.
     */
    if (
      appFavicon
    ) {

      appFavicon.href =
        UNREAD_FAVICON;
    }

  } else {

    resetNotificationIndicator();
  }
}


function resetNotificationIndicator() {

  document.title =
    APP_TITLE;

  if (
    appFavicon
  ) {

    appFavicon.href =
      DEFAULT_FAVICON;
  }
}


/* =========================================================
   PROFILE UPDATE
========================================================= */

function handleProfileUpdate(
  profile
) {

  if (
    !profile
  ) {
    return;
  }

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
      ...profile,

      unread_count:
        profiles[index]
          .unread_count ||
        0,

      last_message:
        profiles[index]
          .last_message ||
        "",

      last_message_at:
        profiles[index]
          .last_message_at ||
        ""
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

    refreshPartnerStatus();
  }

  renderUsers();
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

    realtimeChannel = null;
  }

  if (
    presenceChannel
  ) {

    presenceChannel
      .untrack()
      .catch(
        () => {}
      );

    supabaseClient
      .removeChannel(
        presenceChannel
      );

    presenceChannel = null;
  }

  onlineUsers.clear();
}


/* =========================================================
   RECONCILE PENDING
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

function clearPastedImage() {

  pastedImageFile =
    null;

  if (
    pastedImagePreviewUrl
  ) {

    URL.revokeObjectURL(
      pastedImagePreviewUrl
    );
  }

  pastedImagePreviewUrl =
    null;

  imagePastePreviewImage.removeAttribute(
    "src"
  );

  imagePastePreview
    .classList
    .add(
      "hidden"
    );
}


function showPastedImage(
  file
) {

  clearPastedImage();

  pastedImageFile =
    file;

  pastedImagePreviewUrl =
    URL.createObjectURL(
      file
    );

  imagePastePreviewImage.src =
    pastedImagePreviewUrl;

  imagePastePreview
    .classList
    .remove(
      "hidden"
    );
}


async function uploadPastedImage(
  file
) {

  if (
    !currentRoomId
  ) {
    throw new Error(
      "Ruang chat belum siap."
    );
  }

  const extension =
    getFileExtension(
      file
    );

  const path =
    currentRoomId +
    "/" +
    "message-" +
    crypto.randomUUID() +
    "." +
    extension;

  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from(
        CHAT_IMAGE_BUCKET
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false
        }
      );

  if (
    uploadError
  ) {
    throw uploadError;
  }

  const {
    data
  } =
    supabaseClient
      .storage
      .from(
        CHAT_IMAGE_BUCKET
      )
      .getPublicUrl(
        path
      );

  return data.publicUrl;
}

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

  if (
    !content &&
    !pastedImageFile
  ) {
    return;
  }

  /*
   * Jika mode edit,
   * Enter / tombol Send
   * menyimpan edit.
   */
  if (
    editingMessage
  ) {

    await saveEditedMessage(
      content
    );

    return;
  }

  const imageFile =
    pastedImageFile;

  let type =
    "text";

  let imageUrl =
    null;

  if (
    imageFile
  ) {

    sendButton.disabled =
      true;

    try {

      imageUrl =
        await uploadPastedImage(
          imageFile
        );

      type =
        "image";

    } catch (error) {

      console.error(
        "Image upload:",
        error
      );

      alert(
        "Gambar gagal diunggah. Coba lagi."
      );

      return;

    } finally {

      sendButton.disabled =
        false;
    }
  }

  await sendTypingState(
    false
  );

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

    type,

    content,

    image_url:
      imageUrl,

    reply_to:
      replyId,

    created_at:
      new Date()
        .toISOString(),

    edited_at:
      null,

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

  updateSidebarFromMessage(
    optimistic
  );

  messageInput.value =
    "";

  autoResizeMessageInput();

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

        type,

        content,

        image_url:
          imageUrl,

        reply_to:
          replyId
      })
      .select()
      .single();

  if (
    error
  ) {

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

    if (
      failed
    ) {

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

  if (
    data
  ) {

    if (
      imageFile
    ) {

      clearPastedImage();
    }

    if (
      currentPartner &&
      currentPartner.id ===
      partnerSnapshot.id
    ) {

      const exists =
        serverMessages.some(
          item =>
            item.id ===
            data.id
        );

      if (
        !exists
      ) {

        serverMessages.push(
          data
        );
      }

      reconcilePending();

      renderMessages(
        true
      );
    }

    updateSidebarFromMessage(
      data
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

  if (
    !appScreen
      .classList
      .contains(
        "chat-open"
      )
  ) {
    return;
  }

  const partnerId =
    currentPartner.id;

  setProfileUnread(
    partnerId,
    0
  );

  renderUsers();

  updateNotificationIndicator();

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
        partnerId
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .is(
        "read_at",
        null
      );

  if (
    error
  ) {

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

  if (
    !currentPartner
  ) {
    return;
  }

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
    (
      a,
      b
    ) =>

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

  if (
    !allMessages.length
  ) {

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

      /*
       * mine = pesan yang saya kirim.
       *
       * CSS:
       * mine = biru
       * other = putih
       */
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


      /* =========================
         REPLY PREVIEW
      ========================== */

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

        if (
          original
        ) {

          replyName.textContent =
            original.sender_id ===
            currentUser.id
              ? "Kamu"
              : currentPartner
                ? currentPartner.name
                : "User";

          replyText.textContent =
            getPreviewText(
              original
            );

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


      /* =========================
         MESSAGE IMAGE
      ========================== */

      if (
        message.type ===
        "image"
        &&
        message.image_url
      ) {

        const image =
          document.createElement(
            "img"
          );

        image.className =
          "message-image";

        image.src =
          message.image_url;

        image.alt =
          message.content ||
          "Gambar chat";

        image.loading =
          "lazy";

        bubble.appendChild(
          image
        );
      }


      /* =========================
         MESSAGE TEXT / CAPTION
      ========================== */

      const text =
        document.createElement(
          "div"
        );

      text.className =
        "message-text";

      if (
        message.content
      ) {

        text.textContent =
          message.content;

        bubble.appendChild(
          text
        );
      }


      /* =========================
         META
      ========================== */

      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "message-meta";

      if (
        message.edited_at
      ) {

        const edited =
          document.createElement(
            "span"
          );

        edited.className =
          "edited-label";

        edited.textContent =
          "diedit";

        meta.appendChild(
          edited
        );
      }

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

      if (
        mine
      ) {

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


      /* =========================
         MESSAGE MENU
      ========================== */

      if (
        message.id &&
        !message.pending &&
        !message.failed
      ) {

        bubble.addEventListener(
          "click",
          event => {

            openMessageMenu(
              event,
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
   MESSAGE MENU
========================================================= */

function openMessageMenu(
  event,
  message
) {

  selectedMessage = {
    ...message
  };

  menuEdit
    .classList
    .toggle(
      "hidden",
      message.sender_id !==
      currentUser.id
    );

  menuDelete
    .classList
    .toggle(
      "hidden",
      message.sender_id !==
      currentUser.id
    );

  messageMenuBackdrop
    .classList
    .remove(
      "hidden"
    );

  messageMenu
    .classList
    .remove(
      "hidden"
    );

  if (
    window.innerWidth > 700
  ) {

    const rect =
      event.currentTarget
        .getBoundingClientRect();

    const menuWidth =
      190;

    const estimatedHeight =
      210;

    let left =
      rect.left;

    if (
      left + menuWidth >
      window.innerWidth - 10
    ) {

      left =
        window.innerWidth -
        menuWidth -
        10;
    }

    left =
      Math.max(
        10,
        left
      );

    let top =
      rect.bottom + 5;

    if (
      top +
      estimatedHeight >
      window.innerHeight
    ) {

      top =
        Math.max(
          10,
          rect.top -
          estimatedHeight
        );
    }

    messageMenu.style.left =
      left + "px";

    messageMenu.style.top =
      top + "px";
  }
}


function closeMessageMenu() {

  selectedMessage =
    null;

  messageMenu
    .classList
    .add(
      "hidden"
    );

  messageMenuBackdrop
    .classList
    .add(
      "hidden"
    );

  messageMenu.style.left =
    "";

  messageMenu.style.top =
    "";
}


/* =========================================================
   REPLY
========================================================= */

function startReply(
  message
) {

  if (
    !currentPartner
  ) {
    return;
  }

  cancelEdit();

  replyingTo = {
    ...message
  };

  activeReplyTitle.textContent =
    message.sender_id ===
    currentUser.id
      ? "Reply ke pesan kamu"
      : "Reply ke " +
        currentPartner.name;

  activeReplyText.textContent =
    message.content;

  activeReply
    .classList
    .remove(
      "hidden"
    );

  messageInput.focus();
}


function cancelReply() {

  replyingTo =
    null;

  activeReply
    .classList
    .add(
      "hidden"
    );

  activeReplyText.textContent =
    "";
}


/* =========================================================
   EDIT
========================================================= */

function startEdit(
  message
) {

  if (
    !message ||
    !message.id ||
    message.sender_id !==
    currentUser.id
  ) {
    return;
  }

  cancelReply();

  editingMessage = {
    ...message
  };

  activeEditText.textContent =
    message.content;

  activeEdit
    .classList
    .remove(
      "hidden"
    );

  messageInput.value =
    message.content;

  autoResizeMessageInput();

  messageInput.focus();

  const length =
    messageInput
      .value
      .length;

  messageInput
    .setSelectionRange(
      length,
      length
    );
}


function cancelEdit() {

  editingMessage =
    null;

  activeEdit
    .classList
    .add(
      "hidden"
    );

  activeEditText.textContent =
    "";

  if (
    messageInput
  ) {

    messageInput.value =
      "";

    autoResizeMessageInput();
  }
}


async function saveEditedMessage(
  content
) {

  if (
    !editingMessage ||
    !currentUser
  ) {
    return;
  }

  const messageId =
    editingMessage.id;

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "messages"
      )
      .update({

        content,

        edited_at:
          new Date()
            .toISOString()
      })
      .eq(
        "id",
        messageId
      )
      .eq(
        "sender_id",
        currentUser.id
      )
      .select()
      .single();

  if (
    error
  ) {

    console.error(
      "Edit:",
      error
    );

    alert(
      "Pesan gagal diedit."
    );

    return;
  }

  const index =
    serverMessages.findIndex(
      item =>
        item.id ===
        messageId
    );

  if (
    index !== -1 &&
    data
  ) {

    serverMessages[index] =
      data;
  }

  editingMessage =
    null;

  activeEdit
    .classList
    .add(
      "hidden"
    );

  activeEditText.textContent =
    "";

  messageInput.value =
    "";

  autoResizeMessageInput();

  renderMessages(
    false
  );

  if (
    data
  ) {

    updateSidebarFromMessage(
      data
    );
  }

  messageInput.focus();
}


/* =========================================================
   DELETE
========================================================= */

async function deleteMessage(
  message
) {

  if (
    !message ||
    !message.id ||
    message.sender_id !==
    currentUser.id
  ) {
    return;
  }

  const ok =
    confirm(
      "Hapus pesan ini?"
    );

  if (
    !ok
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
      .delete()
      .eq(
        "id",
        message.id
      )
      .eq(
        "sender_id",
        currentUser.id
      );

  if (
    error
  ) {

    console.error(
      "Delete:",
      error
    );

    alert(
      "Pesan gagal dihapus."
    );

    return;
  }

  serverMessages =
    serverMessages.filter(
      item =>
        item.id !==
        message.id
    );

  if (
    replyingTo &&
    replyingTo.id ===
    message.id
  ) {

    cancelReply();
  }

  if (
    editingMessage &&
    editingMessage.id ===
    message.id
  ) {

    cancelEdit();
  }

  renderMessages(
    false
  );

  await loadUsers();
}


/* =========================================================
   COPY
========================================================= */

async function copyMessage(
  message
) {

  if (
    !message
  ) {
    return;
  }

  const content =
    String(
      message.content ||
      ""
    );

  try {

    await navigator
      .clipboard
      .writeText(
        content
      );

  } catch (error) {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      content;

    document.body
      .appendChild(
        textarea
      );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();
  }
}


/* =========================================================
   EMOJI
========================================================= */

function renderEmojiPanel() {

  emojiPanel.innerHTML =
    "";

  EMOJI_CHOICES.forEach(
    emoji => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.dataset.emoji =
        emoji;

      button.setAttribute(
        "aria-label",
        emoji
      );

      button.textContent =
        emoji;

      button.addEventListener(
        "click",
        () => {

          insertEmoji(
            emoji
          );
        }
      );

      if (
        window.twemoji
      ) {

        window.twemoji.parse(
          button,
          {
            folder: "svg",
            ext: ".svg"
          }
        );
      }

      emojiPanel.appendChild(
        button
      );
    }
  );
}

function toggleEmojiPanel() {

  emojiPanel
    .classList
    .toggle(
      "hidden"
    );
}


function closeEmojiPanel() {

  emojiPanel
    .classList
    .add(
      "hidden"
    );
}


function insertEmoji(
  emoji
) {

  const start =
    messageInput
      .selectionStart;

  const end =
    messageInput
      .selectionEnd;

  messageInput
    .setRangeText(
      emoji,
      start,
      end,
      "end"
    );

  messageInput.focus();

  autoResizeMessageInput();

  handleLocalTyping();
}


/* =========================================================
   TEXTAREA
========================================================= */

function autoResizeMessageInput() {

  messageInput.style.height =
    "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      120
    ) + "px";
}


/* =========================================================
   SHARED WALLPAPER
========================================================= */

function makeRoomId(
  a,
  b
) {

  return [
    a,
    b
  ]
    .sort()
    .join("_");
}


function getRoomUsers() {

  const ids = [
    currentUser.id,
    currentPartner.id
  ].sort();

  return {

    user1:
      ids[0],

    user2:
      ids[1]
  };
}


async function ensureRoomSettings() {

  if (
    !currentUser ||
    !currentPartner ||
    !currentRoomId
  ) {
    return;
  }

  const roomIdSnapshot =
    currentRoomId;

  const {
    user1,
    user2
  } =
    getRoomUsers();

  const {
    error: insertError
  } =
    await supabaseClient
      .from(
        "room_settings"
      )
      .upsert(
        {

          room_id:
            roomIdSnapshot,

          user_1:
            user1,

          user_2:
            user2
        },
        {

          onConflict:
            "room_id",

          ignoreDuplicates:
            true
        }
      );

  if (
    insertError
  ) {

    console.error(
      "Room settings create:",
      insertError
    );
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "room_settings"
      )
      .select("*")
      .eq(
        "room_id",
        roomIdSnapshot
      )
      .maybeSingle();

  if (
    error
  ) {

    console.error(
      "Room settings:",
      error
    );

    return;
  }

  if (
    currentRoomId !==
    roomIdSnapshot
  ) {
    return;
  }

  currentRoomSettings =
    data || null;

  applyRoomWallpaper(
    currentRoomSettings
      ? currentRoomSettings
          .wallpaper_path
      : null
  );
}


function handleRoomSettingsRealtime(
  payload
) {

  const row =
    payload.new ||
    payload.old;

  if (
    !row ||
    !currentRoomId ||
    row.room_id !==
    currentRoomId
  ) {
    return;
  }

  if (
    payload.eventType ===
    "DELETE"
  ) {

    currentRoomSettings =
      null;

    applyRoomWallpaper(
      null
    );

    return;
  }

  currentRoomSettings = {
    ...row
  };

  applyRoomWallpaper(
    row.wallpaper_path
  );
}


function getWallpaperPublicUrl(
  path
) {

  if (
    !path
  ) {
    return "";
  }

  const {
    data
  } =
    supabaseClient
      .storage
      .from(
        "chat-wallpapers"
      )
      .getPublicUrl(
        path
      );

  return data
    ? data.publicUrl
    : "";
}


function applyRoomWallpaper(
  path
) {

  if (
    !path
  ) {

    resetWallpaper();

    return;
  }

  const url =
    getWallpaperPublicUrl(
      path
    );

  if (
    !url
  ) {

    resetWallpaper();

    return;
  }

  messagesElement
    .style
    .backgroundImage =
      `url("${url}")`;
}


function resetWallpaper() {

  messagesElement
    .style
    .backgroundImage =
      "none";
}


function openWallpaperModal() {

  if (
    !currentPartner
  ) {
    return;
  }

  selectedWallpaperFile =
    null;

  clearWallpaperPreviewUrl();

  wallpaperStatus.textContent =
    "";

  saveWallpaperButton
    .classList
    .add(
      "hidden"
    );

  renderWallpaperModalPreview();

  wallpaperModal
    .classList
    .remove(
      "hidden"
    );
}


function closeWallpaperDialog() {

  wallpaperModal
    .classList
    .add(
      "hidden"
    );

  selectedWallpaperFile =
    null;

  clearWallpaperPreviewUrl();

  wallpaperInput.value =
    "";

  wallpaperStatus.textContent =
    "";

  saveWallpaperButton
    .classList
    .add(
      "hidden"
    );
}


function renderWallpaperModalPreview() {

  wallpaperPreview
    .style
    .backgroundImage =
      "none";

  wallpaperPreview.innerHTML =
    "<span>Belum ada wallpaper</span>";

  if (
    selectedWallpaperPreviewUrl
  ) {

    wallpaperPreview.innerHTML =
      "";

    wallpaperPreview
      .style
      .backgroundImage =
        `url("${selectedWallpaperPreviewUrl}")`;

    return;
  }

  if (
    currentRoomSettings &&
    currentRoomSettings
      .wallpaper_path
  ) {

    const url =
      getWallpaperPublicUrl(
        currentRoomSettings
          .wallpaper_path
      );

    wallpaperPreview.innerHTML =
      "";

    wallpaperPreview
      .style
      .backgroundImage =
        `url("${url}")`;
  }
}


function handleWallpaperSelection() {

  const file =
    wallpaperInput
      .files[0];

  if (
    !file
  ) {
    return;
  }

  const allowed = [

    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (
    !allowed.includes(
      file.type
    )
  ) {

    alert(
      "Format wallpaper harus JPG, PNG, WEBP, atau GIF."
    );

    wallpaperInput.value =
      "";

    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {

    alert(
      "Ukuran wallpaper maksimal 5 MB."
    );

    wallpaperInput.value =
      "";

    return;
  }

  selectedWallpaperFile =
    file;

  clearWallpaperPreviewUrl();

  selectedWallpaperPreviewUrl =
    URL.createObjectURL(
      file
    );

  renderWallpaperModalPreview();

  saveWallpaperButton
    .classList
    .remove(
      "hidden"
    );
}


function clearWallpaperPreviewUrl() {

  if (
    selectedWallpaperPreviewUrl
  ) {

    URL.revokeObjectURL(
      selectedWallpaperPreviewUrl
    );

    selectedWallpaperPreviewUrl =
      null;
  }
}


async function saveWallpaper() {

  if (
    !selectedWallpaperFile ||
    !currentRoomId
  ) {
    return;
  }

  saveWallpaperButton.disabled =
    true;

  chooseWallpaperButton.disabled =
    true;

  wallpaperStatus.textContent =
    "Mengupload wallpaper...";

  const oldPath =
    currentRoomSettings
      ? currentRoomSettings
          .wallpaper_path
      : null;

  try {

    const extension =
      getFileExtension(
        selectedWallpaperFile
      );

    const path =
      currentRoomId +
      "/" +
      Date.now() +
      "-" +
      crypto.randomUUID() +
      "." +
      extension;

    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from(
          "chat-wallpapers"
        )
        .upload(
          path,
          selectedWallpaperFile,
          {

            cacheControl:
              "3600",

            upsert:
              false
          }
        );

    if (
      uploadError
    ) {
      throw uploadError;
    }

    const {
      data,
      error: updateError
    } =
      await supabaseClient
        .from(
          "room_settings"
        )
        .update({

          wallpaper_path:
            path,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "room_id",
          currentRoomId
        )
        .select()
        .single();

    if (
      updateError
    ) {

      await supabaseClient
        .storage
        .from(
          "chat-wallpapers"
        )
        .remove([
          path
        ]);

      throw updateError;
    }

    currentRoomSettings =
      data;

    applyRoomWallpaper(
      path
    );

    if (
      oldPath &&
      oldPath !==
      path
    ) {

      await supabaseClient
        .storage
        .from(
          "chat-wallpapers"
        )
        .remove([
          oldPath
        ]);
    }

    wallpaperStatus.textContent =
      "Wallpaper berhasil diterapkan.";

    selectedWallpaperFile =
      null;

    clearWallpaperPreviewUrl();

    wallpaperInput.value =
      "";

    saveWallpaperButton
      .classList
      .add(
        "hidden"
      );

    renderWallpaperModalPreview();

  } catch (error) {

    console.error(
      "Wallpaper:",
      error
    );

    wallpaperStatus.textContent =
      "Wallpaper gagal diterapkan.";

  } finally {

    saveWallpaperButton.disabled =
      false;

    chooseWallpaperButton.disabled =
      false;
  }
}


async function removeWallpaper() {

  if (
    !currentRoomId
  ) {
    return;
  }

  const oldPath =
    currentRoomSettings
      ? currentRoomSettings
          .wallpaper_path
      : null;

  if (
    !oldPath
  ) {

    resetWallpaper();

    wallpaperStatus.textContent =
      "Wallpaper sudah kosong.";

    return;
  }

  const ok =
    confirm(
      "Hapus wallpaper room ini?"
    );

  if (
    !ok
  ) {
    return;
  }

  removeWallpaperButton.disabled =
    true;

  wallpaperStatus.textContent =
    "Menghapus wallpaper...";

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "room_settings"
        )
        .update({

          wallpaper_path:
            null,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "room_id",
          currentRoomId
        )
        .select()
        .single();

    if (
      error
    ) {
      throw error;
    }

    currentRoomSettings =
      data;

    resetWallpaper();

    await supabaseClient
      .storage
      .from(
        "chat-wallpapers"
      )
      .remove([
        oldPath
      ]);

    wallpaperStatus.textContent =
      "Wallpaper dihapus.";

    renderWallpaperModalPreview();

  } catch (error) {

    console.error(
      "Remove wallpaper:",
      error
    );

    wallpaperStatus.textContent =
      "Wallpaper gagal dihapus.";

  } finally {

    removeWallpaperButton.disabled =
      false;
  }
}


function getFileExtension(
  file
) {

  const name =
    String(
      file.name ||
      ""
    );

  const extension =
    name
      .split(".")
      .pop()
      .toLowerCase();

  const safe = [

    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif"
  ];

  if (
    safe.includes(
      extension
    )
  ) {

    return extension;
  }

  if (
    file.type ===
    "image/png"
  ) {

    return "png";
  }

  if (
    file.type ===
    "image/webp"
  ) {

    return "webp";
  }

  if (
    file.type ===
    "image/gif"
  ) {

    return "gif";
  }

  return "jpg";
}


/* =========================================================
   LAST SEEN
========================================================= */

async function updateLastSeen() {

  if (
    !currentUser
  ) {
    return;
  }

  const now =
    new Date()
      .toISOString();

  if (
    currentProfile
  ) {

    currentProfile.last_seen =
      now;
  }

  const {
    error
  } =
    await supabaseClient
      .from(
        "profiles"
      )
      .update({

        last_seen:
          now
      })
      .eq(
        "id",
        currentUser.id
      );

  if (
    error
  ) {

    console.error(
      "Last seen:",
      error
    );
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  const ok =
    confirm(
      "Keluar dari akun?"
    );

  if (
    !ok
  ) {
    return;
  }

  await sendTypingState(
    false
  );

  await updateLastSeen();

  if (
    presenceChannel
  ) {

    try {

      await presenceChannel
        .untrack();

    } catch (error) {

      console.log(
        "Presence untrack:",
        error
      );
    }
  }

  cleanupRealtime();

  clearInterval(
    lastSeenTimer
  );

  currentPartner =
    null;

  serverMessages = [];
  pendingMessages = [];

  await supabaseClient
    .auth
    .signOut();

  location.reload();
}


/* =========================================================
   PAGE HIDE
========================================================= */

window.addEventListener(
  "pagehide",
  () => {

    if (
      !currentUser
    ) {
      return;
    }

    if (
      presenceChannel
    ) {

      presenceChannel
        .untrack()
        .catch(
          () => {}
        );
    }
  }
);


/* =========================================================
   PREVIEW TEXT
========================================================= */

function getPreviewText(
  message
) {

  if (
    !message
  ) {
    return "";
  }

  if (
    message.type ===
    "image"
  ) {

    return "📷 Foto";
  }

  const content =
    String(
      message.content ||
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    !content
  ) {

    return "Pesan";
  }

  if (
    content.length >
    45
  ) {

    return (
      content.slice(
        0,
        45
      ) +
      "…"
    );
  }

  return content;
}


/* =========================================================
   HELPERS
========================================================= */

function getInitial(
  name
) {

  return name
    ? name
        .trim()
        .charAt(0)
        .toUpperCase()
    : "?";
}


function formatTime(
  value
) {

  if (
    !value
  ) {
    return "";
  }

  const date =
    new Date(
      value
    );

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


function formatLastSeen(
  value
) {

  if (
    !value
  ) {

    return "Offline";
  }

  const date =
    new Date(
      value
    );

  const diff =
    Math.max(
      0,
      Date.now() -
      date.getTime()
    );

  const seconds =
    Math.floor(
      diff /
      1000
    );

  if (
    seconds < 60
  ) {

    return "Baru saja aktif";
  }

  const minutes =
    Math.floor(
      seconds /
      60
    );

  if (
    minutes < 60
  ) {

    return (
      "Aktif " +
      minutes +
      " menit lalu"
    );
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  if (
    hours < 24
  ) {

    return (
      "Aktif " +
      hours +
      " jam lalu"
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
   AUTH EVENTS
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


/* =========================================================
   CHAT EVENTS

   FINAL:
   ENTER = SEND
   SHIFT + ENTER = NEW LINE
========================================================= */

sendButton
  .addEventListener(
    "click",
    sendMessage
  );


messageInput
  .addEventListener(
    "input",
    () => {

      autoResizeMessageInput();

      handleLocalTyping();
    }
  );


messageInput
  .addEventListener(
    "paste",
    event => {

      const items =
        Array.from(
          event.clipboardData
            ? event.clipboardData.items
            : []
        );

      const imageItem =
        items.find(
          item =>
            item.type &&
            item.type.startsWith(
              "image/"
            )
        );

      if (
        !imageItem
      ) {
        return;
      }

      event.preventDefault();

      if (
        editingMessage
      ) {

        alert(
          "Selesaikan edit pesan terlebih dahulu."
        );

        return;
      }

      const file =
        imageItem.getAsFile();

      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
      ];

      if (
        !file ||
        !allowed.includes(
          file.type
        )
      ) {

        alert(
          "Format gambar harus JPG, PNG, WEBP, atau GIF."
        );

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {

        alert(
          "Ukuran gambar maksimal 5 MB."
        );

        return;
      }

      showPastedImage(
        file
      );

      messageInput.focus();
    }
  );


messageInput
  .addEventListener(
    "keydown",
    event => {

      /*
       * ENTER BIASA
       * = KIRIM PESAN
       *
       * SHIFT + ENTER
       * = BARIS BARU
       */
      if (
        event.key ===
        "Enter"
        &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

        return;
      }

      /*
       * Shift + Enter tidak dicegah.
       * Browser otomatis membuat newline.
       */


      /*
       * ESC
       * batalkan edit / reply.
       */
      if (
        event.key ===
        "Escape"
      ) {

        if (
          editingMessage
        ) {

          cancelEdit();

        } else if (
          replyingTo
        ) {

          cancelReply();
        }
      }
    }
  );


cancelReplyButton
  .addEventListener(
    "click",
    cancelReply
  );


cancelEditButton
  .addEventListener(
    "click",
    cancelEdit
  );


cancelImagePasteButton
  .addEventListener(
    "click",
    () => {

      clearPastedImage();

      messageInput.focus();
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


editNameButton
  .addEventListener(
    "click",
    editDisplayName
  );


/* =========================================================
   EMOJI EVENTS
========================================================= */

emojiButton
  .addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleEmojiPanel();
    }
  );


renderEmojiPanel();


/* =========================================================
   MESSAGE MENU EVENTS
========================================================= */

messageMenuBackdrop
  .addEventListener(
    "click",
    closeMessageMenu
  );


menuReply
  .addEventListener(
    "click",
    () => {

      const message =
        selectedMessage;

      closeMessageMenu();

      if (
        message
      ) {

        startReply(
          message
        );
      }
    }
  );


menuCopy
  .addEventListener(
    "click",
    async () => {

      const message =
        selectedMessage;

      closeMessageMenu();

      if (
        message
      ) {

        await copyMessage(
          message
        );
      }
    }
  );


menuEdit
  .addEventListener(
    "click",
    () => {

      const message =
        selectedMessage;

      closeMessageMenu();

      if (
        message
      ) {

        startEdit(
          message
        );
      }
    }
  );


menuDelete
  .addEventListener(
    "click",
    async () => {

      const message =
        selectedMessage;

      closeMessageMenu();

      if (
        message
      ) {

        await deleteMessage(
          message
        );
      }
    }
  );


/* =========================================================
   WALLPAPER EVENTS
========================================================= */

wallpaperButton
  .addEventListener(
    "click",
    openWallpaperModal
  );


closeWallpaperModal
  .addEventListener(
    "click",
    closeWallpaperDialog
  );


wallpaperModal
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        wallpaperModal
      ) {

        closeWallpaperDialog();
      }
    }
  );


chooseWallpaperButton
  .addEventListener(
    "click",
    () => {

      wallpaperInput.click();
    }
  );


wallpaperInput
  .addEventListener(
    "change",
    handleWallpaperSelection
  );


saveWallpaperButton
  .addEventListener(
    "click",
    saveWallpaper
  );


removeWallpaperButton
  .addEventListener(
    "click",
    removeWallpaper
  );


/* =========================================================
   GLOBAL CLICK
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !emojiPanel
        .classList
        .contains(
          "hidden"
        )
      &&
      !emojiPanel.contains(
        event.target
      )
      &&
      event.target !==
      emojiButton
    ) {

      closeEmojiPanel();
    }
  }
);


/* =========================================================
   TAB VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  async () => {

    /*
     * User kembali membuka tab.
     */
    if (
      document.visibilityState ===
      "visible"
    ) {

      await updateLastSeen();

      /*
       * Kalau conversation sedang terbuka,
       * pesan room tersebut dianggap dibaca.
       */
      if (
        currentPartner &&
        appScreen
          .classList
          .contains(
            "chat-open"
          )
      ) {

        await loadMessages();

        await markAsRead();
      }

      /*
       * Sync unread dari database.
       */
      await loadUsers();

      refreshStatusDisplay();

      updateNotificationIndicator();

    } else {

      /*
       * User pindah tab.
       * Matikan typing.
       */
      await sendTypingState(
        false
      );
    }
  }
);


/* =========================================================
   START
========================================================= */

init();

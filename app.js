/* =========================================================
   PRIVATE CHAT
   SUPABASE REALTIME V2.2
   - Realtime Message
   - Realtime Unread
   - Read Receipt
   - Realtime Presence Online / Offline
   - Last Seen
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
let presenceChannel = null;

/*
 * Menyimpan ID user yang sedang online.
 */
let onlineUsers = new Set();

/*
 * Timer untuk refresh tulisan:
 * "Aktif 1 menit lalu"
 */
let lastSeenTimer = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loginScreen =
  document.getElementById("loginScreen");

const appScreen =
  document.getElementById("appScreen");


/* AUTH */

const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginStatus =
  document.getElementById("loginStatus");


const registerName =
  document.getElementById("registerName");

const registerEmail =
  document.getElementById("registerEmail");

const registerPassword =
  document.getElementById("registerPassword");

const registerPassword2 =
  document.getElementById("registerPassword2");

const registerButton =
  document.getElementById("registerButton");

const registerStatus =
  document.getElementById("registerStatus");


const showRegisterButton =
  document.getElementById("showRegisterButton");

const showLoginButton =
  document.getElementById("showLoginButton");


/* APP */

const myName =
  document.getElementById("myName");

const myEmail =
  document.getElementById("myEmail");

const logoutButton =
  document.getElementById("logoutButton");

const userList =
  document.getElementById("userList");

const emptyChat =
  document.getElementById("emptyChat");

const conversation =
  document.getElementById("conversation");

const partnerName =
  document.getElementById("partnerName");

const partnerInitial =
  document.getElementById("partnerInitial");

const partnerStatus =
  document.getElementById("partnerStatus");

const backButton =
  document.getElementById("backButton");

const messagesElement =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* REPLY */

const activeReply =
  document.getElementById("activeReply");

const activeReplyTitle =
  document.getElementById("activeReplyTitle");

const activeReplyText =
  document.getElementById("activeReplyText");

const cancelReplyButton =
  document.getElementById("cancelReplyButton");


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
          event === "SIGNED_OUT"
        ) {

          cleanupRealtime();

          clearInterval(
            lastSeenTimer
          );

          currentUser = null;
          currentProfile = null;
          currentPartner = null;

          profiles = [];

          serverMessages = [];
          pendingMessages = [];

          onlineUsers.clear();

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

  loginStatus.textContent = "";
  registerStatus.textContent = "";

  setTimeout(
    () => loginEmail.focus(),
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

  loginStatus.textContent = "";
  registerStatus.textContent = "";

  setTimeout(
    () => registerName.focus(),
    100
  );
}


/* =========================================================
   REGISTER
========================================================= */

async function registerAccount() {

  const name =
    registerName.value.trim();

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


  registerButton.disabled = true;

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

          email: email,

          password: password,

          options: {

            data: {
              name: name
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


  loginButton.disabled = true;

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

          email: email,
          password: password

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


  currentPartner = null;

  appScreen.classList.remove(
    "chat-open"
  );

  conversation.classList.add(
    "hidden"
  );

  emptyChat.classList.remove(
    "hidden"
  );


  /*
   * Update waktu aktif terakhir.
   */
  await updateLastSeen();


  /*
   * Load daftar user + unread.
   */
  await loadUsers();


  /*
   * Realtime messages.
   */
  subscribeRealtime();


  /*
   * Realtime Presence.
   */
  subscribePresence();


  /*
   * Kita TIDAK lagi heartbeat database
   * setiap 20 detik.
   *
   * Timer ini hanya refresh tampilan
   * "Aktif X menit lalu".
   */
  clearInterval(
    lastSeenTimer
  );

  lastSeenTimer =
    setInterval(
      refreshStatusDisplay,
      30000
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
      .from("profiles")
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


  currentProfile = data;

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
      .from("profiles")
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
    (data || []).map(
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
                  old.unread_count || 0
                )
              : 0,

          last_message:
            old
              ? old.last_message || ""
              : "",

          last_message_at:
            old
              ? old.last_message_at || ""
              : ""

        };
      }
    );


  await loadUserPreviews();
}


/* =========================================================
   USER PREVIEWS + UNREAD
========================================================= */

async function loadUserPreviews() {

  if (!currentUser) {
    return;
  }


  const rendered = [];


  for (
    const profile
    of profiles
  ) {

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
        "Unread count:",
        countError
      );
    }


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
          ? getPreviewText(last)
          : "",

      last_message_at:
        last
          ? last.created_at
          : ""

    });
  }


  profiles = rendered;

  sortProfiles();

  renderUsers();
}


/* =========================================================
   SORT USERS
========================================================= */

function sortProfiles() {

  profiles.sort(
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


      if (
        bTime !== aTime
      ) {

        return bTime - aTime;
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

  /*
   * Bersihkan channel Presence lama
   * kalau ada.
   */
  if (presenceChannel) {

    supabaseClient
      .removeChannel(
        presenceChannel
      );

    presenceChannel = null;
  }


  onlineUsers.clear();


  /*
   * Semua user masuk ke room Presence
   * yang sama.
   */
  presenceChannel =
    supabaseClient.channel(
      "private-chat-presence",
      {

        config: {

          presence: {

            /*
             * Satu user = satu presence key.
             */
            key:
              currentUser.id

          }

        }

      }
    );


  /*
   * SYNC
   *
   * Dipanggil saat daftar user online
   * berubah.
   */
  presenceChannel.on(
    "presence",
    {
      event: "sync"
    },
    () => {

      syncOnlineUsers();
    }
  );


  /*
   * JOIN
   *
   * Ada user masuk / membuka aplikasi.
   */
  presenceChannel.on(
    "presence",
    {
      event: "join"
    },
    () => {

      syncOnlineUsers();
    }
  );


  /*
   * LEAVE
   *
   * User close tab / browser /
   * koneksi Presence terputus.
   */
  presenceChannel.on(
    "presence",
    {
      event: "leave"
    },
    () => {

      syncOnlineUsers();
    }
  );


  presenceChannel.subscribe(
    async status => {

      console.log(
        "Presence:",
        status
      );


      if (
        status === "SUBSCRIBED"
      ) {

        /*
         * Beritahu Presence:
         * "Saya sedang online."
         */
        await presenceChannel.track({

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


/* =========================================================
   SYNC ONLINE USERS
========================================================= */

function syncOnlineUsers() {

  if (!presenceChannel) {
    return;
  }


  const state =
    presenceChannel
      .presenceState();


  const newOnlineUsers =
    new Set();


  /*
   * Presence state bentuknya:
   *
   * {
   *   "USER_UUID": [...]
   * }
   *
   * Karena presence key kita adalah
   * currentUser.id, key object tersebut
   * adalah ID user.
   */
  Object.keys(
    state
  ).forEach(
    userId => {

      newOnlineUsers.add(
        userId
      );
    }
  );


  onlineUsers =
    newOnlineUsers;


  /*
   * Update tampilan sidebar +
   * header conversation.
   */
  refreshStatusDisplay();
}


/* =========================================================
   IS USER ONLINE
========================================================= */

function isUserOnline(
  userId
) {

  return onlineUsers.has(
    userId
  );
}


/* =========================================================
   REFRESH STATUS DISPLAY
========================================================= */

function refreshStatusDisplay() {

  /*
   * Refresh sidebar.
   */
  renderUsers();


  /*
   * Refresh status user yang sedang
   * dibuka.
   */
  if (currentPartner) {

    partnerStatus.textContent =
      getUserStatus(
        currentPartner
      );
  }
}


/* =========================================================
   USER STATUS
========================================================= */

function getUserStatus(
  user
) {

  if (!user) {

    return "";
  }


  /*
   * Presence adalah sumber kebenaran
   * untuk ONLINE.
   */
  if (
    isUserOnline(
      user.id
    )
  ) {

    return "Online";
  }


  /*
   * Kalau tidak ada di Presence,
   * berarti OFFLINE.
   *
   * Gunakan last_seen hanya untuk
   * menunjukkan kapan terakhir aktif.
   */
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

      button.type = "button";

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


      const status =
        document.createElement(
          "div"
        );


      /*
       * Kalau ONLINE, kita prioritaskan
       * tulisan Online.
       *
       * Kalau OFFLINE dan ada pesan,
       * tetap tampil preview pesan.
       *
       * Kalau belum ada pesan,
       * tampil last seen.
       */
      if (
        isUserOnline(
          user.id
        )
      ) {

        status.className =
          "user-status";

        status.textContent =
          "Online";

      } else if (
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
          getUserStatus(
            user
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
        () => openChat(user)
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

  const freshUser =
    profiles.find(
      item =>
        item.id === user.id
    ) || user;


  currentPartner = {
    ...freshUser
  };


  serverMessages = [];
  pendingMessages = [];

  cancelReply();


  partnerName.textContent =
    currentPartner.name;

  partnerInitial.textContent =
    getInitial(
      currentPartner.name
    );

  partnerStatus.textContent =
    getUserStatus(
      currentPartner
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


  setProfileUnread(
    currentPartner.id,
    0
  );

  renderUsers();


  await loadMessages();

  await markAsRead();


  messageInput.focus();
}


/* =========================================================
   CLOSE CHAT / BACK
========================================================= */

function closeMobileChat() {

  currentPartner = null;

  serverMessages = [];
  pendingMessages = [];

  cancelReply();


  appScreen.classList.remove(
    "chat-open"
  );

  conversation.classList.add(
    "hidden"
  );

  emptyChat.classList.remove(
    "hidden"
  );


  partnerName.textContent = "";
  partnerInitial.textContent = "";
  partnerStatus.textContent = "";

  messagesElement.innerHTML = "";


  renderUsers();
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
      .from("messages")
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
   REALTIME MESSAGE
========================================================= */

function subscribeRealtime() {

  /*
   * Hanya cleanup message channel.
   */
  if (realtimeChannel) {

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

    appScreen.classList.contains(
      "chat-open"
    );


  if (roomIsOpen) {

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
    }

  } else {

    if (
      message.receiver_id ===
        currentUser.id &&
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


  const involvesMe =

    message.sender_id ===
      currentUser.id

    ||

    message.receiver_id ===
      currentUser.id;


  if (!involvesMe) {
    return;
  }


  const index =
    serverMessages.findIndex(
      item =>
        item.id ===
        message.id
    );


  if (index !== -1) {

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
}


/* =========================================================
   SIDEBAR FROM MESSAGE
========================================================= */

function updateSidebarFromMessage(
  message
) {

  if (!currentUser) {
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
        item.id === partnerId
    );


  if (index === -1) {

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
        item.id === profileId
    );


  if (index === -1) {
    return;
  }


  profiles[index].unread_count =
    Number(
      profiles[index]
        .unread_count || 0
    ) + 1;
}


function setProfileUnread(
  profileId,
  value
) {

  const index =
    profiles.findIndex(
      item =>
        item.id === profileId
    );


  if (index === -1) {
    return;
  }


  profiles[index].unread_count =
    Number(value) || 0;
}


/* =========================================================
   PROFILE REALTIME
========================================================= */

function handleProfileUpdate(
  profile
) {

  if (!profile) {
    return;
  }


  const index =
    profiles.findIndex(
      item =>
        item.id === profile.id
    );


  if (index !== -1) {

    profiles[index] = {

      ...profiles[index],
      ...profile,

      unread_count:
        profiles[index]
          .unread_count || 0,

      last_message:
        profiles[index]
          .last_message || "",

      last_message_at:
        profiles[index]
          .last_message_at || ""

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
      getUserStatus(
        currentPartner
      );
  }


  renderUsers();
}


/* =========================================================
   CLEANUP REALTIME + PRESENCE
========================================================= */

function cleanupRealtime() {

  if (realtimeChannel) {

    supabaseClient
      .removeChannel(
        realtimeChannel
      );

    realtimeChannel = null;
  }


  if (presenceChannel) {

    /*
     * Berhenti track Presence.
     */
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

    id: null,

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


  updateSidebarFromMessage(
    optimistic
  );


  messageInput.value = "";

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
      .from("messages")
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

      failed.pending = false;
      failed.failed = true;
    }


    renderMessages(
      true
    );

    return;
  }


  if (data) {

    if (
      currentPartner &&
      currentPartner.id ===
        partnerSnapshot.id
    ) {

      const exists =
        serverMessages.some(
          item =>
            item.id === data.id
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
    !appScreen.classList.contains(
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


  const {
    error
  } =
    await supabaseClient
      .from("messages")
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

  if (!currentPartner) {
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
    (a, b) =>

      new Date(
        a.created_at
      ).getTime()

      -

      new Date(
        b.created_at
      ).getTime()
  );


  messagesElement.innerHTML = "";


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


      /* REPLY PREVIEW */

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

  if (!currentPartner) {
    return;
  }


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
   LAST SEEN
========================================================= */

async function updateLastSeen() {

  if (!currentUser) {
    return;
  }


  const now =
    new Date()
      .toISOString();


  /*
   * Update local supaya tampilan
   * langsung punya waktu terbaru.
   */
  if (currentProfile) {

    currentProfile.last_seen =
      now;
  }


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({

        last_seen:
          now

      })
      .eq(
        "id",
        currentUser.id
      );


  if (error) {

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


  if (!ok) {
    return;
  }


  /*
   * Simpan waktu terakhir aktif
   * sebelum logout.
   */
  await updateLastSeen();


  /*
   * Keluar dari Presence.
   */
  if (presenceChannel) {

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


  currentPartner = null;

  serverMessages = [];
  pendingMessages = [];


  await supabaseClient
    .auth
    .signOut();


  location.reload();
}


/* =========================================================
   SAVE LAST SEEN WHEN LEAVING PAGE
========================================================= */

/*
 * pagehide dipanggil saat user:
 * - close tab
 * - pindah halaman
 * - browser meninggalkan halaman
 *
 * Kita coba update last_seen.
 *
 * Presence tetap yang menentukan
 * ONLINE / OFFLINE.
 */
window.addEventListener(
  "pagehide",
  () => {

    if (!currentUser) {
      return;
    }


    /*
     * Tidak perlu await karena halaman
     * sedang ditutup.
     */
    supabaseClient
      .from("profiles")
      .update({

        last_seen:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        currentUser.id
      );


    /*
     * Presence akan otomatis terputus
     * ketika websocket disconnect.
     */
  }
);


/* =========================================================
   PREVIEW TEXT
========================================================= */

function getPreviewText(
  message
) {

  if (!message) {
    return "";
  }


  if (
    message.type === "image"
  ) {

    return "📷 Foto";
  }


  const content =
    String(
      message.content || ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  if (!content) {

    return "Pesan";
  }


  if (
    content.length > 45
  ) {

    return (
      content.slice(
        0,
        45
      ) + "…"
    );
  }


  return content;
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


/* =========================================================
   FORMAT LAST SEEN
========================================================= */

function formatLastSeen(value) {

  if (!value) {

    return "Offline";
  }


  const date =
    new Date(value);


  const diff =
    Math.max(
      0,
      Date.now() -
        date.getTime()
    );


  const seconds =
    Math.floor(
      diff / 1000
    );


  /*
   * PENTING:
   *
   * Tidak ada lagi:
   * diff < 30 detik = Online
   *
   * Online sekarang HANYA ditentukan
   * oleh Presence.
   */


  if (
    seconds < 60
  ) {

    return "Baru saja aktif";
  }


  const minutes =
    Math.floor(
      seconds / 60
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
      minutes / 60
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

    /*
     * Tab kembali aktif.
     */
    if (
      document.visibilityState ===
        "visible"
    ) {

      /*
       * Simpan waktu aktif terbaru.
       */
      await updateLastSeen();


      /*
       * Safety sync conversation.
       */
      if (
        currentPartner &&
        appScreen.classList.contains(
          "chat-open"
        )
      ) {

        await loadMessages();

        await markAsRead();
      }


      /*
       * Refresh sidebar/unread.
       */
      await loadUsers();


      refreshStatusDisplay();
    }
  }
);


/* =========================================================
   START
========================================================= */

init();

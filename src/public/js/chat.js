window.socket = io();
const buttonChat = document.getElementById("wrong");
const buttonAllRight = document.getElementById("allright");
const buttonResolved = document.getElementById("resolved");
const popupChat = document.getElementById("popup-wrapper-chat");
const popupReceived = document.getElementById("popup-received");
const closeButtonChat = document.getElementById("popup-close-chat");
const close = document.getElementById("enviar_menssagem_cause");
const ul = document.getElementById("messages");
const delivered = document.getElementById("delivered");
const Buttontimetosell = document.getElementById("timetosell");

const openPopupBuyer = document.getElementById("buyer");
const popupBuyer = document.getElementById("popup-buyer");
const closeButtonBuyer = document.getElementById("closeButtonBuyer");

const openPopupSeller = document.getElementById("seller");
const popupSeller = document.getElementById("popup-seller");
const closeButtonSeller = document.getElementById("closeButtonSeller");

const convertToHour = (milliseconds) => {
  const padTo2Digits = (num) => {
    return num.toString().padStart(2, "0");
  };

  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = seconds >= 30 ? minutes + 1 : minutes;

  minutes = minutes % 60;
  hours = hours % 24;

  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
    seconds
  )}`;
};
function startTimer(duration, display) {
  window.timer = duration;

  const updateTimer = () => {
    let seconds = Math.floor((duration - Date.now()) / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = seconds >= 30 ? minutes : minutes;
    minutes = minutes % 60;

    if (Number(hours) < 0 && Number(minutes) < 0 && Number(seconds) < 0) {
      window.timer = 0;
      document.querySelector("#timer").textContent = "00:00";
      buttonChat.style.display = "block";
      Buttontimetosell.style.display = "none";
      return clearInterval(window.timerInterval);
    }
    const res =
      seconds == 60
        ? hours + ":" + (minutes + 1) + ":00"
        : hours + ":" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    if (display) display.textContent = res;
  };
  updateTimer();

  window.timerInterval = setInterval(() => {
    updateTimer();
  }, 1000);
}

window.onload = function () {
  let duration = time;
  let display = document.querySelector("#timer"); // selecionando o timer
  startTimer(duration, display); // iniciando o timer

  socket.emit("join", purchaseId, userId, ({ error, msgs }) => {
    if (error) return enviar_menssagem("Something going wrong");
    console.log("msgs >>>", msgs);

    msgs.forEach((e) => {
      if (e.startsWith("/chat/")) {
        const imgNode = document.createElement("img");
        imgNode.src = e;
        imgNode.style.cursor = "pointer";
        imgNode.onclick = () => window.open(imgNode.src, "__blank");
        ul.appendChild(imgNode);
        setTimeout(() => ul.scrollTo(0, document.body.scrollHeight), 150);
      } else {
        const li = document.createElement("li");
        console.log(userId, sellerId, buyerId);
        li.appendChild(document.createTextNode(e));
        if (
          !e.includes("| " + sellerName + ":") &&
          !e.includes(buyerName + ":")
        ) {
          li.classList.add("admin");
        }
        ul.appendChild(li);
      }
      ul.scrollTo(0, document.body.scrollHeight);
    });
  });
};

document
  .getElementById("menssagem")
  ?.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) {
      const msg = document.getElementById("menssagem").value;
      enviar_menssagem(msg);
    }
  });

document
  .getElementById("menssagem_resolve")
  ?.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) {
      const msgResolve = document.getElementById("menssagem_resolve").value;
      enviar_menssagem(msgResolve);
    }
  });

document
  .getElementById("menssagem_cause")
  ?.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) {
      const msgCause = document.getElementById("menssagem_cause").value;
      enviar_menssagem(msgCause);
    }
  });

var motivo = [];
var ultimas_mensagens = [];

function pegarDataAtual() {
  return new Date().toLocaleString("en-us");
}

document.getElementById("enviar_menssagem")?.addEventListener("click", () => {
  const msg = document.getElementById("menssagem").value;
  enviar_menssagem(msg);
});

document
  .getElementById("enviar_menssagem_cause")
  ?.addEventListener("click", () => {
    const msgCause = document.getElementById("menssagem_cause").value;
    enviar_menssagem_warn(msgCause);
  });

document
  .getElementById("enviar_menssagem_resolve")
  ?.addEventListener("click", () => {
    const msgResolve = document.getElementById("menssagem_resolve").value;
    enviar_menssagem_resolved(msgResolve);
  });

document.getElementById("delivered")?.addEventListener("click", () => {
  socket.emit(
    "chat message",
    purchaseId,
    pegarDataAtual() + " | " + "System" + ": " + "Purchase Delivered!"
  );
});

function armazenaMensagem(msg) {
  if (ultimas_mensagens.length > 20) {
    ultimas_mensagens.shift();
  }
  ultimas_mensagens.push(msg);
}

function enviar_menssagem(msg) {
  console.log("err console", msg);
  if (msg.length > 0) {
    console.log(msg);
    socket.emit(
      "chat message",
      purchaseId,
      pegarDataAtual() + " | " + nome_usuario + ": " + msg
    );
    document.getElementById("menssagem").value = "";
  }
}

function enviar_menssagem_resolved(msgResolve) {
  console.log("err console >>>>>>>>>>>>>>>", msgResolve);
  if (msg.length > 0) {
    console.log(msgResolve);
    socket.emit(
      "chat message",
      purchaseId,
      pegarDataAtual() + " | " + "System" + ": " + msgResolve
    );
    document.getElementById("menssagem_resolve").value = "";
  }
}

function enviar_menssagem_warn(msgCause) {
  if (msgCause.length > 0) {
    socket.emit(
      "new cause",
      purchaseId,
      userId,
      msgCause,
      sellerId,
      ({ error, message }) => {
        if (error) return console.log(message);

        socket.emit(
          "chat message",
          purchaseId,
          pegarDataAtual() +
            " | " +
            "System" +
            ": " +
            "Purchase not delivered, a dispute has been opened!"
        );
        document.getElementById("menssagem_cause").value = "";
        location.reload();
      }
    );
  }
}

socket.on("chat message", function (msg, id) {
  const li = document.createElement("li");
  const br = document.createElement("br");

  if (
    !msg.includes("| " + sellerName + ":") &&
    !msg.includes(buyerName + ":")
  ) {
    li.classList.add("admin");
  }

  li.appendChild(document.createTextNode(msg));
  ul.appendChild(li);
  ul.scrollTo(0, document.body.scrollHeight);
});

socket.on("chat image", function (img) {
  const imgNode = document.createElement("img");
  const br = document.createElement("br");
  imgNode.src = "/chat/" + img;
  imgNode.style.cursor = "pointer";
  imgNode.onclick = () => window.open(imgNode.src, "__blank");
  ul.appendChild(imgNode);
  ul.appendChild(br);
  setTimeout(() => ul.scrollTo(0, document.body.scrollHeight), 150);
});

buttonResolved?.addEventListener("click", () => {
  popupChat.style.display = "block";
});

buttonChat?.addEventListener("click", () => {
  popupChat.style.display = "block";
});

buttonAllRight?.addEventListener("click", () => {
  popupReceived.style.display = "block";
});

closeButtonChat?.addEventListener("click", () => {
  popupChat.style.display = "none";
});

close?.addEventListener("click", () => {
  popupChat.style.display = "none";
});

openPopupBuyer?.addEventListener("click", () => {
  popupBuyer.style.display = "block";
});

closeButtonBuyer?.addEventListener("click", () => {
  popupBuyer.style.display = "none";
});

popupBuyer?.addEventListener("click", () => {
  popupBuyer.style.display = "none";
});

openPopupSeller?.addEventListener("click", () => {
  popupSeller.style.display = "block";
});

closeButtonSeller?.addEventListener("click", () => {
  popupSeller.style.display = "none";
});

popupSeller?.addEventListener("click", () => {
  popupSeller.style.display = "none";
});

const confirmReceived = async () => {
  location.href = "/chat/finish/" + purchaseId;
};

var upload = document.getElementById("file-input");
upload.addEventListener("change", function (e) {
  var size = upload.files[0].size;
  if (size < 1048576) {
  }
});

const uploadImg = async (ev) => {
  const form = new FormData();
  form.append("image", ev.files[0]);
  const { file } = await (
    await fetch(location.href + "/uploadimg", { method: "POST", body: form })
  ).json();
  console.log(file, purchaseId);
  socket.emit(
    "chat message",
    purchaseId,
    pegarDataAtual() + " | " + nome_usuario + ": "
  );
  socket.emit("chat image", purchaseId, file);
};

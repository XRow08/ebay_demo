const openPopup = document.getElementById("deposit");
const openPixPopup = document.getElementById("openPixPopup");
const openBitPopup = document.getElementById("openBitPopup");

const popup = document.getElementById("popup-wrapper");
const allDeposits = document.getElementById("allDeposits");
const popupPix = document.getElementById("popupPix");
const popupBit = document.getElementById("popupBit");

function closePopup() {
  popup.style.display = "none";
}
function backPopup() {
  allDeposits.style.display = "flex";
  popupPix.style.display = "none";
  popupBit.style.display = "none";
}

openPopup?.addEventListener("click", () => {
  popup.style.display = "flex";
  allDeposits.style.display = "flex";
  popupPix.style.display = "none";
  popupBit.style.display = "none";
});

openPixPopup?.addEventListener("click", () => {
  popupPix.style.display = "flex";
  allDeposits.style.display = "none";
});

openBitPopup?.addEventListener("click", () => {
  popupBit.style.display = "flex";
  allDeposits.style.display = "none";
});

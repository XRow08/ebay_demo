const buttons = document.querySelectorAll("#two");
const popup = document.querySelector("#popup-wrapper");
const closeButton = document.querySelector("#popup-close");

buttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    open_popup(e.target.parentNode.attributes.product?.value);
  });
});
closeButton.addEventListener("click", () => {
  popup.style.display = "none";
});

const open_popup = (id) => {
  document.querySelector(".id-product").value = `${id}`;
  document.querySelector(".popup-link").action = `/seller/delete/${id}`;
  popup.style.display = "block";
};
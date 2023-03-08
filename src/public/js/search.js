function search() {
  const input = document.getElementById('myFilter').value.toUpperCase();
  const cardContainer = document.getElementById('products');
  const cards = cardContainer.getElementsByClassName('card');

  for(let i = 0; i < cards.length; i++) {
      let title = cards[i].querySelector("strong.title")
      if(title.innerText.toUpperCase().indexOf(input) > -1) {
          cards[i].style.display = "";
      } else {
          cards[i].style.display = "none";
      }
  }
}
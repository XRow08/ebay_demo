const currentLocation = location.href;
const menuItem = document.getElementsByClassName('a');
const menuLength = menuItem.length;
for(let i = 0; i<menuLength; i++) {
  if(menuItem[i].href === currentLocation) {
    menuItem[i].className = "active";
  }
}

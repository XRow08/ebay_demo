$(document).ready(function(){
  $('.menu-btn, .menu a').click(function(){
      $('.sidebar .menu').toggleClass("active");
      $('.menu-btn i').toggleClass("active");
  });
});